import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs/promises'; // Use promises version of fs
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const revalidate = 0; // Ensure no caching

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Helper to ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Helper to delete files
async function deleteFile(filename: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', filename);
    await fs.unlink(filePath);
  } catch (error: unknown) {
    // Ignore error if file doesn't exist
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code !== 'ENOENT') {
      console.error(`Failed to delete file: ${filename}`, error);
    }
  }
}

// GET a single product by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [product, reviewAggregate, relatedProductsData] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          images: { select: { id: true, url: true }, orderBy: { createdAt: 'asc' }, take: 10 },
          detailImages: { select: { id: true, url: true }, orderBy: { order: 'asc' }, take: 10 },
          videos: { select: { id: true, url: true }, orderBy: { createdAt: 'asc' }, take: 10 },
          category: true, // Include category information
        },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: { productId: id },
      }),
      prisma.product.findMany({
        where: {
          categoryId: (await prisma.product.findUnique({ where: { id }, select: { categoryId: true } }))?.categoryId,
          id: { not: id },
        },
        include: { images: { select: { id: true, url: true } } },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const averageRating = reviewAggregate._avg.rating ? parseFloat(reviewAggregate._avg.rating.toFixed(1)) : 0;
    const reviewCount = reviewAggregate._count._all;
    const relatedProducts = relatedProductsData || [];

    // Return product with average rating, review count, and related products
    const productWithDetails = {
      ...product,
      averageRating,
      reviewCount,
      relatedProducts,
    };

    return NextResponse.json(productWithDetails, { status: 200 });
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// PUT (update) a product by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    const formData = await request.formData();

    // --- Data Extraction ---
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const stock = formData.get('stock') as string; // New: Extract stock
    const categoryId = formData.get('categoryId') as string;
    const detailContent = formData.get('detailContent')?.toString(); // Extract detailContent
    const newImages = formData.getAll('newImages') as File[];
    const newDetailImages = formData.getAll('newDetailImages') as File[];
    const imagesToDelete = JSON.parse(formData.get('imagesToDelete') as string || '[]') as string[];
    const detailImagesToDelete = JSON.parse(formData.get('detailImagesToDelete') as string || '[]') as string[];
    const newVideos = formData.getAll('newVideos') as File[];
    const videosToDelete = JSON.parse(formData.get('videosToDelete') as string || '[]') as string[];

    await ensureUploadDir();

    // --- Prepare Data for Update ---
    const updateData: Prisma.ProductUpdateInput = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    // Handle stock: only parse if it's a non-empty string, otherwise it's undefined
    if (stock !== undefined && stock !== null && stock !== '') {
      updateData.stock = parseInt(stock);
    } else {
      updateData.stock = undefined; // Ensure it's not set if empty
    }
    if (categoryId) {
      updateData.category = { connect: { id: categoryId } };
    }
    if (detailContent) updateData.detailContent = detailContent; // Add detailContent to updateData

    // --- Handle New Image Uploads ---
    const newImageRecords = [];
    for (const image of newImages) {
      if (image && image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const filename = `${Date.now()}-main-${image.name.replace(/\s+/g, '-')}`;
        await fs.writeFile(path.join(uploadDir, filename), buffer);
        newImageRecords.push({ url: `/uploads/${filename}` });
      }
    }
    if (newImageRecords.length > 0) {
      updateData.images = { create: newImageRecords };
    }

    const newDetailImageRecords = [];
    // We need to get the current max order to continue the sequence
    const lastDetailImage = await prisma.productDetailImage.findFirst({
        where: { productId: id },
        orderBy: { order: 'desc' },
    });
    let currentOrder = lastDetailImage ? lastDetailImage.order + 1 : 0;

    for (const image of newDetailImages) {
      if (image && image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const filename = `${Date.now()}-detail-${currentOrder}-${image.name.replace(/\s+/g, '-')}`;
        await fs.writeFile(path.join(uploadDir, filename), buffer);
        newDetailImageRecords.push({ url: `/uploads/${filename}`, order: currentOrder++ });
      }
    }
    if (newDetailImageRecords.length > 0) {
      updateData.detailImages = { create: newDetailImageRecords };
    }

    const newVideoRecords = [];
    const videoUploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    try {
      await fs.access(videoUploadDir);
    } catch {
      await fs.mkdir(videoUploadDir, { recursive: true });
    }

    for (const video of newVideos) {
      if (video && video.size > 0) {
        const buffer = Buffer.from(await video.arrayBuffer());
        const filename = `${Date.now()}-video-${video.name.replace(/\s+/g, '-')}`;
        await fs.writeFile(path.join(videoUploadDir, filename), buffer);
        newVideoRecords.push({ url: `/uploads/videos/${filename}` });
      }
    }
    if (newVideoRecords.length > 0) {
      updateData.videos = { create: newVideoRecords };
    }

    // --- Transaction for Deletes and Update ---
    const transactionOperations = [];

    // 1. Find records to delete to get their URLs
    const imagesToDeleteRecords = await prisma.productImage.findMany({ where: { id: { in: imagesToDelete } } });
    const detailImagesToDeleteRecords = await prisma.productDetailImage.findMany({ where: { id: { in: detailImagesToDelete } } });
    const videosToDeleteRecords = await prisma.productVideo.findMany({ where: { id: { in: videosToDelete } } });

    // 2. Add DB delete operations to transaction
    if (imagesToDelete.length > 0) {
      transactionOperations.push(prisma.productImage.deleteMany({ where: { id: { in: imagesToDelete } } }));
    }
    if (detailImagesToDelete.length > 0) {
      transactionOperations.push(prisma.productDetailImage.deleteMany({ where: { id: { in: detailImagesToDelete } } }));
    }
    if (videosToDelete.length > 0) {
      transactionOperations.push(prisma.productVideo.deleteMany({ where: { id: { in: videosToDelete } } }));
    }

    console.log('Updating product with detailContent:', updateData.detailContent); // Log detailContent
    // 3. Add product update operation to transaction
    transactionOperations.push(prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true, detailImages: true, videos: true }, // Include videos
    }));

    // 4. Execute transaction
    const results = await prisma.$transaction(transactionOperations);
    const updatedProduct = results[results.length - 1]; // The result of the last operation is the updated product

    // 5. Delete files from disk after DB transaction is successful
    for (const image of imagesToDeleteRecords) {
      await deleteFile(image.url);
    }
    for (const image of detailImagesToDeleteRecords) {
      await deleteFile(image.url);
    }
    for (const video of videosToDeleteRecords) { // Delete video files
      await deleteFile(video.url);
    }

    return NextResponse.json({ message: 'Product updated successfully', product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong during product update' }, { status: 500 });
  }
}

// DELETE a product by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    // The `onDelete: Cascade` in the schema will handle deleting related DB records.
    // We are no longer deleting files from disk, as they might be used by the original SourcedProduct.
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}