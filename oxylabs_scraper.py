import requests
import json
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Your Oxylabs API credentials
username = os.getenv('OXYLABS_USERNAME')
password = os.getenv('OXYLABS_PASSWORD')

# The Oxylabs API endpoint
endpoint = 'https://realtime.oxylabs.io/v1/queries'

def scrape_with_oxylabs(url):
    source = 'universal' # As per Oxylabs docs, universal works for 1688.com
    payload = {
        'source': source,
        'url': url,
        'parse': True, # Request parsed JSON data
        'parser_type': 'ecommerce_product', # Specify product parser
        'render': 'html', # Ensure JavaScript rendering is enabled
    }

    # Make the request to the Oxylabs API
    try:
        response = requests.post(
            endpoint,
            auth=(username, password),
            json=payload,
            timeout=180 # Increased timeout as recommended by Oxylabs for Realtime API with JS rendering
        )
        # --- Debugging: Print raw response text from Oxylabs to stderr ---
        print("Raw response from Oxylabs:", response.text, file=sys.stderr)
        
        response.raise_for_status()  # Raise an exception for bad status codes

        response_json = response.json()
        # --- Debugging: Save full Oxylabs JSON response to a file ---
        with open('oxylabs_full_response.json', 'w', encoding='utf-8') as f:
            json.dump(response_json, f, indent=2)
        print("Full Oxylabs JSON response saved to oxylabs_full_response.json for inspection.", file=sys.stderr)
        
        # Oxylabs returns a list of results, each with 'content' which is the parsed JSON
        if response_json and response_json.get('results') and response_json['results'][0].get('content'):
            parsed_data = response_json['results'][0]['content']
            
            # Map Oxylabs parsed data to our expected format
            product_name = parsed_data.get('title', 'Unknown Product Name')
            product_description = parsed_data.get('description', 'No description available.')
            product_price = parsed_data.get('price', {}).get('current_price', 0.0)
            
            image_urls = [img.get('url') for img in parsed_data.get('images', []) if img.get('url')]
            video_urls = [vid.get('url') for vid in parsed_data.get('videos', []) if vid.get('url')]

            scraped_data = {
                "original": {
                    "productName": product_name,
                    "productDescription": product_description,
                    "productPrice": product_price,
                    "imageUrls": image_urls,
                    "videoUrls": video_urls,
                },
                "translated": { # Placeholder for translated data, Next.js API will handle
                    "productName": product_name,
                    "productDescription": product_description,
                },
                "message": f"Data scraped from {url} using Oxylabs 1688.com Scraper API.",
            }
            print(json.dumps(scraped_data, indent=2))

        else:
            print("No parsed content found in Oxylabs response.", file=sys.stderr)
            print(json.dumps(response_json, indent=2), file=sys.stderr)

    except requests.exceptions.RequestException as e:
        print(f"Error making request to Oxylabs API: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr) # Print full traceback for debugging
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"Raw response text (if available): {response.text}", file=sys.stderr)
        elif 'response' in locals() and hasattr(response, 'status_code'):
            print(f"Response status code (if available): {response.status_code}", file=sys.stderr)
    except Exception as e: # Catch any other unexpected exceptions
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr) # Print full traceback for debugging


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python oxylabs_scraper.py <product_url>", file=sys.stderr)
        sys.exit(1)
    
    product_url = sys.argv[1]
    scrape_with_oxylabs(product_url)