import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as Translate } from '@google-cloud/translate';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const googleTranslate = new Translate.Translate();

async function getTranslatedText(text: string, targetLanguage: string = 'ko'): Promise<string> {
    if (!text) return '';
    try {
        let [translations] = await googleTranslate.translate([text], targetLanguage);
        translations = Array.isArray(translations) ? translations : [translations];
        return translations[0] || text;
    } catch (error) {
        console.error('Error during translation:', error);
        return text;
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { productId, name, description, images, sourcePlatform, price, attributes } = await request.json();

        if (!productId) {
            return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
        }

        const translatedProductName = await getTranslatedText(name);
        const translatedDescription = await getTranslatedText(description);
        const imageCount = images ? images.length : 0;

        const productData = {
            name: translatedProductName,
            description: translatedDescription, 
            images: images || [],
            sourcePlatform: sourcePlatform,
            price: price,
            attributes: attributes,
        };

        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
            **Objective:** Generate compelling marketing copy for a product detail page, based on the provided product information. Your output MUST be a single, valid JSON object.

            **Your Persona:** You are a top-tier Korean e-commerce creative director.

            **Context:** There are ${imageCount} images for this product. You must generate one headline and one subcopy for each image.

            **Product Information (Korean):**
            *   Product Name: ${productData.name}
            *   Description & Attributes: ${productData.description} // ${JSON.stringify(productData.attributes || {})}

            **Task:**
            Based on the product information, generate the following content in Korean:
            1.  **headlines**: An array of ${imageCount} short, powerful, benefit-oriented headlines.
            2.  **subcopies**: An array of ${imageCount} sub-copies. Each subcopy should elaborate on the corresponding headline in a single, engaging sentence.
            3.  **specs**: A summary of the key product specifications as a JSON object with key-value pairs.

            **Output Format (MUST be a valid JSON object):**
            {
              "headlines": ["첫 번째 헤드라인", "두 번째 헤드라인", ...],
              "subcopies": ["첫 번째 서브카피", "두 번째 서브카피", ...],
              "specs": { "재질": "304 스테인리스 스틸", "용량": "1.5L", ... }
            }
        `;

        const response = await model.generateContent(prompt);
        const aiResponseText = response.response.text();
        const aiJson = JSON.parse(aiResponseText);

        // Build the HTML using the AI-generated text content and CSS classes
        let bodyContent = '';
        for (let i = 0; i < imageCount; i++) {
            if (aiJson.headlines[i] && aiJson.subcopies[i] && productData.images[i]) {
                const imageUrl = typeof productData.images[i] === 'string' ? productData.images[i] : (productData.images[i] as { url: string }).url;
                bodyContent += `
                    <h2 class="ai-headline">${aiJson.headlines[i]}</h2>
                    <p class="ai-subcopy">${aiJson.subcopies[i]}</p>
                    <img class="ai-body-image" src="${imageUrl}" alt="${aiJson.headlines[i]}">
                `;
            }
        }



        let specsContent = '';
        if (aiJson.specs) {
            specsContent += `<h2 class="ai-section-title">제품 제원</h2>`;
            specsContent += `<table class="ai-spec-table">`;
            for (const [key, value] of Object.entries(aiJson.specs)) {
                specsContent += `<tr><th>${key}</th><td>${String(value)}</td></tr>`;
            }
            specsContent += '</table>';
        }

        const finalHtml = `
            <div class="ai-product-detail-container">
                ${bodyContent}
                ${specsContent}
            </div>
        `;

        return new NextResponse(finalHtml, {
            headers: { 'Content-Type': 'text/html' },
            status: 200
        });

    } catch (error) {
        console.error('Error generating product detail page:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Failed to generate product detail page', error: errorMessage }, { status: 500 });
    }
}