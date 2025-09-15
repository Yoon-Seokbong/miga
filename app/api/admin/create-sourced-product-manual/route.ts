import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, price, description, imageUrls } = body;

    if (!name || !price || !imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { message: 'Name, price, and at least one image are required' },
        { status: 400 }
      );
    }

    const newSourcedProduct = await prisma.sourcedProduct.create({
      data: {
        sourcePlatform: 'Manual',
        originalName: name,
        translatedName: name,
        originalDescription: description,
        translatedDescription: description, // Manually entered, so original and translated are the same
        originalPrice: price,
        localPrice: price,
        currency: 'KRW',
        status: 'SOURCED',
        images: imageUrls.map((url: string) => ({ url })),
        videos: [], // No video upload in manual form for now
        attributes: [],
        sourceUrl: `manual-import-${new Date().toISOString()}` // Create a unique placeholder URL
      },
    });

    return NextResponse.json(newSourcedProduct, { status: 201 });

  } catch (error) {
    console.error('Failed to create manual sourced product:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Failed to create manual sourced product', details: errorMessage },
      { status: 500 }
    );
  }
}
