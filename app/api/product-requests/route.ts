import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET all product requests
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view product requests.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [requests, totalCount] = await prisma.$transaction([
      prisma.productRequest.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.productRequest.count(),
    ]);

    return NextResponse.json({ requests, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product requests:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// POST a new product request
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const productName = formData.get('productName') as string;
    const productUrl = formData.get('productUrl') as string | null;
    const description = formData.get('description') as string | null;
    const requesterEmail = formData.get('requesterEmail') as string | null;
    const image = formData.get('image') as File | null;

    if (!productName) {
      return NextResponse.json({ message: 'Product name is required' }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const buffer = Buffer.from(await image.arrayBuffer());
      const filename = `${Date.now()}-${image.name.replace(/\s+/g, '-')}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    const productRequest = await prisma.productRequest.create({
      data: {
        productName,
        productUrl,
        description,
        requesterEmail,
        imageUrl,
      },
    });

    return NextResponse.json({ message: 'Product request submitted successfully', productRequest }, { status: 201 });
  } catch (error) {
    console.error('Error submitting product request:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}