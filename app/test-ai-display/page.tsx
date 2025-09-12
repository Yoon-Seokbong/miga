'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save, Sparkles, ArrowLeft } from 'lucide-react';
import parse from 'html-react-parser';
import Image from 'next/image'; // Import Next.js Image component

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

const TestAiDisplayPage = () => {
  const router = useRouter();
  // For testing, we'll use a hardcoded ID or fetch a default product
  const id = 'cmfeivqi70006wdzspv6jmbrl'; // Using the previous test product ID

  const [product, setProduct] = useState<SourcedProduct | null>(null);
  const [generatedDetailContent, setGeneratedDetailContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sourced-products/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch product details');
      const productData = await res.json();
      setProduct(productData);
      setGeneratedDetailContent(productData.detailContent || ''); // Load existing AI content if any
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAiContent = async () => {
    if (!product) return;
    setIsGenerating(true);
    setError(null);
    try {
      console.log('Images being sent to AI API:', product.images);
      const res = await fetch('/api/admin/generate-detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.translatedName,
          description: product.translatedDescription,
          images: product.images, // Pass images to AI API
          sourcePlatform: '1688', // Assuming 1688 for now
          price: product.localPrice,
          attributes: {}, // Assuming attributes are not directly used by AI for now
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate AI content');
      }

      const htmlContent = await res.text(); // API returns HTML directly
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
      // Optionally, navigate back or refresh product data
      fetchProductData();

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

      <div className="prose max-w-none">
        {generatedDetailContent ? (
          parse(generatedDetailContent, {
            replace: (node) => {
              if (node.type === 'tag' && node.name === 'img') {
                const { src, alt, width, height, style } = node.attribs;
                // Attempt to parse width/height from style or use defaults
                const parsedWidth = style && style.match(/width:\s*(\d+)px/)?.[1] ? parseInt(style.match(/width:\s*(\d+)px/)[1]) : (width ? parseInt(width) : 800); // Default to 800px
                const parsedHeight = style && style.match(/height:\s*(\d+)px/)?.[1] ? parseInt(style.match(/height:\s*(\d+)px/)[1]) : (height ? parseInt(height) : 600); // Default to 600px

                // Convert style string to object for Next.js Image component
                const styleObject = style ? Object.fromEntries(style.split(';').filter(s => s.trim()).map(s => {
                  const [key, value] = s.split(':').map(part => part.trim());
                  return [key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()), value];
                })) : {};

                return (
                  <Image
                    src={src || '/placeholder.png'} // Fallback to placeholder if src is missing
                    alt={alt || 'Generated Image'}
                    width={parsedWidth}
                    height={parsedHeight}
                    style={styleObject} // Pass original style as object
                  />
                );
              }
              return node;
            },
          })
        ) : (
          <p className="text-gray-500">AI 상세페이지 내용을 생성해주세요.</p>
        )}
      </div>
    </div>
  );
};

export default TestAiDisplayPage;
