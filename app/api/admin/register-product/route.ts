import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { sourcedProductId, categoryId: requestedCategoryId } = await request.json();

        if (!sourcedProductId) {
            return NextResponse.json({ error: 'Sourced Product ID is required' }, { status: 400 });
        }

        let finalCategoryId = requestedCategoryId;

        if (!finalCategoryId) {
            const categoryName = "구매대행";
            let category = await prisma.category.findUnique({
                where: { name: categoryName },
            });

            if (!category) {
                category = await prisma.category.create({
                    data: { name: categoryName },
                });
            }
            finalCategoryId = category.id;
        }

        const sourcedProduct = await prisma.sourcedProduct.findUnique({
            where: { id: sourcedProductId },
        });

        if (!sourcedProduct) {
            return NextResponse.json({ error: 'Sourced product not found' }, { status: 404 });
        }

        if (!sourcedProduct.translatedName || !sourcedProduct.localPrice || !sourcedProduct.detailContent) {
            return NextResponse.json({ error: 'Product is missing required fields for registration.' }, { status: 400 });
        }

        console.log('Register Product API: Sourced Product DetailContent (before cleaning):', sourcedProduct.detailContent);

        const cleanedDetailContent = sourcedProduct.detailContent?.replace(/ style="[^"]*"/g, '').replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '');

        console.log('Register Product API: Cleaned DetailContent (before product creation):', cleanedDetailContent);

        const imagesToCreate = (sourcedProduct.images as Prisma.JsonArray)?.map((img) => {
            const imgObj = img as unknown as { url: string };
            return { url: imgObj.url || (img as unknown as string) };
        }) || [];

        const videosToCreate = (sourcedProduct.videos as Prisma.JsonArray)?.map((vid) => {
            const vidObj = vid as unknown as { url: string };
            return { url: vidObj.url || (vid as unknown as string) };
        }) || [];

        // Find existing product by name (assuming name is unique for Product model)
        let product;
        const existingProduct = await prisma.product.findUnique({
            where: { name: sourcedProduct.translatedName || sourcedProduct.originalName },
        });

        if (existingProduct) {
            // Update existing product
            console.log('Register Product API: Updating existing product:', existingProduct.id);

            // Delete existing images and videos for this product
            await prisma.productImage.deleteMany({ where: { productId: existingProduct.id } });
            await prisma.productVideo.deleteMany({ where: { productId: existingProduct.id } });

            product = await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                    name: sourcedProduct.translatedName || sourcedProduct.originalName,
                    description: sourcedProduct.translatedDescription || sourcedProduct.originalDescription,
                    price: sourcedProduct.localPrice || sourcedProduct.originalPrice,
                    stock: 100,
                    brand: sourcedProduct.brand || 'Unknown',
                    categoryId: finalCategoryId,
                    detailContent: cleanedDetailContent,
                    images: {
                        create: imagesToCreate,
                    },
                    videos: {
                        create: videosToCreate,
                    },
                },
            });
        } else {
            // Create new product
            console.log('Register Product API: Creating new product.');
            product = await prisma.product.create({
                data: {
                    name: sourcedProduct.translatedName || sourcedProduct.originalName,
                    description: sourcedProduct.translatedDescription || sourcedProduct.originalDescription,
                    price: sourcedProduct.localPrice || sourcedProduct.originalPrice,
                    stock: 100,
                    brand: sourcedProduct.brand || 'Unknown',
                    categoryId: finalCategoryId,
                    detailContent: cleanedDetailContent,
                    images: {
                        create: imagesToCreate,
                    },
                    videos: {
                        create: videosToCreate,
                    },
                },
            });
        }

        // Update the sourced product status to IMPORTED
        await prisma.sourcedProduct.update({
            where: { id: sourcedProductId },
            data: { status: 'IMPORTED' },
        });

        return NextResponse.json(product);

    } catch (error) {
        console.error('Failed to register product:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to register product', details: errorMessage }, { status: 500 });
    }
}