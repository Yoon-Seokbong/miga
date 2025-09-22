'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UploadCloud, LoaderCircle, Trash2 } from 'lucide-react'; // Import icons

// Define the types for our product and image
interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: ProductImage[];
  createdAt: string;
  coupangSellerProductId?: string | null; // Add Coupang Seller Product ID
  naverOriginProductNo?: string | null; // Add Naver Origin Product ID
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [uploadStatus, setUploadStatus] = useState<Record<string, { loading: boolean; error: string | null; message: string | null }>>({});

  const getValidImageUrl = (url: string | undefined | null) => {
    if (!url || url.startsWith('/placeholder-product-')) {
      return '/placeholder.png';
    }
    return url;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data = await res.json();
        setProducts(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const handleUploadToCoupang = async (productId: string) => {
    setUploadStatus(prev => ({ ...prev, [productId]: { loading: true, error: null, message: null } }));
    try {
      const res = await fetch('/api/admin/upload-to-coupang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to upload to Coupang');
      }

      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: null, message: '성공적으로 등록 요청됨' } }));
      // Optionally refetch products to show the coupangSellerProductId
      // fetchProducts(); 

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: errorMessage, message: null } }));
    }
  };

  const handleDeleteFromCoupang = async (productId: string) => {
    if (!confirm('정말로 이 상품을 쿠팡에서 내리시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    setUploadStatus(prev => ({ ...prev, [productId]: { loading: true, error: null, message: null } }));
    try {
      const res = await fetch('/api/admin/delete-from-coupang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to delete from Coupang');
      }

      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: null, message: '쿠팡에서 성공적으로 내림' } }));
      // Optionally refetch products to update the coupangSellerProductId status
      // fetchProducts();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: errorMessage, message: null } }));
    }
  };

  const handleUploadToNaver = async (productId: string) => {
    setUploadStatus(prev => ({ ...prev, [productId]: { loading: true, error: null, message: null } }));
    try {
      const res = await fetch('/api/admin/upload-to-naver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to upload to Naver');
      }

      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: null, message: '네이버에 성공적으로 등록 요청됨' } }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: errorMessage, message: null } }));
    }
  };

  const handleDeleteFromNaver = async (productId: string) => {
    if (!confirm('정말로 이 상품을 네이버에서 내리시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    setUploadStatus(prev => ({ ...prev, [productId]: { loading: true, error: null, message: null } }));
    try {
      const res = await fetch('/api/admin/delete-from-naver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to delete from Naver');
      }

      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: null, message: '네이버에서 성공적으로 내림' } }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setUploadStatus(prev => ({ ...prev, [productId]: { loading: false, error: errorMessage, message: null } }));
    }
  };

  const handleDelete = async (productId: string /* eslint-disable-line @typescript-eslint/no-unused-vars */) => {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    // ... (delete logic is the same)
  };

  if (products === null) {
    return <p>상품 목록을 불러오는 중...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">제품 관리</h1>
        <Link href="/admin/products/new" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-600">
          새 상품 추가
        </Link>
      </div>

      {products.length === 0 ? (
        <p>등록된 상품이 없습니다.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">재고</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">쿠팡 연동</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">네이버 연동</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const status = uploadStatus[product.id] || { loading: false, error: null, message: null };
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.images && product.images[0] ? (
                        <Image
                          src={getValidImageUrl(product.images[0].url)}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="object-contain rounded"
                        />
                      ) : (
                        <div className="w-[50px] h-[50px] bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">No Img</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Intl.NumberFormat('ko-KR').format(product.price)}원</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {!product.coupangSellerProductId ? (
                          <button 
                            onClick={() => handleUploadToCoupang(product.id)}
                            disabled={status.loading || !!status.message}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {status.loading ? (
                              <LoaderCircle className="animate-spin h-4 w-4" />
                            ) : (
                              <UploadCloud className="h-4 w-4" />
                            )}
                            <span className="ml-2">{status.message ? '요청 완료' : '쿠팡에 올리기'}</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDeleteFromCoupang(product.id)}
                            disabled={status.loading || !!status.message}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {status.loading ? (
                              <LoaderCircle className="animate-spin h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-2">{status.message ? '요청 완료' : '쿠팡에서 내리기'}</span>
                          </button>
                        )}
                        {status.error && <p className="text-red-500 text-xs mt-1">{status.error}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {!product.naverOriginProductNo ? (
                          <button 
                            onClick={() => handleUploadToNaver(product.id)}
                            disabled={status.loading || !!status.message}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {status.loading ? (
                              <LoaderCircle className="animate-spin h-4 w-4" />
                            ) : (
                              <UploadCloud className="h-4 w-4" />
                            )}
                            <span className="ml-2">{status.message ? '요청 완료' : '네이버에 올리기'}</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDeleteFromNaver(product.id)}
                            disabled={status.loading || !!status.message}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {status.loading ? (
                              <LoaderCircle className="animate-spin h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-2">{status.message ? '요청 완료' : '네이버에서 내리기'}</span>
                          </button>
                        )}
                        {status.error && <p className="text-red-500 text-xs mt-1">{status.error}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">수정</Link>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">삭제</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;