import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNaverProduct } from '@/lib/naver-api';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Fetch product data from our database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true, detailImages: true }, // Include detailImages for Naver if needed
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Register the product on Naver
    console.log(`Registering product to Naver Smart Store...`);
    const naverResponse = await createNaverProduct(product);

    return NextResponse.json({ 
        message: 'Successfully registered product to Naver Smart Store!', 
        naverResponse 
    });

  } catch (error) {
    console.error('Failed to upload product to Naver:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to upload product to Naver', details: errorMessage }, { status: 500 });
  }
}
