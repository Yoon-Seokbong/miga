import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Disable body parsing for this route to handle FormData manually
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering
export const fetchCache = 'force-no-store'; // Ensure no caching

export const runtime = 'nodejs'; // Specify runtime environment

export const preferredRegion = 'auto'; // Specify preferred region

export const maxDuration = 60; // Specify max duration

export const revalidate = 0; // Specify revalidate

export const dynamicParams = true; // Specify dynamicParams



export async function GET(request: Request) {
  console.log('--- PRODUCTS API ROUTE HIT ---');
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const orderByParam = searchParams.get('orderBy');
    const orderParam = searchParams.get('order');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const brand = searchParams.get('brand');
    const tagsParam = searchParams.get('tags');

    const where: Prisma.ProductWhereInput = {};

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brand) {
      where.brand = brand;
    }

    if (tagsParam) {
      const tagsArray = tagsParam.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tagsArray.length > 0) {
        (where.OR as Prisma.ProductWhereInput[]).push(...tagsArray.map(tag => ({ tags: { contains: tag } })));
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (orderByParam && orderParam) {
      orderBy = { [orderByParam]: orderParam };
    }
    else if (orderByParam === 'price' && orderParam === 'asc') {
      orderBy = { price: 'asc' };
    }
    else if (orderByParam === 'price' && orderParam === 'desc') {
      orderBy = { price: 'desc' };
    }

    const skip = (page - 1) * pageSize;

    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          images: true,
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithTagsArray = products.map(product => ({
      ...product,
      tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
    }));

    console.log('Products API Response:', { products: productsWithTagsArray, totalCount });
    return NextResponse.json({ products: productsWithTagsArray, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products with filters/sort:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while fetching products' }, { status: 500 });
  }
}


// POST a new product with file uploads
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON body for registering sourced products
    if (contentType.includes('application/json')) {
      const { name, description, price, images, detailContent, categoryId, stock, brand, tags } = await request.json();

      if (!name || !price || !categoryId || stock === undefined) {
        return NextResponse.json({ message: 'Name, price, category, and stock are required for JSON input' }, { status: 400 });
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          brand,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()).join(',') : '',
          categoryId,
          detailContent, // Save the rich HTML content
          images: {
            create: images, // Expects an array of { url: string }
          },
        },
        include: {
          images: true,
        },
      });
      return NextResponse.json({ message: 'Product created successfully from JSON', product }, { status: 201 });
    }

    // Handle FormData for creating new products from scratch
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const priceString = formData.get('price')?.toString() || '0';
    const cleanedPriceString = priceString.replace(/,/g, '');
    const price = parseFloat(cleanedPriceString);
    const stock = parseInt(formData.get('stock')?.toString() || '0');
    const brand = formData.get('brand')?.toString();
    const tags = formData.get('tags')?.toString();
    const categoryId = formData.get('categoryId')?.toString();
    const detailContentFromForm = formData.get('detailContent')?.toString();

    const imageFiles = formData.getAll('images') as File[];
    const videoFiles = formData.getAll('videos') as File[];

    if (!name || !price || !categoryId || !stock) {
      return NextResponse.json({ message: 'Name, price, category, and stock are required for form input' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedImageUrls: { url: string }[] = [];
    for (const file of imageFiles) {
      if (file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeFilename = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${safeFilename}`;
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      uploadedImageUrls.push({ url: `/uploads/${filename}` });
    }

    const uploadedVideoUrls: { url: string }[] = [];
    for (const file of videoFiles) {
      if (file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-video-${file.name}`;
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      uploadedVideoUrls.push({ url: `/uploads/${filename}` });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        brand,
        tags: tags ? tags.split(',').map(tag => tag.trim()).join(',') : '',
        categoryId,
        detailContent: detailContentFromForm, // Use detailContent from form
        images: {
          create: uploadedImageUrls,
        },
        videos: {
          create: uploadedVideoUrls,
        },
      },
      include: {
        images: true,
        videos: true,
      },
    });

    return NextResponse.json({ message: 'Product created successfully from FormData', product }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while creating the product' }, { status: 500 });
  }
}
