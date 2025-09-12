import os
import sys
import json
from apify_client import ApifyClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Your Apify API token
APIFY_API_TOKEN = os.getenv('APIFY_API_TOKEN')

# Initialize the ApifyClient with your API token
apify_client = ApifyClient(APIFY_API_TOKEN)

# Actor ID for "1688.com Product Details Scraper"
ACTOR_ID = 'ecomscrape/1688-product-details-page-scraper'

def main():
    if not APIFY_API_TOKEN:
        print(json.dumps({"error": "APIFY_API_TOKEN is not set in .env file."}), file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python apify_1688_scraper.py <product_page_url>"}), file=sys.stderr)
        sys.exit(1)

    product_url = sys.argv[1]

    actor_input = {
        "urls": [product_url],
        "proxy": { "useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"] }
    }

    print(f"Running Apify Actor {ACTOR_ID} for URL: {product_url}", file=sys.stderr)
    
    run_info = None
    try:
        run_info = apify_client.actor(ACTOR_ID).start(run_input=actor_input, wait_for_finish=300) # Wait up to 300 seconds

        if not run_info or run_info.get('status') != 'SUCCEEDED':
            status = run_info.get('status') if run_info else 'UNKNOWN'
            print(json.dumps({"error": f"Actor run failed or timed out with status: {status}."}), file=sys.stderr)
            sys.exit(1)

        print("Actor run SUCCEEDED. Fetching dataset...", file=sys.stderr)
        dataset_items = apify_client.dataset(run_info["defaultDatasetId"]).list_items().items

        if not dataset_items:
            # If no items, print an empty JSON array to stdout
            print(json.dumps([]))
            return

        processed_items = []
        for item in dataset_items:
            # --- Data Extraction ---
            image_urls = []
            if item.get('main_images'):
                for img_obj in item['main_images']:
                    if 'full_path_image_u_r_i' in img_obj and img_obj['full_path_image_u_r_i']:
                        image_urls.append(img_obj['full_path_image_u_r_i'])
            
            sku_props = item.get('wholesale_skus', {}).get('sku_props', [])
            for sku_prop in sku_props:
                if isinstance(sku_prop.get('value'), list):
                    for value_item in sku_prop.get('value', []):
                        if isinstance(value_item, dict) and 'image_url' in value_item and value_item['image_url']:
                            image_urls.append(value_item['image_url'])
            
            item['imageUrls'] = list(set(image_urls)) # Remove duplicates
            processed_items.append(item)

        # Print the entire list as a single, valid JSON array string to stdout
        print(json.dumps(processed_items, indent=2, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": f"An error occurred: {e}"}), file=sys.stderr)
        if run_info:
            run_url = f"https://console.apify.com/actors/runs/{run_info.get('id')}"
            print(json.dumps({"run_details_url": run_url}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()