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
  const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';

  if (!VENDOR_CODE) {
    throw new Error('Coupang VENDOR_CODE is not configured.');
  }

  const sellerInfo = {
    returnCenterCode: '30123975', // Actual value from user
    returnChargeName: '기본반품비',
    returnCharge: 10000,
    returnZipCode: '50567', // From user's previous message
    returnAddress: '경상남도 양산시 산막공단북12길 14', // From user's previous message
    returnAddressDetail: '주식회사 미가 윤석봉', // Updated as per user request
    deliveryCompanyCode: 'CJGLS',
    outboundShippingPlaceCode: '30123975', // Assuming same as returnCenterCode
  };

  const requestBody = {
    displayCategoryCode: categoryCode,
    sellerProductName: product.name,
    vendorId: VENDOR_CODE,
    salePrice: product.price,
    stockQuantity: product.stock,
    deliveryMethod: 'AGENT_BUY', // 구매대행
    deliveryCompanyCode: sellerInfo.deliveryCompanyCode,
    deliveryChargeType: 'FREE', // 배송비 종류: FREE, NOT_FREE, CHARGE_PER_COUNT, CONDITIONAL_FREE
    deliveryCharge: 0,
    freeShipOverAmount: 0, // 얼마 이상 무료배송 조건 (deliveryChargeType이 CONDITIONAL_FREE일 때)
    remoteAreaDeliverable: 'Y', // 도서산간 배송 가능 여부
    unionDeliveryType: 'NOT_USE', // 묶음배송여부: USE, NOT_USE
    returnCenterCode: sellerInfo.returnCenterCode,
    returnChargeName: sellerInfo.returnChargeName,
    returnCharge: sellerInfo.returnCharge,
    returnZipCode: sellerInfo.returnZipCode,
    returnAddress: sellerInfo.returnAddress,
    returnAddressDetail: sellerInfo.returnAddressDetail,
    outboundShippingPlaceCode: sellerInfo.outboundShippingPlaceCode,
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
            content: (product.detailContent || '<p>상세 정보가 없습니다.</p>').replace(/<img[^>]*>/g, ''), // Filter out <img> tags for Coupang
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
        taxType: 'TAX', // 과세여부: TAX, FREE
        adultOnly: 'EVERYONE', // 성인인증: EVERYONE, ADULT_ONLY
        externalVendorSku: product.id, // 업체상품코드
        // This 'notices' part is complex and category-dependent.
        // We will use a generic one for now.
        notices: [
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "품명 및 모델명",
            content: `${product.name}`
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "KC인증 필 유무",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "크기, 중량",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "색상",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "재질",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "제품구성",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "제조자(수입자)",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "제조국(원산지)",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "취급방법 및 취급시 주의사항",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "품질보증기준",
            content: "상세페이지 참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "A/S 책임자와 전화번호",
            content: "070-4578-9872"
          }
        ]
      }
    ],
    requiredDocuments: [],
    certifications: [],
    manufacture: "미가"
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

    console.log('--- [DEBUG] Full Response from Coupang Create Product API ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------------------------------');

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

/**
 * Fetches all display categories from Coupang.
 */
export async function getAllCategories() {
  const method = 'GET';
  const path = '/v2/providers/seller_api/apis/api/v1/marketplace/meta/display-categories';

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

    const data = await response.json();

    if (!response.ok) {
      console.error('Coupang API Error (Get All Categories):', data);
      throw new Error(data.message || 'Failed to get all categories from Coupang.');
    }

    return data.data;
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    throw error;
  }
}