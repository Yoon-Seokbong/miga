import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteNaverProduct } from '@/lib/naver-api';

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

    // 1. Fetch our product to get the Naver Origin Product ID
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { naverOriginProductNo: true }, // Only select the Naver ID
    });

    if (!product || !product.naverOriginProductNo) {
      return NextResponse.json({ error: 'Naver Product ID not found for this product.' }, { status: 404 });
    }

    // 2. Call the Naver API to delete the product
    console.log(`Deleting Naver product with ID: ${product.naverOriginProductNo}`);
    const naverResponse = await deleteNaverProduct(product.naverOriginProductNo);

    return NextResponse.json({ 
        message: 'Successfully deleted product from Naver!', 
        naverResponse 
    });

  } catch (error) {
    console.error('Failed to delete product from Naver:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to delete product from Naver', details: errorMessage }, { status: 500 });
  }
}
