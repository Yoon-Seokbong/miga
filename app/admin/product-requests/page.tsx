'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';



interface ProductRequest {
  id: string;
  productName: string;
  productUrl: string | null;
  description: string | null;
  requesterEmail: string | null;
  imageUrl: string | null;
  status: string; // e.g., "pending", "approved", "rejected"
  createdAt: string;
}

const AdminProductRequestsPage = () => {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);

  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/product-requests?page=${page}&limit=${limit}`);
        if (!res.ok) {
          throw new Error('Failed to fetch product requests');
        }
        const data = await res.json();
        setRequests(data.requests);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [page, limit]);

  const handleViewDetails = (request: ProductRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
    console.log('Selected Request Image URL:', request.imageUrl);
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('정말로 이 상품 요청을 삭제하시겠습니까?')) {
      return;
    }
    try {
      const res = await fetch(`/api/product-requests/${requestId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '요청 삭제에 실패했습니다.');
      }
      setRequests(prev => prev.filter(req => req.id !== requestId));
      alert('상품 요청이 성공적으로 삭제되었습니다.');
    } catch (err) {
      alert(`삭제 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  if (isLoading) return <p>상품 요청 목록을 불러오는 중...</p>;
  if (error) return <p className="text-red-500">오류: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">상품 요청 관리</h1>

      {requests.length === 0 ? (
        <p>접수된 상품 요청이 없습니다.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청자 이메일</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청일</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.productName}</div>
                    {request.productUrl && (
                      <Link href={request.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                        (링크)
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.requesterEmail || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 line-clamp-2">{request.description || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.imageUrl ? (
                      <a href={request.imageUrl} target="_blank" rel="noopener noreferrer">
                        <Image src={request.imageUrl} alt={request.productName} width={50} height={50} className="object-cover rounded" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">No Img</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleViewDetails(request)} className="text-indigo-600 hover:text-indigo-900 mr-4">상세</button>
                    <button onClick={() => handleDelete(request.id)} className="text-red-600 hover:text-red-900">삭제</button>
                  </td>
                </tr>
              ))} 
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1 mx-1 border rounded-md disabled:opacity-50"
              >
                이전
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 mx-1 border rounded-md ${page === i + 1 ? 'bg-blue-500 text-white' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 mx-1 border rounded-md disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-8 bg-white w-full max-w-lg mx-auto rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">상품 요청 상세 보기</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>상품명:</strong> {selectedRequest.productName}</p>
              {selectedRequest.productUrl && <p><strong>URL:</strong> <Link href={selectedRequest.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedRequest.productUrl}</Link></p>}
              <p><strong>설명:</strong> {selectedRequest.description || 'N/A'}</p>
              <p><strong>요청자 이메일:</strong> {selectedRequest.requesterEmail || 'N/A'}</p>
              {selectedRequest.imageUrl && (
                <div>
                  <strong>이미지:</strong>
                  <a href={selectedRequest.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Image src={selectedRequest.imageUrl} alt="요청 이미지" width={100} height={100} className="mt-2 object-cover rounded" />
                  </a>
                </div>
              )}
              <p><strong>상태:</strong> {selectedRequest.status}</p>
              <p><strong>요청일:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductRequestsPage;
