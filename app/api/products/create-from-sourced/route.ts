import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const sourcedProductData = await request.json();

    const { 
      id: sourcedProductId, 
      originalName,
      translatedName,
      images: imageUrls = [],
      sourcePlatform,
      detailContent, // The AI-generated HTML
      originalDescription, // Old description
      translatedDescription, // Old description
      originalPrice,
      localPrice, // The price we want to use
      stock, // Stock from sourced product
      brand,
      tags,
      videos,
      // ... any other fields from SourcedProduct that should go to Product
    } = sourcedProductData;

    const productName = translatedName || originalName;
    const productPrice = localPrice || originalPrice || 0; // Use localPrice if available
    const productStock = stock || 999; // Use stock from sourced product, default to 999
    const productBrand = brand || null;
    const productTags = tags || null; // Assuming tags are string or null

    if (!productName) {
      return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    }

    let categoryName = '기타'; // 기본값
    if (sourcePlatform === 'detail.1688.com') {
      categoryName = '구매대행 상품';
    } else if (sourcePlatform) {
      categoryName = sourcePlatform;
    }

    // Find or create category
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    const productDataForDb = {
      name: productName,
      description: detailContent || translatedDescription || originalDescription || '', // Use AI content, fallback to translated, then original
      price: productPrice,
      stock: productStock,
      brand: productBrand,
      tags: productTags,
      categoryId: category.id, // Connect to the category
      // Images, videos, detailImages are handled separately below
    };

    let finalProduct;

    // Helper to safely create image/video data
    const getAssetCreationData = () => ({
      images: {
        create: Array.isArray(imageUrls) ? imageUrls.map((url: string) => ({ url })) : [],
      },
      videos: {
        create: Array.isArray(videos) ? videos.map((video: { url: string }) => ({ url: video.url })) : [],
      },
    });

    if (sourcedProductId) { // If it's an update (assuming sourcedProductId means existing product)
      const existingProduct = await prisma.product.findUnique({
        where: { name: productName }, // Or by ID if we store product.id in sourcedProduct
      });

      if (existingProduct) {
        console.log(`[UPSERT] Updating existing product: ${existingProduct.id}`);
        await prisma.productImage.deleteMany({ where: { productId: existingProduct.id } });
        await prisma.productVideo.deleteMany({ where: { productId: existingProduct.id } });

        finalProduct = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            ...productDataForDb,
            ...getAssetCreationData(),
          },
        });
      } else {
        console.log(`[UPSERT] Creating new product (no existing found for sourcedId): ${productName}`);
        finalProduct = await prisma.product.create({
          data: {
            ...productDataForDb,
            ...getAssetCreationData(),
          },
        });
      }
    } else { // Create new product
      console.log(`[UPSERT] Creating new product: ${productName}`);
      finalProduct = await prisma.product.create({
        data: {
          ...productDataForDb,
          ...getAssetCreationData(),
        },
      });
    }

    await prisma.sourcedProduct.update({
      where: { id: sourcedProductData.id },
      data: { status: 'PUBLISHED' },
    });

    return NextResponse.json({ 
      message: 'Product published successfully', 
      productId: finalProduct.id 
    });

  } catch (error) {
    console.error('Failed in create-from-sourced (upsert):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to publish product', details: errorMessage }, { status: 500 });
  }
}
