'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import Link from 'next/link';
import Image from 'next/image';

// Define types (these should ideally be imported from a shared types file)
interface UserInfo { id: string; name: string | null; email: string | null; }
interface ReviewVideo { id: string; url: string; }
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: UserInfo;
  images?: { id: string; url: string }[];
  videos?: ReviewVideo[];
}

interface ProductReviewsProps {
  initialReviews?: Review[]; // Optional: if you want to pass initial reviews from server
}

export default function ProductReviews({ initialReviews }: ProductReviewsProps) {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const { data: session } = useSession();

  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
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

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setReviewLoading(true);
    try {
      const params = new URLSearchParams({ productId });
      if (reviewFilterRating) params.append('minRating', reviewFilterRating.toString());
      if (reviewSortBy) params.append('sortBy', reviewSortBy);
      params.append('page', '1');
      params.append('limit', '20');
      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data.reviews);
    } catch (err: unknown) {
      setReviewError((err as Error).message || '리뷰를 불러오는 데 실패했습니다.');
    } finally {
      setReviewLoading(false);
    }
  }, [productId, reviewFilterRating, reviewSortBy, setReviewLoading, setReviews, setReviewError]);

  useEffect(() => {
    fetchReviews();
  }, [productId, reviewFilterRating, reviewSortBy, fetchReviews]);

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
      setReviewError((err as Error).message);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="mt-12 p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-foreground mb-6">상품 리뷰</h2>
      {/* Review Display */}
      {reviews.length === 0 ? <p className="text-center text-gray-600">아직 작성된 리뷰가 없습니다.</p> : <div className="space-y-6">{reviews.map(review => (<div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0"><div className="flex justify-between items-center mb-2"><span className="font-semibold text-foreground">{review.user.name || review.user.email}</span><span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span></div><div className="text-yellow-500 mb-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p className="text-foreground">{review.comment}</p>{review.videos && review.videos.length > 0 && (<div className="mt-4">{review.videos.map(video => (<video key={video.id} src={video.url} controls className="w-full max-w-md rounded-md"></video>))}</div>)}</div>))}</div>}
      
      {/* Review Submission Form */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-foreground mb-4">리뷰 작성</h3>
        {session?.user ? (<form onSubmit={handleSubmitReview} className="space-y-4">
          {/* Rating, Comment, Image Uploads... */}
          <div><label htmlFor="rating">평점</label><input type="number" id="rating" value={newReviewRating} onChange={e => setNewReviewRating(e.target.value === '' ? '' : parseInt(e.target.value))} required /></div>
          <div><label htmlFor="comment">내용</label><textarea id="comment" value={newReviewComment} onChange={e => setNewReviewComment(e.target.value)} required></textarea></div>
          <div><label htmlFor="newReviewImages">이미지</label><input type="file" id="newReviewImages" onChange={handleImageChange} multiple accept="image/*" /></div>
          <div className="flex flex-wrap gap-2 mt-2">
            {newReviewImagePreviews.map((preview, index) => (
              <Image key={index} src={preview} alt={`미리보기 이미지 ${index + 1}`} width={96} height={96} className="object-cover rounded-md" />
            ))}
          </div>
          <div><label htmlFor="newReviewVideo">비디오</label><input type="file" id="newReviewVideo" onChange={handleNewReviewVideoChange} accept="video/*" /></div>
          {newReviewVideoPreview && <video src={newReviewVideoPreview} controls className="w-full max-w-xs mt-2 rounded"></video>}
          <Button type="submit" disabled={reviewLoading}>{reviewLoading ? '제출 중...' : '리뷰 제출'}</Button>
          {reviewError && <p className="text-red-500 text-sm mt-2">{reviewError}</p>}
        </form>) : (<p>리뷰를 작성하려면 <Link href="/auth/login">로그인</Link> 해주세요.</p>)}
      </div>
    </div>
  );
}