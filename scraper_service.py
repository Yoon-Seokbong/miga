import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import requests
import json
import os
import sys

# Configuration
NEXTJS_IMPORT_API_URL = os.getenv("NEXTJS_IMPORT_API_URL", "http://localhost:3000/api/import-product")
GOOGLE_CLOUD_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
# GOOGLE_APPLICATION_CREDENTIALS environment variable should be set for Google Cloud client library

# --- Google Cloud Translation (if handled here) ---
# from google.cloud import translate_v2 as translate
# translate_client = translate.Client()
# def translate_text(text, target_language='ko'):
#     if not text:
#         return ""
#     result = translate_client.translate(text, target_language=target_language)
#     return result['translatedText']

async def scrape_product(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True) # Use chromium for wider compatibility
        page = await browser.new_page()
        
        try:
            print(f"Navigating to {url}...", file=sys.stderr)
            await page.goto(url, wait_until="networkidle", timeout=60000) # Wait for network to be idle, increased timeout
            
            # Add a wait for a common element that should appear after content loads
            try:
                await page.wait_for_selector('h1, span.price-text, div.desc-content', timeout=60000) # Wait for up to 60 seconds
                print("Waited for common product elements.", file=sys.stderr)
            except Exception as e:
                print(f"Timeout waiting for common product elements: {e}")

            # Get the full HTML content after JavaScript execution
            html_content = await page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Get the full HTML content after JavaScript execution
            html_content = await page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # --- Debugging: Save HTML content to a file ---
            with open('1688_page_content.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            print("HTML content saved to 1688_page_content.html for inspection.", file=sys.stderr)

            # --- Extract Data using BeautifulSoup (Refined Selectors for 1688.com) ---
            product_name = "Unknown Product Name"
            name_selectors = [
                'h1.d-title',
                'h1.title-text',
                'h1.title',
                'div.product-name h1',
                'span.name',
                '#J_Title',
                'meta[property="og:title"]',
                'div.title-content h1',
                'div#productTitle h1',
            ]
            for selector in name_selectors:
                element = soup.select_one(selector)
                if element:
                    if element.name == 'meta':
                        product_name = element.get('content', "Unknown Product Name")
                    else:
                        product_name = element.get_text(strip=True)
                    print(f"Found product name using {selector}: {product_name}", file=sys.stderr)
                    break

            product_description = "No description available."
            desc_selectors = [
                'div.desc-content',
                'div.detail-desc-module',
                'div.desc-container',
                'div.mod-detail-description',
                '#desc-module',
            ]
            for selector in desc_selectors:
                element = soup.select_one(selector)
                if element:
                    product_description = str(element) # Keep HTML for rich description
                    print(f"Found product description using {selector}", file=sys.stderr)
                    break

            price_text = "0"
            product_price = 0.0
            price_selectors = [
                'span.price-text',
                'span.price-value',
                'div.price-area span',
                '#mod-detail-price .price',
                '#J_Price .price',
            ]
            for selector in price_selectors:
                element = soup.select_one(selector)
                if element:
                    price_text = element.get_text(strip=True)
                    try:
                        product_price = float(''.join(filter(lambda c: c.isdigit() or c == '.', price_text))) # Basic price parsing
                        print(f"Found price using {selector}: {product_price}", file=sys.stderr)
                        break
                    except ValueError:
                        pass # Continue to next selector if parsing fails

            image_urls = []
            image_selectors = [
                'img.mod-detail-img',
                'img.main-image',
                'img[src*=".alicdn.com"]',
                'img[data-lazyload-src*=".alicdn.com"]',
                'img[data-src*=".alicdn.com"]',
            ]
            for selector in image_selectors:
                for img_tag in soup.select(selector):
                    src = img_tag.get('src') or img_tag.get('data-lazyload-src') or img_tag.get('data-src')
                    if src and src not in image_urls:
                        # Clean up thumbnail URLs if they have size suffixes (e.g., _60x60.jpg)
                        clean_url = src.split('_')[0] if '_.' in src else src # Simple cleanup, might need regex
                        image_urls.append(clean_url)
                        print(f"Found image using {selector}: {clean_url}", file=sys.stderr)
            
            video_urls = []
            video_selectors = [
                'video.mod-detail-video source',
                'video[src*=".alicdn.com"]',
                'source[src*=".alicdn.com"]',
            ]
            for selector in video_selectors:
                for video_tag in soup.select(selector):
                    src = video_tag.get('src')
                    if src and src not in video_urls:
                        video_urls.append(src)
                        print(f"Found video using {selector}: {src}", file=sys.stderr)

            # --- Prepare data for Next.js API ---
            # For now, we'll send original data and let Next.js API handle translation
            scraped_data = {
                "original": {
                    "productName": product_name,
                    "productDescription": product_description,
                    "productPrice": product_price,
                    "imageUrls": image_urls,
                    "videoUrls": video_urls,
                },
                "translated": { # Send original data here for Next.js API to translate
                    "productName": product_name,
                    "productDescription": product_description,
                },
                "message": f"Data scraped from {url}. Selectors are placeholders.",
            }
            
            return scraped_data

        except Exception as e:
            print(f"Error during scraping: {e}", file=sys.stderr)
            raise
        finally:
            await browser.close()

async def main():
    if len(sys.argv) < 2:
        print("Usage: python scraper_service.py <product_url>", file=sys.stderr)
        sys.exit(1)
    product_url = sys.argv[1]

    try:
        scraped_data = await scrape_product(product_url)
        print(json.dumps(scraped_data, indent=2))

        # Send data to Next.js API
        print(f"Sending data to Next.js API: {NEXTJS_IMPORT_API_URL}", file=sys.stderr)
        response = requests.post(NEXTJS_IMPORT_API_URL, json=scraped_data)
        response.raise_for_status() # Raise an exception for HTTP errors
        print("Data sent to Next.js API successfully:", response.json(), file=sys.stderr)

    except Exception as e:
        print(f"Failed to scrape or send data: {e}", file=sys.stderr)

if __name__ == "__main__":
    # Ensure Playwright browsers are installed
    # Run: playwright install
    asyncio.run(main())
