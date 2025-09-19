import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, ContentStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET reviews for a specific product
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const minRating = searchParams.get('minRating');
    const sortBy = searchParams.get('sortBy');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (!isAdmin) {
      where.status = 'APPROVED';
    }

    if (productId) {
      where.productId = productId;
    }

    if (minRating) {
      where.rating = { gte: parseInt(minRating) };
    }

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' };

    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'highest-rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'lowest-rating') {
      orderBy = { rating: 'asc' };
    }

    const videoInclude = isAdmin ? true : { where: { status: ContentStatus.APPROVED } };

    const [reviews, totalCount] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          images: true,
          videos: videoInclude,
          product: { select: { id: true, name: true } }, // Include product for admin view
        },
        orderBy,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while fetching reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const rating = parseInt(formData.get('rating') as string);
    const comment = formData.get('comment') as string;
    const images = formData.getAll('images') as File[];

    if (!productId || !rating) {
      return NextResponse.json({ message: 'Product ID and rating are required' }, { status: 400 });
    }

    // Verify that the user has purchased the product, unless they are an admin
    if (session.user.role !== 'ADMIN') {
      const purchasedOrder = await prisma.order.findFirst({
        where: {
          userId: userId,
          status: 'PAID',
          lineItems: {
            some: {
              productId: productId,
            },
          },
        },
      });

      if (!purchasedOrder) {
        return NextResponse.json(
          { message: 'You can only review products you have purchased.' },
          { status: 403 }
        );
      }
    }


    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'review-images');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const uploadedImageUrls = [];
    for (const image of images) {
      if (image && image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const filename = `${Date.now()}-review-${image.name.replace(/\s+/g, '-')}`;
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        uploadedImageUrls.push({ url: `/uploads/review-images/${filename}` });
      }
    }

    const newReview = await prisma.review.create({
      data: {
        productId,
        userId: userId,
        rating,
        comment,
        status: 'APPROVED',
        images: {
          create: uploadedImageUrls,
        },
      },
      include: { images: true, videos: true },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while creating the review' }, { status: 500 });
  }
}