import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This function calls the scraper, then calls the AI content generator, and updates the DB.
export async function POST(request: NextRequest) {
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

        // --- Step 1: Run Python Scraper ---
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        const pythonScriptPath = path.join(process.cwd(), 'apify_1688_scraper.py');
        const pythonProcess = spawn('python', [pythonScriptPath, sourcedProduct.sourceUrl, uploadDir]);

        let scraperOutput = '';
        let scraperError = '';
        pythonProcess.stdout.on('data', (chunk) => { scraperOutput += chunk.toString(); });
        pythonProcess.stderr.on('data', (chunk) => { scraperError += chunk.toString(); });

        const exitCode = await new Promise<number>((resolve) => pythonProcess.on('close', resolve));

        if (exitCode !== 0) {
            console.error(`Python script stderr:\n${scraperError}`);
            throw new Error(`Python script exited with code ${exitCode}.`);
        }
        if (!scraperOutput) throw new Error('Scraper script did not produce any output.');
        
        const scrapedData = JSON.parse(scraperOutput);

        // --- Step 2: Call AI Detail Page Generator ---
        const generationApiUrl = new URL('/api/admin/generate-detail-page', request.url).href;
        
        const generationResponse = await fetch(generationApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Pass along the session cookie to authenticate the internal request
                'Cookie': request.headers.get('cookie') || '' 
            },
            body: JSON.stringify({
                productId: sourcedProductId,
                name: scrapedData.title,
                description: scrapedData.description, // Assuming scraper provides this
                images: scrapedData.images?.map((p: string) => ({ url: p })) || [],
                sourcePlatform: new URL(sourcedProduct.sourceUrl).hostname,
                price: sourcedProduct.localPrice, // Use existing price for now
                attributes: scrapedData.attributes
            }),
        });

        if (!generationResponse.ok) {
            const errorBody = await generationResponse.json();
            console.error("AI Page Generation Failed:", errorBody);
            throw new Error('Failed to generate AI detail page content.');
        }

        const aiHtmlContent = await generationResponse.text();

        // --- Step 3: Update Product in Database ---
        const updatedSourcedProduct = await prisma.sourcedProduct.update({
            where: { id: sourcedProductId },
            data: {
                originalName: scrapedData.title || sourcedProduct.originalName,
                images: scrapedData.images || sourcedProduct.images,
                attributes: scrapedData.attributes || sourcedProduct.attributes,
                detailContent: aiHtmlContent, // Save the newly generated AI content
                status: 'PENDING', // Reset status for review
            },
        });

        return NextResponse.json({
            message: `Product data re-fetched and AI content regenerated successfully.`, 
            data: updatedSourcedProduct 
        });

    } catch (error) {
        console.error('Failed to re-fetch sourced product data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to re-fetch data.', details: errorMessage }, { status: 500 });
    }
}
