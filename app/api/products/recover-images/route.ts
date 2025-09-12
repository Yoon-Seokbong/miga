import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to download an image from a URL and save it locally
async function downloadImage(url: string, uploadDir: string): Promise<string | null> {
  try {
    if (!url || !url.startsWith('http')) {
      console.warn(`Skipping invalid URL: ${url}`);
      return null;
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.statusText}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `${Date.now()}-${path.basename(new URL(url).pathname)}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const localUrl = `/uploads/${filename}`;
    console.log(`Successfully recovered image: ${localUrl}`);
    return localUrl;

  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { sourcedProductId } = await request.json();

    if (!sourcedProductId) {
      return NextResponse.json({ error: 'Sourced Product ID is required.' }, { status: 400 });
    }

    // 1. Find the SourcedProduct
    const sourcedProduct = await prisma.sourcedProduct.findUnique({
      where: { id: sourcedProductId },
    });

    if (!sourcedProduct) {
      return NextResponse.json({ error: 'Sourced Product not found.' }, { status: 404 });
    }

    const originalImageUrls = sourcedProduct.images as string[] || [];
    if (originalImageUrls.length === 0) {
      return NextResponse.json({ message: 'No original images to recover.' });
    }

    // 2. Re-download images
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const recoveredLocalUrls: string[] = [];
    for (const imageUrl of originalImageUrls) {
      const localUrl = await downloadImage(imageUrl, uploadDir);
      if (localUrl) {
        recoveredLocalUrls.push(localUrl);
      }
    }

    if (recoveredLocalUrls.length === 0) {
        return NextResponse.json({ error: 'Failed to recover any images.' }, { status: 500 });
    }

    // 3. Find the corresponding final Product (if it exists)
    const finalProduct = await prisma.product.findFirst({
        where: { name: sourcedProduct.translatedName! }
    });

    // 4. If a final product exists, update its images
    if (finalProduct) {
        // Delete old image associations
        await prisma.productImage.deleteMany({
            where: { productId: finalProduct.id },
        });

        // Create new image associations with recovered images
        await prisma.product.update({
            where: { id: finalProduct.id },
            data: {
                images: {
                    create: recoveredLocalUrls.map(url => ({ url }))
                }
            }
        });
    }

    return NextResponse.json({ 
      message: `Successfully recovered ${recoveredLocalUrls.length} images.`, 
      recoveredUrls: recoveredLocalUrls 
    });

  } catch (error) {
    console.error('Failed to recover images:', error);
    return NextResponse.json({ error: 'Failed to recover images.' }, { status: 500 });
  }
}
