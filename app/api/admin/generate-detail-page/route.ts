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

            **Product Information (Korean):**
            *   Product Name: ${productData.name}
            *   Description & Attributes: ${productData.description} // ${JSON.stringify(productData.attributes || {})}

            **Task:**
            Based on the product information, generate the following content in Korean:
            1.  **headlines**: An array of 5 short, powerful, benefit-oriented headlines.
            2.  **subcopies**: An array of 5 sub-copies. Each subcopy should elaborate on the corresponding headline in a single, engaging sentence.
            3.  **reviews**: An array of 3 realistic, positive customer reviews.
            4.  **specs**: A summary of the key product specifications as a JSON object with key-value pairs.

            **Output Format (MUST be a valid JSON object):**
            {
              "headlines": ["첫 번째 헤드라인", "두 번째 헤드라인", ...],
              "subcopies": ["첫 번째 서브카피", "두 번째 서브카피", ...],
              "reviews": ["첫 번째 리뷰", "두 번째 리뷰", ...],
              "specs": { "재질": "304 스테인리스 스틸", "용량": "1.5L", ... }
            }
        `;

        const response = await model.generateContent(prompt);
        const aiResponseText = response.response.text();
        const aiJson = JSON.parse(aiResponseText);

        // Define styles as variables
        const headCopyStyle = "font-family: 'GMarketSans', sans-serif; font-size: 60px; font-weight: 900; text-align: center; margin: 80px 20px 10px 20px; word-break: keep-all; line-height: 1.2;";
        const subCopyStyle = "font-family: 'Pretendard', sans-serif; font-size: 35px; font-weight: 400; text-align: center; color: #666; margin: 0 20px 40px 20px; word-break: keep-all; line-height: 1.4;";
        const bodyImageStyle = "width: 100%; height: auto; margin: 40px 0; display: block;";
        const sectionTitleStyle = "font-family: 'GMarketSans', sans-serif; font-size: 36px; font-weight: 900; margin-top: 80px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; text-align: center;";
        const reviewCardStyle = "font-family: 'Pretendard', sans-serif; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 0 20px 15px 20px;";
        const specTableStyle = "width: 100%; border-collapse: collapse; margin: 20px 0;";
        const specThStyle = "background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px; text-align: left;";
        const specTdStyle = "border: 1px solid #ddd; padding: 12px; text-align: left;";
        const ctaSectionStyle = "text-align: center; padding: 80px 20px; background-color: #f5f5f5;";
        const ctaButtonStyle = "background-color: #ff5722; color: white; padding: 35px 80px; border: none; border-radius: 60px; font-size: 40px; font-weight: 900; cursor: pointer; text-decoration: none;";

        // Build the HTML using the AI-generated text content and inline styles
        let bodyContent = '';
        for (let i = 0; i < 5; i++) {
            if (aiJson.headlines[i] && aiJson.subcopies[i] && productData.images[i]) {
                bodyContent += `
                    <h2 style="${headCopyStyle}">${aiJson.headlines[i]}</h2>
                    <p style="${subCopyStyle}">${aiJson.subcopies[i]}</p>
                    <img style="${bodyImageStyle}" src="${productData.images[i].url}" alt="${aiJson.headlines[i]}">
                `;
            }
        }

        let reviewsContent = '';
        if (aiJson.reviews && aiJson.reviews.length > 0) {
            reviewsContent += `<h2 style="${sectionTitleStyle}">먼저 경험해 본 고객들의 후기</h2>`;
            aiJson.reviews.forEach((review: string) => {
                reviewsContent += `<div style="${reviewCardStyle}">${review}</div>`;
            });
        }

        let specsContent = '';
        if (aiJson.specs) {
            specsContent += `<h2 style="${sectionTitleStyle}">제품 제원</h2>`;
            specsContent += `<table style="${specTableStyle}">`;
            for (const [key, value] of Object.entries(aiJson.specs)) {
                specsContent += `<tr><th style="${specThStyle}">${key}</th><td style="${specTdStyle}">${String(value)}</td></tr>`;
            }
            specsContent += '</table>';
        }

        const finalHtml = `
            <div style="font-family: 'Pretendard', sans-serif; max-width: 860px; margin: 0 auto;">
                <div style="padding: 20px; text-align: right;">
                    <div style="font-size: 16px; color: #888;">구매대행</div>
                    <div style="font-size: 28px; font-weight: 900; color: #d00;">${productData.price}원</div>
                </div>
                ${bodyContent}
                ${reviewsContent}
                ${specsContent}
                <div style="${ctaSectionStyle}">
                    <a href="#" style="${ctaButtonStyle}">지금 바로 구매하기</a>
                </div>
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