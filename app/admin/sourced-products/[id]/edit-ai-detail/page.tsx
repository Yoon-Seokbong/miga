'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save, Sparkles, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

interface SourcedProduct {
  id: string;
  translatedName: string | null;
  translatedDescription: string | null;
  localPrice: number | null;
  images: { url: string }[];
  videos: { url: string }[];
  detailContent: string | null;
  categoryId?: string;
  stock?: number;
  tags?: string;
}

const EditAiDetailPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<SourcedProduct | null>(null);
  const [generatedDetailContent, setGeneratedDetailContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const ReactQuill = useMemo(() => dynamic(() => import('react-quill-new'), { ssr: false }), []);

  useEffect(() => {
    if (!id) return;
    const fetchProductData = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/sourced-products/${id}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('Failed to fetch product details');
          const productData = await res.json();
          setProduct(productData);
          setGeneratedDetailContent(productData.detailContent || '');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoading(false);
        }
      };
    fetchProductData();
  }, [id]);

  const handleGenerateAiContent = async () => {
    if (!product) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/generate-detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.translatedName,
          description: product.translatedDescription,
          images: product.images,
          sourcePlatform: '1688',
          price: product.localPrice,
          attributes: {},
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate AI content');
      }

      const htmlContent = await res.text();
      setGeneratedDetailContent(htmlContent);
      alert('AI 상세페이지 내용이 성공적으로 생성되었습니다!');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      alert(`AI 상세페이지 생성 오류: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    if (!product || !generatedDetailContent) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sourced-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailContent: generatedDetailContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save content');
      }

      alert('상세페이지 내용이 성공적으로 저장되었습니다!');
      router.refresh(); 

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      alert(`상세페이지 내용 저장 오류: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"> <LoaderCircle className="animate-spin h-10 w-10" /> </div>;
  if (error) return <div className="p-6 text-red-500">오류: {error}</div>;
  if (!product) return <div className="p-6">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </button>
        <h1 className="text-2xl font-bold">AI 상세페이지 편집: {product.translatedName}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAiContent}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isGenerating ? <LoaderCircle className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
            AI 상세페이지 생성
          </button>
          <button
            onClick={handleSaveContent}
            disabled={isSaving || !generatedDetailContent}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isSaving ? <LoaderCircle className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
            내용 저장
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-md">
        {isClient && ReactQuill && (
            <ReactQuill
                theme="snow"
                value={generatedDetailContent}
                onChange={setGeneratedDetailContent}
                className="bg-white"
                style={{ height: '600px', marginBottom: '50px' }}
            />
        )}
        {!isClient && <div style={{ height: '600px', marginBottom: '50px' }} className="bg-gray-100 rounded animate-pulse"></div>}
      </div>
    </div>
  );
};

export default EditAiDetailPage;
