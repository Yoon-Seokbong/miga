'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, LoaderCircle, Edit } from 'lucide-react';
import Link from 'next/link';

interface SourcedProduct {
  id: string;
  translatedName: string | null;
  localPrice: number | null;
  images: { url: string }[];
  videos: { url: string }[];
  detailContent: string | null;
}

const SourcedProductDetailPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<SourcedProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/sourced-products/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch product details');
        const productData = await res.json();
        setProduct(productData);
        if (productData.images && productData.images.length > 0) {
          setSelectedImage(productData.images[0].url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const processedDetailContent = useMemo(() => {
    if (!product?.detailContent) return '<p>생성된 상세페이지 내용이 없습니다.</p>';

    const correctImageUrls = product.images.map(img => img.url);
    let imageIndex = 0;

    // Replace every <img ...> tag with a new one having the correct src and style
    const newContent = product.detailContent.replace(/<img[^>]*>/g, () => {
        if (imageIndex < correctImageUrls.length) {
            const correctUrl = correctImageUrls[imageIndex];
            imageIndex++;
            // Return a new img tag with the correct src and inline styles
            return `<img src="${correctUrl}" style="max-width: 860px; width: 100%; height: auto; display: block; margin: 2rem auto;" alt="상세 이미지 ${imageIndex}" />`;
        }
        // If there are more img tags in HTML than in our images array, remove them
        return ''; 
    });

    return newContent;
  }, [product]);


  if (isLoading) return <div className="flex justify-center items-center h-screen"> <LoaderCircle className="animate-spin h-10 w-10" /> </div>;
  if (error) return <div className="p-6 text-red-500">오류: {error}</div>;
  if (!product) return <div className="p-6">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm shadow-md p-2 flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </button>
        <h1 className="text-lg font-semibold truncate mx-4 flex-1">
          {product.translatedName || '상품 상세 정보'}
        </h1>
        <Link href={`/admin/sourced-products/${id}/edit-ai-detail`} legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Edit className="-ml-1 mr-2 h-5 w-5" />
                AI 상세페이지 편집
            </a>
        </Link>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Image Gallery Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">이미지 갤러리</h2>
            <div className="flex flex-col items-center">
              {/* Main Image */}
              <div className="w-full max-w-[1000px] h-auto mb-4 border rounded-lg overflow-hidden">
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt="대표 이미지"
                    width={1000}
                    height={1000}
                    className="w-full h-auto object-contain"
                    priority
                  />
                ) : (
                  <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center text-gray-500">
                    이미지가 없습니다.
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="flex flex-wrap justify-center gap-2">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`w-24 h-24 relative cursor-pointer border-2 rounded-md overflow-hidden ${selectedImage === image.url ? 'border-indigo-500' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <Image
                      src={image.url}
                      alt={`썸네일 ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                      className="hover:opacity-80 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generated Content Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">AI 생성 상세페이지 미리보기 (헤드카피, 서브카피, 이미지 등)</h2>
             <div 
                className="max-w-none" 
                dangerouslySetInnerHTML={{ __html: processedDetailContent }} 
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SourcedProductDetailPage;
