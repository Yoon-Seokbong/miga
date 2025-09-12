import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    // Basic web scraping logic (very simplified and fragile)
    const response = await fetch(url);
    const html = await response.text();

    let name = ''
    let description = ''
    let price = 0

    // Attempt to extract data using simple regex or string manipulation
    // This is highly dependent on the target website's HTML structure
    // For a robust solution, a library like Cheerio would be needed.

    // Example: Extracting title as name
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      name = titleMatch[1];
    }

    // Example: Extracting price (very basic, might not work for all sites)
    const priceMatch = html.match(/(\$|₩|원)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch && priceMatch[2]) {
      price = parseFloat(priceMatch[2].replace(/,/g, ''));
    }

    // Example: Extracting description from meta tag
    const descriptionMatch = html.match(/<meta name="description" content="(.*?)">/i);
    if (descriptionMatch && descriptionMatch[1]) {
      description = descriptionMatch[1];
    }

    return NextResponse.json({ name, description, price }, { status: 200 });
  } catch (error) {
    console.error('Error fetching external product info:', error);
    return NextResponse.json({ message: 'Failed to fetch product info from URL' }, { status: 500 });
  }
}
