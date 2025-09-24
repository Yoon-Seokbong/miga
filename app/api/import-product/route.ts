import { NextResponse } from 'next/server';
import { TranslationServiceClient } from '@google-cloud/translate';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- MODIFIED FOR VERCEL DEPLOYMENT ---
// Parse credentials from environment variable instead of file path
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
let credentials;
if (credentialsJson) {
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (e) {
    console.error("Failed to parse GOOGLE_CREDENTIALS_JSON", e);
  }
} else {
  console.log("GOOGLE_CREDENTIALS_JSON environment variable not set.");
}

const translationClient = new TranslationServiceClient({ credentials });
// --- END OF MODIFICATION ---

const prisma = new PrismaClient();

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }) : null;
if (!geminiApiKey) {
  console.log('GEMINI_API_KEY is not set.');
}
if (!model) {
  console.log('Gemini Model could not be initialized.');
}

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const videoUploadDir = path.join(uploadDir, 'videos');

async function ensureUploadDirs() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  try {
    await fs.access(videoUploadDir);
  } catch {
    await fs.mkdir(videoUploadDir, { recursive: true });
  }
}

async function downloadFile(url: string, destinationPath: string) {
  console.log(`Attempting to download: ${url} to ${destinationPath}`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to download file from ${url}: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  try {
    await fs.writeFile(destinationPath, Buffer.from(arrayBuffer));
    console.log(`Successfully downloaded: ${destinationPath}`);
  } catch (writeError) {
    console.error(`Failed to write file ${destinationPath}:`, writeError);
    throw writeError;
  }
}

function parsePriceRange(priceInput: string | number): number {
  if (typeof priceInput === 'number') {
    return priceInput;
  }
  const priceString = String(priceInput || '');
  const match = priceString.match(/(\d+(\.\d+)?)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 0;
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { productUrl, originalData, translatedData, source } = requestBody;

    const extractedImageUrls: string[] = [];
    if (originalData.main_images) {
      for (const img_obj of originalData.main_images) {
        if (img_obj.full_path_image_u_r_i) {
          extractedImageUrls.push(img_obj.full_path_image_u_r_i);
        }
      }
    }
    if (originalData.wholesale_skus?.sku_props) {
      for (const sku_prop of originalData.wholesale_skus.sku_props) {
        if (Array.isArray(sku_prop.value)) {
          for (const value_item of sku_prop.value) {
            if (value_item.image_url) {
              extractedImageUrls.push(value_item.image_url);
            }
          }
        }
      }
    }
    const uniqueImageUrls = Array.from(new Set(extractedImageUrls));
    console.log('Unique Image URLs to download:', uniqueImageUrls);

    if (!productUrl || !originalData || !originalData.title || !source) {
      return NextResponse.json({ message: 'Invalid or incomplete product data provided.' }, { status: 400 });
    }

    let translatedProductName = (translatedData?.productName || '').trim();
    let translatedProductDescription = (translatedData?.productDescription || '').trim();

    if (!translatedProductName || !translatedProductDescription) {
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (!projectId || !credentials) { // Check for credentials too
          console.warn('Google Cloud project ID or credentials are not set. Skipping translation.');
          translatedProductName = originalData.title;
          translatedProductDescription = originalData.productDescription || '';
        } else {
          if (originalData.title) {
            const [nameTranslation] = await translationClient.translateText({
              parent: `projects/${projectId}/locations/global`,
              contents: [originalData.title],
              targetLanguageCode: 'ko',
            });
            translatedProductName = nameTranslation.translations?.[0]?.translatedText || originalData.title;
          }
          if (originalData.productDescription) {
            const [descTranslation] = await translationClient.translateText({
              parent: `projects/${projectId}/locations/global`,
              contents: [originalData.productDescription],
              targetLanguageCode: 'ko',
            });
            translatedProductDescription = descTranslation.translations?.[0]?.translatedText || originalData.productDescription;
          }
        }
      } catch (translationError) {
        console.error('Error during translation:', translationError);
        translatedProductName = originalData.title;
        translatedProductDescription = originalData.productDescription || '';
      }
    }

    let generatedDetailContent: string | null = null;
    if (model && translatedProductName) {
      try {
        const imageUrls = originalData.imageUrls || [];
        const imageUrlsText = imageUrls.join('\n');

        const prompt = `
          You are a world-class e-commerce detail page creator, a master of both copywriting and visual layout.
          Your task is to create a compelling, high-converting product detail page in Korean, formatted as a single block of clean HTML.
          Analyze the provided product information and the list of image URLs to understand the product's features, benefits, and aesthetic.

          --- Provided Product Information ---
          Product Name: ${translatedProductName}
          Product Description: ${translatedProductDescription}

          --- Provided Image URLs ---
          ${imageUrlsText}

          --- Instructions ---
          1.  **Analyze Images:** Conceptually "view" the images by their URLs and select the best ones to tell a visual story.
          2.  **Structure the HTML:** Create a visually appealing layout using basic HTML tags ('<div>', '<h1>', '<h2>', '<p>', '<img>'). The structure should be logical and guide the customer through the product. A good structure could be:
              a.  **Catchy Headline:** An engaging title that grabs attention.
              b.  **Introductory Paragraph:** Briefly introduce the product and its main benefit, paired with the most appealing hero image.
              c.  **Feature & Benefit Showcase:** Detail 2-4 key features. For each feature, pair a descriptive text with the most relevant image URL. Don't just list features; explain the *benefit* to the customer. (e.g., Feature: Stainless Steel -> Benefit: Durable and easy to clean, ensuring hygiene.)
              d.  **Lifestyle/In-Use Examples:** Show the product in action. Use images that depict the product being used to help customers visualize it in their own lives.
              e.  **Call to Action (CTA):** End with a clear and strong call to action to encourage purchase.
          3.  **Image Integration:** You MUST embed the images directly into the HTML using '<img>' tags, using the exact URLs from the provided list. Make sure the layout is clean and modern. Use inline CSS for basic styling (e.g., 'style="width:100%; max-width:800px; margin: 20px auto; display:block;"').
          4.  **Copywriting:** Write all copy in Korean. The tone should be persuasive, friendly, and trustworthy. Avoid technical jargon. Focus on customer benefits.
          5.  **Final Output:** Provide ONLY the raw HTML code for the detail page content. Do not include any other text, explanations, or markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        generatedDetailContent = response.text().trim();
        console.log('AI generated detail HTML content successfully.');

      } catch (aiError) {
        console.error('Error generating AI content:', aiError);
        generatedDetailContent = `<h2>제품 상세 정보 (AI 생성 실패)</h2><p>${translatedProductDescription || 'AI가 상세 내용을 생성하지 못했습니다. 여기에 내용을 직접 입력해주세요.'}</p>`;
      }
    } else {
      console.warn('AI content generation skipped: Missing API key or product data.');
    }

    await ensureUploadDirs();

    console.log('About to start image downloads for URLs:', uniqueImageUrls);
    const imageInfos = await Promise.all(uniqueImageUrls.map(async (url: string) => {
      try {
        const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        await downloadFile(url, filePath);
        return {
          url: `/uploads/${fileName}`,
          isDownloaded: true
        };
      } catch (error) {
        console.error(`Failed to download image from ${url}:`, error);
        return {
          url: url,
          isDownloaded: false
        };
      }
    }));

    const videoInfos = await Promise.all((originalData.videoUrls || []).map(async (url: string) => {
      try {
        const extension = url.split('.').pop()?.split('?')[0] || 'mp4';
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(videoUploadDir, fileName);

        await downloadFile(url, filePath);
        return {
          url: `/uploads/videos/${fileName}`,
          isDownloaded: true
        };
      } catch (error) {
        console.error(`Failed to download video from ${url}:`, error);
        return {
          url: url,
          isDownloaded: false
        };
      }
    }));

    const price = parsePriceRange(originalData.wholesale_price_model.final_price_model.trade_without_promotion.offer_min_price);

    const savedProduct = await prisma.sourcedProduct.upsert({
      where: { sourceUrl: productUrl },
      update: {
        originalName: originalData.title,
        translatedName: translatedProductName,
        originalDescription: originalData.productDescription || null,
        translatedDescription: translatedProductDescription || null,
        originalPrice: price,
        images: imageInfos,
        videos: videoInfos,
        attributes: originalData.attributes,
        detailContent: generatedDetailContent,
        status: 'UPDATED',
        originalProductDataJson: originalData,
      },
      create: {
        sourceUrl: productUrl,
        sourceProductId: "some-id",
        sourcePlatform: source,
        originalName: originalData.title,
        translatedName: translatedProductName,
        originalDescription: originalData.productDescription || null,
        translatedDescription: translatedProductDescription || null,
        originalPrice: price,
        currency: 'CNY',
        images: imageInfos,
        videos: videoInfos,
        attributes: originalData.attributes,
        detailContent: generatedDetailContent,
        status: 'PENDING',
        originalProductDataJson: originalData,
      },
    });

    return NextResponse.json({
      message: 'Product data received, translated, and saved successfully.',
      productId: savedProduct.id
    });

  } catch (error) {
    console.error('Error in POST /api/import-product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'An error occurred while processing the request.', error: errorMessage }, { status: 500 });
  }
}
