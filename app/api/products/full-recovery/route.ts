import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function downloadImage(url: string, uploadDir: string): Promise<string | null> {
    try {
        if (!url || !url.startsWith('http')) return null;
        const response = await fetch(url);
        if (!response.ok) return null;
        const buffer = Buffer.from(await response.arrayBuffer());
        const safeFilename = path.basename(new URL(url).pathname).replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}-${safeFilename}`;
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        return `/uploads/${filename}`;
    } catch (error) {
        console.error(`Error downloading image from ${url}:`, error);
        return null;
    }
}

interface RawApifyData {
  main_images?: Array<{ 
    full_path_image_u_r_i?: string;
  }>;
  wholesale_skus?: {
    sku_props?: Array<{ 
      value?: Array<{ 
        image_url?: string;
      }>;
    }>;
  };
  title?: string;
  attributes?: Record<string, unknown>;
}

// Helper function to extract image URLs from all possible locations in the raw data
function extractAllImageUrls(rawApifyData: RawApifyData): string[] {
    const imageUrls = new Set<string>();

    // 1. Check main_images
    if (rawApifyData.main_images && Array.isArray(rawApifyData.main_images)) {
        rawApifyData.main_images.forEach((img) => {
            if (img && img.full_path_image_u_r_i) {
                imageUrls.add(img.full_path_image_u_r_i);
            }
        });
    }

    // 2. Check wholesale_skus.sku_props
    if (rawApifyData.wholesale_skus?.sku_props && Array.isArray(rawApifyData.wholesale_skus.sku_props)) {
        rawApifyData.wholesale_skus.sku_props.forEach((prop) => {
            if (prop.value && Array.isArray(prop.value)) {
                prop.value.forEach((val) => {
                    if (val && val.image_url) {
                        imageUrls.add(val.image_url);
                    }
                });
            }
        });
    }
    
    console.log(`Found ${imageUrls.size} unique image URLs to download.`);
    return Array.from(imageUrls);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { sourcedProductId } = await request.json();
        if (!sourcedProductId) {
            return NextResponse.json({ error: 'Sourced Product ID is required.' }, { status: 400 });
        }

        const sourcedProduct = await prisma.sourcedProduct.findUnique({ where: { id: sourcedProductId } });
        if (!sourcedProduct || !sourcedProduct.sourceUrl) {
            return NextResponse.json({ error: 'Sourced product not found or it has no source URL.' }, { status: 404 });
        }

        console.log(`--- [RECOVERY] Starting full recovery for ${sourcedProductId} ---`);

        const pythonScriptPath = path.join(process.cwd(), 'apify_1688_scraper.py');
        const pythonProcess = spawn('python', [pythonScriptPath, sourcedProduct.sourceUrl]);

        let scraperError = '';
        pythonProcess.stderr.on('data', (chunk) => { scraperError += chunk.toString(); });

        await new Promise<void>((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                console.error(`Python script stderr:\n${scraperError}`);
                if (code === 0) resolve();
                else reject(new Error(`Python script exited with code ${code}.`));
            });
            pythonProcess.on('error', (err) => reject(new Error(`Failed to start Python script: ${err.message}`)));
        });

        const rawDataMatch = scraperError.match(/Raw Apify Data: ({.*})/s);
        if (!rawDataMatch || !rawDataMatch[1]) {
            throw new Error('Could not find Raw Apify Data in the script output.');
        }
        const rawApifyData = JSON.parse(rawDataMatch[1]);

        const externalImageUrls = extractAllImageUrls(rawApifyData);
        console.log(`[RECOVERY] Found ${externalImageUrls.length} external image URLs.`);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const localImagePaths = (await Promise.all(
            externalImageUrls.map((url: string) => downloadImage(url, uploadDir))
        )).filter(Boolean) as string[];

        if (localImagePaths.length === 0) {
            console.warn('Could not download any images from the scraped data.');
        }

        const updatedProduct = await prisma.sourcedProduct.update({
            where: { id: sourcedProductId },
            data: {
                originalName: rawApifyData.title || sourcedProduct.originalName,
                images: localImagePaths,
                attributes: rawApifyData.attributes || sourcedProduct.attributes,
                status: 'PENDING',
                detailContent: sourcedProduct.detailContent, // Preserve existing description
            },
        });

        console.log(`[RECOVERY] Successfully updated SourcedProduct ${sourcedProductId} in database.`);

        return NextResponse.json({ 
            message: `Full recovery complete. ${localImagePaths.length} images restored.`, 
            data: updatedProduct 
        });

    } catch (error) {
        console.error('[RECOVERY] Full recovery failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Full recovery failed.', details: errorMessage }, { status: 500 });
    }
}
