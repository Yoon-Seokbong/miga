'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
// import Image from 'next/image'; // Temporarily remove Image import
// import { LoaderCircle } from 'lucide-react'; // Temporarily remove LoaderCircle import


// Define types
interface SourcedProductImage { url: string; }
interface SourcedProductVideo { url: string; }
type SourcedProductAttributes = Record<string, unknown>;
interface SourcedProduct {
  id: string;
  sourceUrl: string;
  translatedName: string | null;
  localPrice: number | null;
  detailContent: string | null;
  images: SourcedProductImage[] | null;
  videos: SourcedProductVideo[] | null;
  attributes: SourcedProductAttributes | null;
  status: string;
}

const EditSourcedProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Omit<SourcedProduct, 'detailContent'> | null>(null);
  const [detailContent, setDetailContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null); // Keep this for now, as it's used in handleFileChange

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageIndexToReplace = useRef<number | null>(null);

  const ReactQuill = useMemo(() => dynamic(() => import('react-quill'), { ssr: false }), []);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/sourced-products/${id}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('Failed to fetch product data.');
          const productData: SourcedProduct = await res.json();
          const { detailContent, ...restOfProduct } = productData;
          setProduct(restOfProduct);
          setDetailContent(detailContent || '');

          // --- NEW LOG FOR DIRECT URLS ---
          console.log('--- IMAGE URLS FOR DIRECT TEST ---', productData.images.map((img: any) => img.url));

        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!product) return;
    const { name, value } = e.target;
    let newValue: string | number = value;

    if (name === 'localPrice') {
      newValue = parseFloat(value);
      if (isNaN(newValue)) {
        newValue = 0;
      }
    }
    setProduct({ ...product, [name]: newValue });
  };

  const handleSave = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const payload = { ...product, detailContent };
      const res = await fetch(`/api/sourced-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update product.');
      }
      
      const updatedProductData: SourcedProduct = await res.json();
      const { detailContent: updatedDetailContent, ...restOfUpdatedProduct } = updatedProductData;
      setProduct(restOfUpdatedProduct);
      setDetailContent(updatedDetailContent || '');

      alert('상품 정보가 성공적으로 저장되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDetailPage = async () => {
    if (!product) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.translatedName,
          description: '', 
          images: product.images,
          sourcePlatform: '', 
          price: product.localPrice,
          attributes: product.attributes,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to generate detail page.');
      }
      const generatedHtml = await res.text();
      setDetailContent(generatedHtml);
      alert('AI 상세 페이지가 성공적으로 생성되었습니다. 내용을 확인하고 저장해주세요.');
    } catch (err) {
      alert('AI 상세 페이지 생성 중 오류 발생: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegister = async () => {
    if (!window.confirm('이 상품을 실제 판매 상품으로 등록하시겠습니까? 등록 후에는 \'구매대행\' 카테고리로 자동 저장됩니다.')) return;

    setIsRegistering(true);
    try {
      await handleSave();

      const res = await fetch('/api/admin/register-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcedProductId: id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register product.');
      }

      alert('상품이 성공적으로 등록되었습니다! 상품 목록 페이지로 이동합니다.');
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
      alert('상품 등록 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || imageIndexToReplace.current === null) return;

    const index = imageIndexToReplace.current;
    setIsUploading(index);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed');
      }

      const { url: newUrl } = await res.json();

      if (product && product.images) {
        const updatedImages = [...product.images];
        updatedImages[index] = { url: newUrl };
        setProduct({ ...product, images: updatedImages });
      }

    } catch (err) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(err);
    } finally {
      setIsUploading(null);
      imageIndexToReplace.current = null;
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading || !product) return <div className="p-6">상품 정보를 불러오는 중...</div>;
  if (error) return <div className="p-6 text-red-500">오류: {error}</div>;

  return (
    <div className="container mx-auto p-6">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <h1 className="text-3xl font-bold mb-6">소싱 상품 편집 및 등록</h1>
      <div className="space-y-8">
        {/* ... other form fields ... */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">상태</label>
          <select
            id="status"
            name="status"
            value={product.status}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="PENDING">PENDING</option>
            <option value="REVIEW">REVIEW</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* AI-Generated Detail Content */}
        <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명 (AI 생성)</label>
            <button 
                type="button" 
                onClick={handleGenerateDetailPage} 
                disabled={isGenerating || isLoading || isRegistering}
                className="ml-4 px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
                {isGenerating ? 'AI 생성 중...' : 'AI 상세페이지 생성'}
            </button>
        </div>
        {ReactQuill && (
          <ReactQuill
            theme="snow"
            value={detailContent}
            onChange={setDetailContent}
            className="bg-white"
          />
        )}

        {/* Images Section with Download/Replace */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">이미지</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.images && Array.isArray(product.images) && product.images.map((img, index) => (
              <div key={index} className="w-24 h-24 border border-gray-200 flex items-center justify-center">
                 <img
                  src={img.url}
                  alt={`Product Image ${index + 1}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                  <button
                    onClick={() => {
                      imageIndexToReplace.current = index;
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1 bg-white text-black text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    교체
                  </button>
                </div>
                {isUploading === index && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <LoaderCircle className="animate-spin h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* ... other sections ... */}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-8 border-t">
          <button type="button" onClick={() => router.back()} disabled={isLoading || isRegistering || isUploading !== null || isGenerating} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">
            목록으로
          </button>
          <button type="button" onClick={handleSave} disabled={isLoading || isRegistering || isUploading !== null || isGenerating} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={handleRegister} disabled={isLoading || isRegistering || isUploading !== null || isGenerating} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isRegistering ? '등록 중...' : (product.status === 'imported' ? '상품 등록/업데이트' : '상품 등록하기')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSourcedProductPage;
