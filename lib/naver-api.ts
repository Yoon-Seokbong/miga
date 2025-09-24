import { URLSearchParams } from 'url';
import crypto from 'crypto';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

/**
 * Obtains an access token from the Naver Commerce API.
 * This version attempts to use Basic Authentication as per user's latest instruction.
 * @returns The access token string.
 */
export async function getNaverAccessToken(): Promise<string> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('Naver API Client ID or Client Secret are not configured in .env file.');
  }

  // Create Base64 encoded credentials for Basic Auth
  const basicAuth = Buffer.from(`${NAVER_CLIENT_ID}:${NAVER_CLIENT_SECRET}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  try {
    const response = await fetch(`${NAVER_COMMERCE_API_BASE_URL}/external/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: params.toString(),
    });

    const data = await response.json();

    console.log('--- [DEBUG] Full Response from Naver Token API (Basic Auth Attempt) ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('---------------------------------------------------------------------');

    if (!response.ok) {
      console.error('Naver API Token Error:', data);
      throw new Error(data.message || data.error_description || 'Failed to get Naver access token.');
    }

    return data.access_token;
  } catch (error) {
    console.error('Error in getNaverAccessToken:', error);
    throw error;
  }
}

const NAVER_COMMERCE_API_BASE_URL = 'https://api.commerce.naver.com';

// Define NaverCategory interface
interface NaverCategory {
  id: string;
  name: string;
  last: boolean; // Indicates if it's a leaf category
  wholeCategoryName: string; // Full path like "패션의류 > 여성의류 > 원피스"
  // Add other properties if needed from API response
}

/**
 * Fetches all categories from Naver Smart Store.
 * @returns An array of Naver category objects.
 */
export async function getNaverCategories(): Promise<NaverCategory[]> { // Changed any[] to NaverCategory[]
  const accessToken = await getNaverAccessToken();
  const method = 'GET';
  const path = '/external/v1/categories';

  try {
    const requestHeaders = {
      'Authorization': `Bearer ${accessToken}`,
    };

    console.log('\n--- [DEBUG] Naver API Request --- ');
    console.log('URL:', NAVER_COMMERCE_API_BASE_URL + path);
    console.log('Method:', method);
    console.log('Headers:', JSON.stringify(requestHeaders, null, 2));
    console.log('-----------------------------------\n');

    const response = await fetch(NAVER_COMMERCE_API_BASE_URL + path, {
      method,
      headers: requestHeaders,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Naver API Error (Get Categories):', data);
      throw new Error(data.message || 'Failed to fetch Naver categories.');
    }

    return data.data as NaverCategory[]; // Cast to NaverCategory[]
  } catch (error) {
    console.error('Error in getNaverCategories:', error);
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
 * Registers a product on Naver Smart Store. (Simplified version)
 * @param product - The product data from our database.
 * @returns The response from the Naver API.
 */
export async function createNaverProduct(product: MigaProduct) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('Naver API Client ID or Client Secret are not configured in .env file.');
  }

  const accessToken = await getNaverAccessToken();
  const method = 'POST';
  const path = '/external/v2/products'; // Likely endpoint for product creation

  // 1. Category Matching (Simplified - needs robust implementation)
  // In a real scenario, you'd fetch all categories and find the best leaf category.
  const naverCategories = await getNaverCategories();
  let leafCategoryId: string | null = null;

  // Example: Find a category by name (very basic matching for now)
  // This needs to be replaced with a more sophisticated logic or user selection.
  const defaultCategoryName = '생활용품'; 
  const matchedCategory = naverCategories.find(cat => cat.name === defaultCategoryName && cat.last === true);
  if (matchedCategory) {
    leafCategoryId = matchedCategory.id;
  } else {
    throw new Error(`Naver category '${defaultCategoryName}' not found for product ${product.name}. Please ensure a valid leaf category exists.`);
  }

  const requestBody = {
    originProduct: {
      statusType: 'SALE', // 상품 등록 시에는 SALE(판매 중)만 입력 가능
      saleType: 'NEW', // 새 상품
      leafCategoryId: leafCategoryId, // 리프 카테고리 ID
      name: product.name, // 상품명
      detailContent: product.detailContent || '<p>상세 정보가 없습니다.</p>', // 상품 상세 정보
      images: {
        representativeImage: { url: product.images[0]?.url }, // 대표 이미지
        // otherImages: product.images.slice(1).map(img => ({ url: img.url })), // 다른 이미지들
      },
      salePrice: product.price, // 상품 판매 가격
      stockQuantity: product.stock, // 재고 수량
      
      // NOTE: These are required fields that need proper values.
      // For now, using placeholders or minimal valid values.
      deliveryInfo: {
        deliveryCompanyCode: 'CJGLS', // 예시: CJ대한통운
        deliveryFee: {
          deliveryFeeType: 'FREE', // 예시: 무료 배송
        },
      },
      detailAttribute: {},
      customerBenefit: {},
    },
    smartstoreChannelProduct: {
      naverShoppingRegistration: true, // 네이버 쇼핑 등록 여부
      channelProductDisplayStatusType: 'ON', // 전시 상태 코드
    },
    // windowChannelProduct: {}, // 쇼핑윈도 채널상품 정보 (선택 사항)
  };

  try {
    const response = await fetch(NAVER_COMMERCE_API_BASE_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Naver API Error (Create Product):', JSON.stringify(data, null, 2));
      throw new Error(data.message || 'Failed to create product on Naver Smart Store.');
    }

    return data; // Naver API might return different response structure
  } catch (error) {
    console.error('Error in createNaverProduct:', error);
    throw error;
  }
}

/**
 * Deletes a product from Naver Smart Store.
 * @param originProductNo - The Naver origin product ID.
 * @returns The response from the Naver API.
 */
export async function deleteNaverProduct(originProductNo: string) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('Naver API Client ID or Client Secret are not configured in .env file.');
  }

  const accessToken = await getNaverAccessToken();
  const method = 'DELETE';
  const path = `/external/v2/products/origin-products/${originProductNo}`;

  try {
    const response = await fetch(NAVER_COMMERCE_API_BASE_URL + path, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Naver API Error (Delete Product):', data);
      throw new Error(data.message || 'Failed to delete product from Naver.');
    }

    return response.status === 204 ? { message: 'Successfully deleted' } : await response.json();
  } catch (error) {
    console.error('Error in deleteNaverProduct:', error);
    throw error;
  }
}
