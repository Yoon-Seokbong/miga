import { NextResponse } from 'next/server';
import { TranslationServiceClient } from '@google-cloud/translate';

// Initialize TranslationServiceClient outside the handler for better performance
const translationClient = new TranslationServiceClient();

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ message: 'Text and target language are required' }, { status: 400 });
    }

    // Assuming GOOGLE_CLOUD_PROJECT_ID is set in your .env file
    // and GOOGLE_APPLICATION_CREDENTIALS points to your service account key.
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!projectId) {
      return NextResponse.json({ message: 'Google Cloud Project ID is not configured.' }, { status: 500 });
    }

    const requestConfig = {
      parent: `projects/${projectId}/locations/global`,
      contents: [text],
      targetLanguageCode: targetLang,
    };

    const [response] = await translationClient.translateText(requestConfig);
    const translatedText = response.translations?.[0]?.translatedText || '';

    if (!translatedText) {
      return NextResponse.json({ message: 'Translation service returned no text.' }, { status: 500 });
    }

    return NextResponse.json({ translatedText }, { status: 200 });

  } catch (error) {
    console.error('Error in /api/translate:', error);
    // Provide more specific error messages if possible
    if (error instanceof Error) {
      return NextResponse.json({ message: `Translation failed: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred during translation.' }, { status: 500 });
  }
}