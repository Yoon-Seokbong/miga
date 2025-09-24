'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Star, StarHalf, StarOff } from 'lucide-react';
import Button from '@/components/Button';
import WishlistButton from '@/components/WishlistButton';
import { useRouter } from 'next/navigation'; // ADDED

import ProductDetailContent from '@/components/ProductDetailContent'; // ADDED

// Define types (these should ideally be imported from a shared types file)
interface ProductImage { id: string; url: string; }
interface ProductVideo { id: string; url: string; }
interface ProductDetailImage { id: string; url: string; order: number; }
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: ProductImage[];
  detailImages: ProductDetailImage[];
  averageRating?: number;
  reviewCount?: number;
  relatedProducts?: Product[];
  videos?: ProductVideo[];
  category?: { name: string };
  detailContent?: string; // ADDED
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string };
}

interface ProductDetailClientProps {
  initialProduct: Product;
  initialReviews: Review[];
}

const MandatoryNoticeSection = () => {
  // Removed useState(false) for showFullText
  // Removed summary JSX

  const fullText = (
    <div className="space-y-4 text-gray-800 text-base">
      <p className="mb-2">
        본 상품은 해외에서 발송하는 해외 직배송 상품이며, <br />
        구매 후 상품 수령까지 <strong className="text-lg font-bold text-orange-700">7일에서 14일 내외 소요</strong>됩니다. <br />
        (주말/공휴일 제외)
      </p>
      <p className="mb-2">
        해외 배송 상품의 주문은 <strong className="text-lg font-bold text-orange-700">발주처리, 출고, 정밀검수, 해외배송,</strong> <br />
        <strong className="text-lg font-bold text-orange-700">세관통관, 국내택배사인계, 국내배송</strong>의 단계로 진행됩니다. <br />
        제품이 국내에 도착하여 택배사에서 인계된 시점부터 배송조회가 가능합니다.
      </p>
      <p className="mb-2">
        현지 상황이나 택배사 사정에 따라 배송기간이 연장될 수 있으며, <br />
        블랙프라이데이, 해외 세일 등 주문량이 늘어나는 기간에는 <br />
        평균 배송일보다 지연될 수 있습니다. <br />
        주말 및 공휴일에도 현지 발주와 현지 배송이 진행될 수 있으니 <br />
        신중한 구매 부탁드립니다.
      </p>
      <ul className="list-disc list-inside mb-2 ml-4">
        <li><strong className="text-red-600">수취인의 실제 성함</strong>을 기재해 주세요.</li>
        <li><strong className="text-red-600">일회용 안심번호가 아닌 실제 휴대폰 번호</strong>를 기재해 주세요.</li>
        <li>문의 사항은 <strong className="text-blue-600">070-4578-9872</strong> 로 문의 주세요.</li>
      </ul>

      <h3 className="font-bold text-xl text-gray-900 mt-6 mb-3">개인통관고유부호 필수</h3>
      <p className="mb-2">
        해외 상품 구매 시 세관통관을 위해 <strong className="text-lg font-bold text-red-700">통관 고유부호는 필수로 기재</strong>해 주셔야 합니다. <br />
        주문자가 아닌 받는 분의 개인통관고유부호를 기재하셔야 하며, <br />
        통관 불일치 또는 미기재 시 배송 지연 사유가 됩니다. <br />
        개인 통관고유부호는 관세청 시스템(<a href="https://unipass.customs.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">UNIPASS CUSTOMS.GO.KR</a>)에서 신청 가능하며, <br />
        회원가입 없이 공인인증서 및 휴대전화 문자메시지로 본인 확인 절차를 거친 후 발급받을 수 있습니다.
      </p>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg"> {/* Removed mt-12 */}
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">구매대행 상품 필수 안내</h2>
      {fullText} {/* Directly render fullText */}
      {/* Removed toggle button */}
    </div>
  );
};

const AdditionalDisclaimerInfo = () => (
  <div className="bg-white p-6 rounded-lg shadow-lg"> {/* Removed mt-12 */}
    <h3 className="font-bold text-xl text-gray-900 mb-3">상품 주문 전 안내사항</h3>
    <p className="mb-4 text-gray-800 text-base">
      <strong className="text-red-600 text-base">관부가세 기준:</strong> <br />
      결제금액이 미화(달러) 기준 150달러 이상일 경우 관부가세가 부과될 수 있습니다.
    </p>

    <h3 className="font-bold text-xl text-gray-900 mt-6 mb-3">대형화물 택배 안내</h3>
    <ul className="list-disc list-inside mb-4 ml-4 text-gray-800 text-base">
      <li>세 변의 합이 160cm 이상</li>
      <li>중량 20kg 이상</li>
      <li>한 변의 길이가 1m 이상</li>
      <li>위 기준 중 하나라도 해당될 경우 <strong className="text-red-600">대형화물로 분류되어 <br />추가 배송비가 발생</strong>할 수 있습니다.</li>
    </ul>

    <h3 className="font-bold text-xl text-gray-900 mt-6 mb-3">교환 및 반품</h3>
    <p className="mb-4 text-gray-800 text-base">
      해외배송 특성상 미세한 스크래치, 경미한 마감 불량은 <br />
      반품 및 교환 사유에 해당되지 않습니다. <br />
      본품 포장 박스 훼손 시 파손된 제품이라도 반품이 어려우니 주의 부탁드립니다. <br />
      초기 불량으로 교환 및 반품이 필요한 경우 <strong className="text-red-600">제품 수령 후 7일 내로 <br />고객센터로 연락</strong> 부탁드립니다.
    </p>

    <h3 className="font-bold text-xl text-gray-900 mt-6 mb-3">개인정보 제공 동의</h3>
    <div className="space-y-2 text-gray-800 text-base">
      <p>
        <strong className="font-semibold">개인정보를 제공받는 자:</strong> 상품 및 서비스 제공 위탁업체, 중개업체, 택배사<br/>
        <strong className="font-semibold">제공하는 개인정보:</strong> 이름, 아이디, 전화번호, 구매정보, 상품수령인 정보<br/>
        <strong className="font-semibold">개인정보를 제공받는 자의 이용 목적:</strong> 이용자 간 원활한 거래 진행, 본인의사 확인, <br />
        고객 상담 및 불만 처리, 부정 이용 방지 등의 고객 관리, 상품 배송, 취소, 교환, 반품<br/>
        <strong className="font-semibold">개인정보를 제공받는 자의 개인정보 보유 및 이용 기간:</strong> <br />
        개인정보 이용 목적 달성 시까지 보존합니다. <br />
        단, 관계 법령의 규제에 의하여 일정 기간 보존이 필요한 경우에는 해당 기간만큼 보관 후 삭제합니다.
      </p>
      <p>
        <strong className="text-red-600">개인정보 동의를 거부할 권리가 있으나, 거부 시 상품 구매를 할 수 없습니다.</strong> <br />
        그 밖의 내용은 사이트 자체 이용약관 및 개인정보처리방침에 따릅니다.
      </p>
    </div>
  </div>
);

const ProductDetailClient = ({ initialProduct, initialReviews }: ProductDetailClientProps) => {
  const product = initialProduct;
  console.log('Product category:', product.category);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video'; url: string; id: string } | null>(null);
  
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (product.images && product.images.length > 0) {
      setSelectedMedia({ type: 'image', url: product.images[0].url, id: product.images[0].id });
    } else if (product.videos && product.videos.length > 0) {
      setSelectedMedia({ type: 'video', url: product.videos[0].url, id: product.videos[0].id });
    }
  }, [product.images, product.videos]);

  const getStarRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} fill="currentColor" className="text-yellow-400" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} fill="currentColor" className="text-yellow-400" />);
      } else {
        stars.push(<StarOff key={i} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white p-6 rounded-lg shadow-lg"> {/* Changed to lg:grid-cols-3 */}
        {/* Product Media Gallery */}
        <div className="lg:col-span-2"> {/* Changed to lg:col-span-2 for 2/3 width */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '500px' }}>
            {selectedMedia?.type === 'image' && (
              <Image
                src={selectedMedia.url}
                alt={product.name || 'Product media'}
                width={700}
                height={700}
                priority
                className="w-full h-full object-contain"
              />
            )}
            {selectedMedia?.type === 'video' && (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {product.images?.map(image => (
              <button
                key={image.id}
                onClick={() => setSelectedMedia({ type: 'image', url: image.url, id: image.id })}
                className={`aspect-square w-full rounded-md overflow-hidden border-2 ${selectedMedia?.id === image.id ? 'border-primary' : 'border-transparent'}`}
              >
                <Image src={image.url} alt={product.name || 'Product thumbnail'} width={100} height={100} className="w-full h-full object-cover" />
              </button>
            ))}
            {product.videos?.map(video => (
              <button
                key={video.id}
                onClick={() => setSelectedMedia({ type: 'video', url: video.url, id: video.id })}
                className={`aspect-square w-full rounded-md overflow-hidden border-2 ${selectedMedia?.id === video.id ? 'border-primary' : 'border-transparent'}`}
              >
                <video src={video.url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-1 space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
          {product.reviewCount && product.reviewCount > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex">{getStarRating(product.averageRating || 0)}</div>
              <span className="text-gray-600 text-sm">({product.reviewCount || 0} 리뷰)</span>
            </div>
          )}
          
          {product.description && !product.description.includes('AI가 생성한') && (
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          )}
          {/* Price always shows now */}
          <p className="text-3xl font-extrabold text-gray-900">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(product.price)}</p>

          <div className="flex space-x-4">
            <Button onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.images[0]?.url || '' })} className="flex-1 py-3 text-lg">장바구니에 추가</Button>
            <Button onClick={() => { addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.images[0]?.url || '' }); router.push('/cart'); }} className="flex-1 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white">바로 구매</Button> {/* ADDED */}
            <WishlistButton productId={product.id} className="flex-1 py-3 text-lg" />
          </div>
        </div>
      </div>

      {/* Conditional Mandatory Notice Section - MOVED HERE */}
      {product.category?.name === '구매대행' && (
        <div className="mt-8">
          <MandatoryNoticeSection />
        </div>
      )}

      {/* AI-generated detail content */}
      {product.detailContent && (
        <div className="mt-12">
          <ProductDetailContent content={product.detailContent} />
        </div>
      )}

      {/* Reviews Section */}
      {(() => {
        const dummyReviews = [
          { id: 'dummy1', rating: 5, comment: '배송도 빠르고 상품도 너무 마음에 듭니다! 강력 추천해요!', createdAt: new Date().toISOString(), user: { name: '김수진' } },
          { id: 'dummy2', rating: 4, comment: '생각했던 것보다 좋네요. 잘 쓰겠습니다.', createdAt: new Date().toISOString(), user: { name: '이민준' } },
          { id: 'dummy3', rating: 5, comment: '품질이 정말 좋습니다. 다음에도 또 구매할 의향이 있습니다.', createdAt: new Date().toISOString(), user: { name: '박서연' } },
          { id: 'dummy4', rating: 5, comment: '디자인도 예쁘고 실용적이네요. 만족합니다.', createdAt: new Date().toISOString(), user: { name: '최지우' } },
          { id: 'dummy5', rating: 4, comment: '가성비 최고의 상품입니다. 약간의 아쉬움은 있지만 전반적으로 만족해요.', createdAt: new Date().toISOString(), user: { name: '정현우' } },
        ];

        const reviewsToDisplay = initialReviews.length > 0 ? initialReviews : dummyReviews;
        const reviewCount = initialReviews.length > 0 ? initialProduct.reviewCount || 0 : dummyReviews.length;

        // Do not render the review section for '구매대행' products
        if (product.category?.name === '구매대행') {
          return null;
        }

        return (
          <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">고객 리뷰 ({reviewCount})</h2>
            <div className="space-y-8">
              {reviewsToDisplay.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center mb-2">
                    <div className="flex mr-2">{getStarRating(review.rating)}</div>
                    <span className="text-gray-600 text-sm">
                      {review.user.name ? `${review.user.name.charAt(0)}***님` : '익명'}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{review.comment}</p>
                  <p className="text-gray-500 text-sm mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Conditional Additional Disclaimer Info - REMAINS HERE */}
      {product.category?.name === '구매대행' && (
        <div className="mt-12">
          <AdditionalDisclaimerInfo />
        </div>
      )}

    </div>
  );
};

export default ProductDetailClient;