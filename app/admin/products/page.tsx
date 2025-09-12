'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
}

const AdminProductsPage = () => {
  // Initialize state with null to clearly represent the "loading" state
  const [products, setProducts] = useState<Product[] | null>(null);
  console.log('DEBUG: products state:', products);

  const getValidImageUrl = (url: string | undefined | null) => {
    if (!url || url.startsWith('/placeholder-product-')) {
      return '/placeholder.png'; // Use a local placeholder image
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
        setProducts([]); // On error, set to an empty array to show "No products"
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      // Refetch or filter the product list after deletion
      if (products) {
        setProducts(products.filter((p) => p.id !== productId));
      }
      alert('상품이 성공적으로 삭제되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? `삭제 실패: ${err.message}` : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // Render loading state if products is null
  if (products === null) {
    return <p>상품 목록을 불러오는 중...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">제품 관리</h1>
        <Link href="/admin/products/new" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
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
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">수정</Link>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;