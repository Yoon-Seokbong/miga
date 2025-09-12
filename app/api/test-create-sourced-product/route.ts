import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
  try {
    const fixedPrice = 123456; // Hardcoded integer price
    const testName = `Test Product ${Date.now()}`; // Unique name

    const newSourcedProduct = await prisma.sourcedProduct.create({
      data: {
        sourceUrl: `http://test.com/${Date.now()}`,
        sourcePlatform: 'TestPlatform',
        originalName: testName,
        translatedName: testName,
        originalPrice: 100, // Original price as float
        currency: 'USD',
        localPrice: fixedPrice, // Our test price
        status: 'PENDING',
        detailContent: '<p>Test detail content for fixed price.</p>',
        images: [], // Empty JSON array
        videos: [], // Empty JSON array
        attributes: {}, // Empty JSON object
      },
    });

    return NextResponse.json(newSourcedProduct, { status: 200 });
  } catch (error) {
    console.error('Failed to create test sourced product:', error);
    return NextResponse.json({ error: 'Failed to create test sourced product' }, { status: 500 });
  }
}