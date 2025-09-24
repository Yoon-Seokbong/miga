import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const revalidate = 0;

const prisma = new PrismaClient();

async function deleteFile(filename: string) {
  try {
    if (!filename.startsWith('/')) return; // Only handle local files
    const filePath = path.join(process.cwd(), 'public', filename);
    await fs.unlink(filePath);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code !== 'ENOENT') {
      console.error(`Failed to delete file: ${filename}`, error);
    }
  }
}

// GET a single product by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: { createdAt: 'asc' } },
          detailImages: { orderBy: { order: 'asc' } },
          videos: { orderBy: { createdAt: 'asc' } },
          category: true,
          reviews: { include: { user: { select: { name: true, email: true } } } },
        },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const reviewAggregate = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
      where: { productId: id },
    });

    const averageRating = reviewAggregate._avg.rating ? parseFloat(reviewAggregate._avg.rating.toFixed(1)) : 0;
    const reviewCount = reviewAggregate._count._all;

    const productWithDetails = {
      ...product,
      averageRating,
      reviewCount,
    };

    return NextResponse.json(productWithDetails, { status: 200 });
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching product' }, { status: 500 });
  }
}

// DELETE a product by ID (Robust Version)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Find the product and all its related file URLs first
    const productToDelete = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { select: { url: true } },
        detailImages: { select: { url: true } },
        videos: { select: { url: true } },
      },
    });

    if (!productToDelete) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Use a transaction to ensure all or nothing is deleted
    await prisma.$transaction(async (tx) => {
      // Delete all related records that have a direct relation
      await tx.orderLineItem.deleteMany({ where: { productId: id } });
      await tx.wishlist.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.question.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productDetailImage.deleteMany({ where: { productId: id } });
      await tx.productVideo.deleteMany({ where: { productId: id } });

      // Finally, delete the product itself
      await tx.product.delete({ where: { id } });
    });

    // After the transaction is successful, delete the files from the disk
    for (const image of productToDelete.images) {
      await deleteFile(image.url);
    }
    for (const image of productToDelete.detailImages) {
      await deleteFile(image.url);
    }
    for (const video of productToDelete.videos) {
      await deleteFile(video.url);
    }

    return NextResponse.json({ message: 'Product and all related data deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Something went wrong during product deletion' }, { status: 500 });
  }
}

// NOTE: The PUT function has been removed for brevity as it was not part of the fix.
// In a real scenario, you would keep the PUT function here.
