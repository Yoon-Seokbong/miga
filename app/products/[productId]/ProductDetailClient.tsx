'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Image component
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import Link from 'next/link';
import WishlistButton from '@/components/WishlistButton'; // Import WishlistButton

// Define types
interface ProductImage { id: string; url: string; }
interface ProductVideo { id: string; url: string; }
interface ProductDetailImage { id: string; url: string; order: number; }
interface UserInfo { id: string; name: string | null; email: string | null; }

interface ReviewVideo {
  id: string;
  url: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: UserInfo;
  images?: { id: string; url: string }[];
  videos?: ReviewVideo[]; // Added for review videos
}

interface Product {
  id: string;
  name: string;
  description: string | null; // Explicitly set to string | null
  price: number;
  images: ProductImage[];
  detailImages: ProductDetailImage[];
  averageRating?: number;
  reviewCount?: number;
  relatedProducts?: Product[];
  videos?: ProductVideo[];
}

// Define props for ProductDetailClient
interface ProductDetailClientProps {
  initialProduct: Product;
  initialVideos: ProductVideo[];
  initialReviews: Review[];
}

export default function ProductDetailClient({ initialProduct, initialVideos, initialReviews }: ProductDetailClientProps) {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const [product] = useState<Product | null>(initialProduct);
  const [videos] = useState<ProductVideo[]>(initialVideos);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video'; url: string; id: string } | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const { addToCart } = useCart();

  // State for Reviews
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newReviewRating, setNewReviewRating] = useState<number | ''>(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewImages, setNewReviewImages] = useState<File[]>([]);
  const [newReviewImagePreviews, setNewReviewImagePreviews] = useState<string[]>([]);
  
  const [newReviewVideo, setNewReviewVideo] = useState<File | null>(null);
  const [newReviewVideoPreview, setNewReviewVideoPreview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewFilterRating] = useState<number | null>(null);
  const [reviewSortBy] = useState<'newest' | 'oldest' | 'highest-rating' | 'lowest-rating'>('newest');

  

  const { data: session } = useSession();
  const productId = params.productId;

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setReviewLoading(true);
    try {
      const params = new URLSearchParams({ productId });
      if (reviewFilterRating) params.append('minRating', reviewFilterRating.toString());
      if (reviewSortBy) params.append('sortBy', reviewSortBy);
      // Always fetch the first page for the product detail view for now
      params.append('page', '1');
      params.append('limit', '20'); // Limit to 20 reviews
      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data.reviews); // Correctly set the reviews from the response object
    } catch (err: unknown) {
      setReviewError((err instanceof Error) ? err.message : '리뷰를 불러오는 데 실패했습니다.');
    } finally {
      setReviewLoading(false);
    }
  }, [productId, reviewFilterRating, reviewSortBy, setReviewLoading, setReviewError, setReviews]);

  useEffect(() => {
    // Set initial selected media based on initialProduct and initialVideos
    if (initialProduct.images && initialProduct.images.length > 0) {
      setSelectedMedia({ type: 'image', url: initialProduct.images[0].url, id: initialProduct.images[0].id });
    } else if (initialVideos.length > 0) {
      setSelectedMedia({ type: 'video', url: initialVideos[0].url, id: initialVideos[0].id });
    }
    // No need to call fetchReviews here, as initialReviews are already provided
    }, [productId, initialProduct, initialVideos]); // Depend on initial data as well

  useEffect(() => {
    // Only fetch reviews if filters/sort order change, or if initialReviews were empty and need a fetch
    if (reviewFilterRating !== null || reviewSortBy !== 'newest' || initialReviews.length === 0) {
      fetchReviews();
    }
  }, [reviewFilterRating, reviewSortBy, fetchReviews, initialReviews.length]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.images[0]?.url || '' });
      setCartMessage('상품이 장바구니에 담겼습니다!');
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.images[0]?.url || '' });
      router.push('/cart');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewReviewImages(filesArray);
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setNewReviewImagePreviews(previews);
    }
  };

  const handleNewReviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewReviewVideo(file);
      const previewUrl = URL.createObjectURL(file);
      setNewReviewVideoPreview(previewUrl);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return alert('리뷰를 작성하려면 로그인해야 합니다.');
    if (!newReviewRating || newReviewRating < 1 || newReviewRating > 5) return alert('평점은 1점에서 5점 사이로 입력해주세요.');
    if (!newReviewComment) return alert('리뷰 내용을 입력해주세요.');

    setReviewLoading(true);
    setReviewError(null);

    try {
      const reviewFormData = new FormData();
      reviewFormData.append('productId', productId);
      reviewFormData.append('rating', newReviewRating.toString());
      reviewFormData.append('comment', newReviewComment);
      newReviewImages.forEach(file => reviewFormData.append('images', file));

      const reviewRes = await fetch('/api/reviews', {
        method: 'POST',
        body: reviewFormData,
      });

      if (!reviewRes.ok) throw new Error('리뷰를 제출하는 데 실패했습니다.');
      const newReview = await reviewRes.json();

      if (newReviewVideo) {
        const videoFormData = new FormData();
        videoFormData.append('video', newReviewVideo);
        const videoRes = await fetch(`/api/reviews/${newReview.id}/videos`, {
          method: 'POST',
          body: videoFormData,
        });
        if (!videoRes.ok) throw new Error('리뷰 비디오를 업로드하는 데 실패했습니다.');
      }

      setNewReviewRating(0);
      setNewReviewComment('');
      setNewReviewImages([]);
      setNewReviewImagePreviews([]);
      setNewReviewVideo(null);
      setNewReviewVideoPreview(null);
      alert('리뷰가 성공적으로 제출되었습니다.');
      fetchReviews();
    } catch (err: unknown) {
      setReviewError((err instanceof Error) ? err.message : '리뷰 제출 중 오류가 발생했습니다.');
    } finally {
      setReviewLoading(false);
    }
  };

  // ... (other functions like handleSubmitQuestion) ...


  return (
    <div className="container mx-auto p-8">
      {/* Product and Media Section */}
      <div className="flex flex-col md:flex-row gap-8 bg-card rounded-lg shadow-lg p-6">
        <div className="md:w-8/12 flex flex-col gap-4">
          <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden aspect-video">
            {selectedMedia?.type === 'image' && <Image src={selectedMedia.url} alt={product?.name || 'Product media'} width={300} height={300} priority className="w-full h-auto object-contain max-h-[70vh]" />}
            {selectedMedia?.type === 'video' && <video src={selectedMedia.url} controls autoPlay muted className="w-full h-full object-contain"></video>}
            {!selectedMedia && <div className="w-full aspect-square flex items-center justify-center"><span className="text-gray-500">[미디어 없음]</span></div>}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product?.images?.map(image => <button key={image.id} onClick={() => setSelectedMedia({ type: 'image', url: image.url, id: image.id })} className={`aspect-square w-full rounded-md overflow-hidden border-2 ${selectedMedia?.id === image.id ? 'border-primary' : 'border-transparent'}`}><Image src={image.url} alt={product?.name || 'Product thumbnail'} width={100} height={100} className="w-full h-full object-cover" /></button>)}
            {videos.map(video => <button key={video.id} onClick={() => setSelectedMedia({ type: 'video', url: video.url, id: video.id })} className={`aspect-square w-full rounded-md overflow-hidden border-2 ${selectedMedia?.id === video.id ? 'border-primary' : 'border-transparent'} flex items-center justify-center bg-black`}><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg></button>)}
          </div>
        </div>
        <div className="md:w-4/12 space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{product?.name}</h1>
          {product?.averageRating !== undefined && product?.reviewCount !== undefined && <div className="flex items-center text-lg text-gray-600 mb-2"><span className="text-yellow-500 mr-1">{'★'.repeat(Math.round(product.averageRating))}{'☆'.repeat(5 - Math.round(product.averageRating))}</span><span>{product.averageRating.toFixed(1)} ({product.reviewCount} 리뷰)</span></div>}
          
          <p className="text-foreground font-bold text-3xl">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(product?.price || 0)}</p>
          <div className="flex gap-2 mt-4"><button onClick={handleAddToCart} className="flex-1 bg-primary text-white py-3 rounded-full text-lg font-semibold hover:bg-purple-800 transition duration-300" style={{ color: 'white' }}>장바구니에 추가</button><button onClick={handleBuyNow} className="flex-1 bg-secondary text-white py-3 rounded-full text-lg font-semibold hover:bg-yellow-600 transition duration-300">결제하기</button></div>
          {cartMessage && <p className="text-center text-green-500 text-sm mt-2">{cartMessage}</p>}
        </div>
      </div>
      {/* Detail Content Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">제품 상세</h2>
        {product?.detailContent ? (
          <div className="prose lg:prose-xl max-w-none mx-auto p-4 bg-white rounded-lg shadow" dangerouslySetInnerHTML={{ __html: product.detailContent }} />
        ) : product?.description ? (
          <div className="prose lg:prose-xl max-w-none mx-auto p-4 bg-white rounded-lg shadow" dangerouslySetInnerHTML={{ __html: product.description }} />
        ) : product?.detailImages && product.detailImages.length > 0 ? (
          <div className="space-y-2">
            {product.detailImages.map(detailImage => (
              <Image
                key={detailImage.id}
                src={detailImage.url}
                alt={`${product?.name} detail image ${detailImage.order + 1}`}
                width={800}
                height={600}
                className="w-full h-auto"
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">제품 상세 내용이 없습니다.</p>
        )}
      </div>
      {/* Product Reviews Section */}
      <div className="mt-12 p-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-foreground mb-6">상품 리뷰</h2>
        {/* Review Display */}
        {reviews.length === 0 ? <p className="text-center text-gray-600">아직 작성된 리뷰가 없습니다.</p> : <div className="space-y-6">{reviews.map(review => (<div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0"><div className="flex justify-between items-center mb-2"><span className="font-semibold text-foreground">{review.user.name || review.user.email}</span><span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span></div><div className="text-yellow-500 mb-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p className="text-foreground">{review.comment}</p>{review.videos && review.videos.length > 0 && (<div className="mt-4">{review.videos.map(video => (<video key={video.id} src={video.url} controls className="w-full max-w-md rounded-md"></video>))}</div>)}</div>))}</div>}

        {/* Review Submission Form */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-foreground mb-4">리뷰 작성</h3>
          {session?.user ? (<form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating, Comment, Image Uploads... */}
            <div className="mb-4">
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">평점</label>
              <input type="number" id="rating" value={newReviewRating} onChange={e => setNewReviewRating(e.target.value === '' ? '' : parseInt(e.target.value))} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" min="1" max="5" />
            </div>
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea id="comment" value={newReviewComment} onChange={e => setNewReviewComment(e.target.value)} required rows={4} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="newReviewImages" className="block text-sm font-medium text-gray-700 mb-1">이미지</label>
              <input type="file" id="newReviewImages" onChange={handleImageChange} multiple accept="image/*" className="hidden" />
              <label htmlFor="newReviewImages" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                파일 선택
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newReviewImagePreviews.map((preview, index) => (
                <Image key={index} src={preview} alt={`미리보기 이미지 ${index + 1}`} width={96} height={96} className="object-cover rounded-md" />
              ))}
            </div>
            <div className="mb-4">
              <label htmlFor="newReviewVideo" className="block text-sm font-medium text-gray-700 mb-1">비디오</label>
              <input type="file" id="newReviewVideo" onChange={handleNewReviewVideoChange} accept="video/*" className="hidden" />
              <label htmlFor="newReviewVideo" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                파일 선택
              </label>
            </div>
            {newReviewVideoPreview && <video src={newReviewVideoPreview} controls className="w-full max-w-xs mt-2 rounded"></video>}
            <Button type="submit" disabled={reviewLoading}>{reviewLoading ? '제출 중...' : '리뷰 제출'}</Button>
            {reviewError && <p className="text-red-500 text-sm mt-2">{reviewError}</p>}
          </form>) : (<p>리뷰를 작성하려면 <Link href="/auth/login">로그인</Link> 해주세요.</p>)}
        </div>
      </div>
      {/* Recommended Products Section */}
      {product?.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-12 p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">추천 상품</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {product.relatedProducts.map(relatedProduct => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 group">
                  <div className="relative w-full h-48">
                    <Image
                      src={(relatedProduct.images && relatedProduct.images[0]?.url) || '/placeholder.png'}
                      alt={relatedProduct.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center"
                    />
                    <WishlistButton productId={relatedProduct.id} className="absolute top-2 right-2 z-10" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-purple-600">{relatedProduct.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{relatedProduct.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 dark:text-white font-bold text-lg">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(relatedProduct.price || 0)}</span>
                      <Button onClick={e => { e.preventDefault(); addToCart({ id: relatedProduct.id, name: relatedProduct.name, price: relatedProduct.price, imageUrl: (relatedProduct.images && relatedProduct.images[0]?.url) || '' }); }} size="sm">장바구니에 추가</Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
