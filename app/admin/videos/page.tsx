'use client';

import React, { useState, useEffect } from 'react';

// Type Definitions
interface ProductVideo {
  id: string;
  url: string;
  productId: string;
  product: {
    name: string;
  };
}

interface ReviewVideo {
  id: string;
  url: string;
  reviewId: string;
  review: {
    product: {
      name: string;
    };
  };
}

interface Video {
  id: string;
  url: string;
  type: 'Product' | 'Review';
  relatedId: string; // Product or Review ID
  relatedName: string;
}

const AdminVideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const [productVideosRes, reviewVideosRes] = await Promise.all([
        fetch('/api/admin/products/videos'), // Assuming this endpoint will be created
        fetch('/api/admin/reviews/videos'),
      ]);

      if (!productVideosRes.ok || !reviewVideosRes.ok) {
        throw new Error('Failed to fetch one or more video resources');
      }

      const productVideos: ProductVideo[] = await productVideosRes.json();
      const reviewVideos: ReviewVideo[] = await reviewVideosRes.json();

      const combinedVideos: Video[] = [
        ...productVideos.map((v): Video => ({
          id: v.id,
          url: v.url,
          type: 'Product',
          relatedId: v.productId,
          relatedName: v.product.name,
        })),
        ...reviewVideos.map((v): Video => ({
          id: v.id,
          url: v.url,
          type: 'Review',
          relatedId: v.reviewId,
          relatedName: `Review for ${v.review.product.name}`,
        })),
      ];
      
      combinedVideos.sort((a, b) => b.id.localeCompare(a.id)); // Sort by ID as a proxy for date

      setVideos(combinedVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (video: Video) => {
    const endpoint = video.type === 'Product'
      ? `/api/products/${video.relatedId}/videos/${video.id}`
      : `/api/reviews/${video.relatedId}/videos/${video.id}`;

    if (!confirm(`정말로 이 비디오를 삭제하시겠습니까? (${video.url})`)) return;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete video');
      }
      setVideos(videos.filter(v => v.id !== video.id));
      alert('비디오가 삭제되었습니다.');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (isLoading) return <p>Loading videos...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">비디오 관리</h1>
      {videos.length === 0 ? (
        <p>업로드된 비디오가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map(video => (
            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative w-full h-40 bg-black">
                <video src={video.url} controls className="w-full h-full object-contain" />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold">Type: {video.type}</p>
                <p className="text-xs text-gray-600 truncate">Associated with: {video.relatedName}</p>
                <button onClick={() => handleDelete(video)} className="mt-4 w-full text-sm text-red-600 hover:text-red-900 font-semibold py-2 bg-red-100 rounded-md">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVideosPage;