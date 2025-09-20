import crypto from 'crypto';

const VENDOR_CODE = process.env.COUPANG_VENDOR_CODE;
const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

/**
 * Generates the HMAC signature required for Coupang API authentication.
 * @param method - The HTTP method (e.g., 'GET', 'POST').
 * @param path - The request path (e.g., '/v2/providers/seller_api/apis/api/v1/product/categories/predict').
 * @param query - The URL query string (if any).
 * @returns The full Authorization header string.
 */
export function generateHmac(method: string, path: string, query: string = '') {
  if (!ACCESS_KEY || !SECRET_KEY) {
    throw new Error('Coupang API keys are not configured in .env file.');
  }

  const now = new Date();
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const datetime = `${year}${month}${day}T${hours}${minutes}${seconds}Z`;

  const message = datetime + method.toUpperCase() + path + query;

  const signature = crypto.createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('hex');

  const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;
  
  return authorization;
}

const API_HOST = 'https://api-gateway.coupang.com';

/**
 * Predicts the Coupang category for a given product name.
 */
export async function predictCategory(productName: string) {
  const method = 'POST';
  const path = '/v2/providers/openapi/apis/api/v1/categorization/predict';
  
  const requestBody = {
    productName: productName,
  };

  const authorization = generateHmac(method, path);

  try {
    const response = await fetch(API_HOST + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'X-EXTENDED-TIMEOUT': '90000', 
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Coupang API Error (Predict Category):', data);
      throw new Error(data.message || 'Failed to predict category.');
    }

    return data.data;
  } catch (error) {
    console.error('Error in predictCategory:', error);
    throw error;
  }
}

// Interface for our product data structure (simplified)
interface MigaProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: { url: string }[];
  detailContent: string | null;
}

/**
 * Registers a product on Coupang. (Simplified version)
 */
export async function createCoupangProduct(product: MigaProduct, categoryCode: number) {
  const method = 'POST';
  const path = '/v2/providers/seller_api/apis/api/v1/product';

  if (!VENDOR_CODE) {
    throw new Error('Coupang VENDOR_CODE is not configured.');
  }

  const requestBody = {
    displayCategoryCode: categoryCode,
    sellerProductName: product.name,
    vendorId: VENDOR_CODE,
    salePrice: product.price,
    stockQuantity: product.stock,
    deliveryMethod: 'AGENT_BUY',
    deliveryCompanyCode: 'KGB',
    returnCharge: 10000,
    returnZipCode: '12345',
    returnAddress: 'Example return address',
    returnAddressDetail: 'Example detail',
    images: {
      representativeImage: { imageOrder: 0, imageType: 'REPRESENTATION', cdnPath: product.images[0]?.url },
      others: product.images.slice(1).map((img, index) => ({
        imageOrder: index + 1,
        imageType: 'DETAIL',
        cdnPath: img.url,
      })),
    },
    contents: [
      {
        contentsType: 'HTML',
        contentDetails: [
          {
            content: product.detailContent || '<p>상세 정보가 없습니다.</p>',
            detailType: 'TEXT'
          }
        ]
      }
    ],
    items: [
      {
        itemName: product.name,
        originalPrice: product.price,
        salePrice: product.price,
        maximumBuyCount: 10,
        stockQuantity: product.stock,
        attributes: []
      }
    ]
  };

  const authorization = generateHmac(method, path);

  try {
    const response = await fetch(API_HOST + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'X-VENDOR-ID': VENDOR_CODE,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Coupang API Error (Create Product):', JSON.stringify(data, null, 2));
      throw new Error(data.message || 'Failed to create product on Coupang.');
    }

    return data.data;
  } catch (error) {
    console.error('Error in createCoupangProduct:', error);
    throw error;
  }
}

/**
 * Deletes a product from Coupang.
 * @param sellerProductId - The Coupang seller product ID.
 * @returns The response from the Coupang API.
 */
export async function deleteCoupangProduct(sellerProductId: string) {
  const method = 'DELETE';
  const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`;

  if (!VENDOR_CODE) {
    throw new Error('Coupang VENDOR_CODE is not configured.');
  }

  const authorization = generateHmac(method, path);

  try {
    const response = await fetch(API_HOST + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'X-VENDOR-ID': VENDOR_CODE,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Coupang API Error (Delete Product):', data);
      throw new Error(data.message || 'Failed to delete product from Coupang.');
    }

    return response.status === 204 ? { message: 'Successfully deleted' } : await response.json();
  } catch (error) {
    console.error('Error in deleteCoupangProduct:', error);
    throw error;
  }
}
