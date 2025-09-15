'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added this line
import { LoaderCircle, Wand2, Trash2, Edit } from 'lucide-react';

interface SourcedProduct {
  id: string;
  sourceUrl: string;
  translatedName: string | null;
  localPrice: number | null;
  status: string;
  createdAt: string;
  images: { url: string }[];
  translatedDescription: string | null;
  attributes: Record<string, unknown> | null;
}

const SourcedProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<SourcedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [actionStates, setActionStates] = useState<Record<string, { isLoading: boolean; error: string | null }>>({});

  const fetchSourcedProducts = useCallback(async () => {
    if (products.length === 0) setIsLoading(true);
    try {
      const res = await fetch(`/api/sourced-products?page=${page}&limit=${limit}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch sourced products');
      const data = await res.json();
      setProducts(data.sourcedProducts);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, products.length]);

  useEffect(() => {
    fetchSourcedProducts();
  }, [fetchSourcedProducts]);

  const setRowState = (id: string, isLoading: boolean, error: string | null) => {
    setActionStates(prev => ({ ...prev, [id]: { isLoading, error } }));
  };

  const handleGenerateDetailPage = async (product: SourcedProduct) => {
    setRowState(product.id, true, null);
    try {
      const res = await fetch('/api/admin/generate-detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.translatedName,
          description: product.translatedDescription, // Corrected from product.description
          images: product.images,
          price: product.localPrice,
          attributes: product.attributes,
          sourcePlatform: new URL(product.sourceUrl).hostname,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '상세페이지 생성에 실패했습니다.');
      }

      const generatedHtml = await res.text();

      const saveRes = await fetch(`/api/sourced-products/${product.id}` , {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detailContent: generatedHtml })
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json();
        throw new Error(errorData.error || '생성된 상세페이지 저장에 실패했습니다.');
      }

      alert('AI 상세페이지가 성공적으로 생성 및 저장되었습니다! 결과 확인 페이지로 이동합니다.');
      router.push(`/admin/sourced-products/${product.id}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setRowState(product.id, false, errorMessage);
      alert(`오류 발생: ${errorMessage}`);
    } finally {
      setRowState(product.id, false, null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('정말로 이 소싱 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      const res = await fetch(`/api/sourced-products/${productId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '삭제에 실패했습니다.');
      }
      alert('상품이 성공적으로 삭제되었습니다.');
      fetchSourcedProducts(); // Re-fetch data to update the list
    } catch (err) {
      alert(`삭제 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  if (isLoading && products.length === 0) return <div className="p-6">목록을 불러오는 중...</div>;
  if (error) return <div className="p-6 text-red-500">오류: {error}</div>;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">소싱 상품 목록</h1>
      <p className="mb-4 text-gray-600">외부 사이트에서 가져온 상품 목록입니다. AI로 상세페이지를 생성하고 검토할 수 있습니다.</p>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">상품명 (번역)</th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">예상 판매가</th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">상태</th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">가져온 날짜</th>
              <th scope="col" className="px-2 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const state = actionStates[product.id] || { isLoading: false, error: null };
              return (
                <tr key={product.id}>
                  <td className="px-2 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                    <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" title={product.translatedName || ''}>
                        {product.translatedName || '이름 없음'}
                    </a>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700">{product.localPrice ? `${product.localPrice.toLocaleString()}원` : '미정'}</td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'IMPORTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => handleGenerateDetailPage(product)}
                        disabled={state.isLoading}
                        title="AI 상세페이지 생성"
                        className="inline-flex items-center p-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {state.isLoading ? <LoaderCircle className="animate-spin h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
                      </button>
                      <Link href={`/admin/sourced-products/${product.id}`} title="AI 상세페이지 편집" className="inline-flex items-center p-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                        <Edit className="h-4 w-4"/>
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        title="삭제"
                        className="inline-flex items-center p-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {state.error && <p className="text-red-500 text-xs mt-1">Error: {state.error}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center py-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 mx-1 border rounded-md disabled:opacity-50">
              이전
            </button>
            <span className="text-sm text-gray-700">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 mx-1 border rounded-md disabled:opacity-50">
              다음
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default SourcedProductsPage;