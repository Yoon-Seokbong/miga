import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface ImportProductPayload {
  productUrl: string;
  originalData: {
    productName: string;
    productPrice: number;
    productDescription: string;
    currency: string;
    imageUrls: string[];
    attributes: { name: string; value: string }[];
  };
  source: string;
  translatedData: object;
}

async function callImportProductAPI(productData: ImportProductPayload) {
  const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const importResponse = await fetch(`${api_url}/api/import-product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!importResponse.ok) {
    const errorData: { message?: string; error?: string } = await importResponse.json();
    console.error('Error calling /api/import-product:', errorData);
    throw new Error(errorData.message || 'Failed to import product after processing data.');
  }

  return await importResponse.json();
}

export async function POST(request: Request) {
  try {
    const { productUrl } = await request.json();
    let scrapedResults;

    // USE_MOCK_DATA 환경 변수가 'true'이면 로컬 샘플 파일을 사용합니다.
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log("--- USING MOCK SCRAPER DATA ---");
      try {
        const mockFilePath = path.join(process.cwd(), 'mock-data', 'product-969917205876.json');
        const mockData = await fs.readFile(mockFilePath, 'utf-8');
        scrapedResults = JSON.parse(mockData);
        console.log("Successfully loaded mock data.");
      } catch (mockError) {
        console.error("Could not read or parse mock data file:", mockError);
        return NextResponse.json({ message: 'Failed to read mock data file.' }, { status: 500 });
      }
    } else {
      // 그렇지 않으면, 실제 Apify 스크레이퍼를 실행합니다.
      if (!productUrl || !productUrl.includes('1688.com')) {
        return NextResponse.json({ message: 'A valid 1688.com product URL is required.' }, { status: 400 });
      }

      const scraperPath = path.join(process.cwd(), 'apify_1688_scraper.py');
      const pythonProcess = spawn('python', [scraperPath, productUrl]);

      let data = '';
      let error = '';

      pythonProcess.stdout.on('data', (chunk) => { data += chunk.toString(); });
      pythonProcess.stderr.on('data', (chunk) => { 
        error += chunk.toString();
        console.error(`Python stderr: ${chunk.toString()}`);
      });

      const code = await new Promise<number>((resolve, reject) => {
        pythonProcess.on('close', resolve);
        pythonProcess.on('error', reject);
      });

      if (code !== 0) {
        console.error(`Python script exited with code ${code}. Error: ${error}`);
        try {
          const errorJson = JSON.parse(error);
          return NextResponse.json({ message: errorJson.error || "Python script failed.", details: error }, { status: 500 });
        } catch (e) {
          return NextResponse.json({ message: "Python script failed and stderr was not valid JSON.", details: error }, { status: 500 });
        }
      }
      
      try {
        scrapedResults = JSON.parse(data);
      } catch (parseError) {
        console.error('Failed to parse Python script output as JSON:', parseError);
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const rawOutputPath = path.join(tempDir, `raw_output_\${Date.now()}.txt`);
        await fs.writeFile(rawOutputPath, data);
        console.error(`Raw output saved to ${rawOutputPath}`);
        return NextResponse.json({ message: 'Failed to parse scraped data.', details: data }, { status: 500 });
      }
    }

    // --- Common processing logic for both real and mock data ---
    if (!Array.isArray(scrapedResults) || scrapedResults.length === 0) {
      return NextResponse.json({ message: 'Scraper returned no data.' }, { status: 404 });
    }

    const mainProductData = scrapedResults[0];

    const importProductRequestBody = {
      productUrl: productUrl || mainProductData.url, // Mock 데이터 사용 시 productUrl이 없을 수 있으므로 fallback 추가
      originalData: {
        productName: mainProductData.title,
        productPrice: parseFloat(mainProductData.wholesale_price_model?.final_price_model?.trade_without_promotion?.offer_min_price || '0'),
        productDescription: mainProductData.description || '',
        currency: mainProductData.currency || 'UNKNOWN',
        imageUrls: mainProductData.imageUrls || [],
        attributes: mainProductData.attributes || [],
      },
      source: new URL(productUrl || mainProductData.url).hostname,
      translatedData: {},
    };

    const importResult = await callImportProductAPI(importProductRequestBody);
    
    return NextResponse.json(importResult, { status: 200 });

  } catch (err) {
    console.error('Error in /api/run-scraper:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}