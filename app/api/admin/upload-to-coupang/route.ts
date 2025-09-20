import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictCategory, createCoupangProduct } from '@/lib/coupang-api';

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
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Predict Coupang category
    console.log(`Predicting Coupang category for: ${product.name}`);
    const predictedCategory = await predictCategory(product.name);
    if (!predictedCategory || !predictedCategory.categoryId) {
        throw new Error('Could not predict Coupang category.');
    }
    console.log(`Predicted Category ID: ${predictedCategory.categoryId}`);

    // 3. Register the product on Coupang
    console.log(`Registering product to Coupang...`);
    const coupangResponse = await createCoupangProduct(product, predictedCategory.categoryId);

    // After successful registration, save the returned Coupang ID to our database
    if (coupangResponse && coupangResponse.sellerProductId) {
      await prisma.product.update({
        where: { id: productId },
        data: { coupangSellerProductId: String(coupangResponse.sellerProductId) },
      });
      console.log(`Associated Coupang Seller Product ID ${coupangResponse.sellerProductId} with our product ${productId}`);
    }

    return NextResponse.json({ 
        message: 'Successfully registered product to Coupang!', 
        coupangResponse 
    });

  } catch (error) {
    console.error('Failed to upload product to Coupang:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to upload product to Coupang', details: errorMessage }, { status: 500 });
  }
}
