
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCoupangProduct } from '@/lib/coupang-api';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log('--- [DEBUG] Received body for Coupang registration ---', body);
    const { productId, categoryCode } = body;
    if (!productId || !categoryCode) {
      return NextResponse.json({ error: 'Product ID and Category Code are required' }, { status: 400 });
    }

    // 1. Fetch our product from the database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Call the function to create the product on Coupang
    const coupangResponse = await createCoupangProduct(product, categoryCode);

    // 3. Update our database with the Coupang seller product ID
    await prisma.product.update({
      where: { id: productId },
      data: { coupangSellerProductId: coupangResponse.sellerProductId.toString() },
    });

    return NextResponse.json({ 
      message: 'Product successfully registered on Coupang!', 
      coupangData: coupangResponse 
    });

  } catch (error) {
    console.error('Failed to register product on Coupang:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to register product on Coupang', details: errorMessage }, { status: 500 });
  }
}
