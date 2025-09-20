import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteCoupangProduct } from '@/lib/coupang-api';

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

    // 1. Fetch our product to get the Coupang Seller Product ID
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { coupangSellerProductId: true }, // Only select the Coupang ID
    });

    if (!product || !product.coupangSellerProductId) {
      return NextResponse.json({ error: 'Coupang Product ID not found for this product.' }, { status: 404 });
    }

    // 2. Call the Coupang API to delete the product
    console.log(`Deleting Coupang product with ID: ${product.coupangSellerProductId}`);
    const coupangResponse = await deleteCoupangProduct(product.coupangSellerProductId);

    return NextResponse.json({ 
        message: 'Successfully deleted product from Coupang!', 
        coupangResponse 
    });

  } catch (error) {
    console.error('Failed to delete product from Coupang:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to delete product from Coupang', details: errorMessage }, { status: 500 });
  }
}
