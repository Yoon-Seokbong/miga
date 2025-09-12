'use client';

import React, { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string };
  product: { id: string; name: string };
}

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reviews?all=true'); // Assuming this endpoint exists for admins
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      // Refresh the list to show the updated status
      fetchReviews();
    } catch (err) {
      alert(`Error updating status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete review');
      }
      setReviews(reviews.filter(r => r.id !== reviewId));
      alert('리뷰가 삭제되었습니다.');
    } catch (err) {
      alert(`Error deleting review: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <p>Loading reviews...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">리뷰 관리</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.user.name || review.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{review.comment}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {review.status !== 'APPROVED' && <button onClick={() => handleUpdateStatus(review.id, 'APPROVED')} className="text-green-600 hover:text-green-900">승인</button>}
                    {review.status !== 'REJECTED' && <button onClick={() => handleUpdateStatus(review.id, 'REJECTED')} className="text-yellow-600 hover:text-yellow-900">거절</button>}
                    <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:text-red-900">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reviews.length === 0 && <p className="p-4 text-center text-gray-500">작성된 리뷰가 없습니다.</p>}
      </div>
    </div>
  );
};

export default AdminReviewsPage;