'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { ArrowLeft, LoaderCircle, Save, Trash2, UploadCloud, PlusSquare } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface SourcedProduct {
  id: string;
  translatedName: string | null;
  localPrice: number | null;
  images: { url: string }[];
  videos: { url: string }[];
  detailContent: string | null;
}

const SourcedProductEditPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<SourcedProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editableImages, setEditableImages] = useState<{ url: string }[]>([]);
  const [detailContent, setDetailContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        
        const initialImages = productData.images || [];
        setEditableImages(initialImages);
        if (initialImages.length > 0) {
          setSelectedImage(initialImages[0].url);
        }

        let processedHtml = productData.detailContent || '';
        if (processedHtml && initialImages.length > 0) {
            const correctImageUrls = initialImages.map(img => img.url);
            let imageIndex = 0;
            processedHtml = processedHtml.replace(/<img[^>]*>/g, () => {
                if (imageIndex < correctImageUrls.length) {
                    const correctUrl = correctImageUrls[imageIndex];
                    imageIndex++;
                    return `<img src="${correctUrl}" style="max-width: 860px; width: 100%; height: auto; display: block; margin: 2.5rem auto;" alt="상세 이미지 ${imageIndex}" />`;
                }
                return '';
            });
        }
        setDetailContent(processedHtml);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDeleteImage = (urlToDelete: string) => {
    const newImages = editableImages.filter(image => image.url !== urlToDelete);
    setEditableImages(newImages);
    if (selectedImage === urlToDelete) {
      setSelectedImage(newImages.length > 0 ? newImages[0].url : null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'Upload failed');
        setEditableImages(prev => [...prev, { url: result.url }]);
      }
    } catch (err) {
      alert(`업로드 실패: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
    event.target.value = '';
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sourced-products/${id}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detailContent, images: editableImages })
      });
      if (!res.ok) throw new Error('Failed to save changes');
      alert('변경사항이 성공적으로 저장되었습니다.');
    } catch (err) {
      alert(`저장 실패: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterProduct = async () => {
    setIsRegistering(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: product?.translatedName,
            description: '', 
            price: product?.localPrice,
            stock: 100,
            categoryId: 'clwail60l0000wdd0n85251sv', // '구매대행' category ID
            imageUrls: editableImages.map(img => img.url),
            detailContent: detailContent,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create product');
      }
      alert('상품이 성공적으로 등록되었습니다!');
      router.push('/admin/products');
    } catch (err) {
      alert(`상품 등록 실패: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const quillModules = useMemo(() => ({ 
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      ['link', 'image']
    ]
  }), []);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoaderCircle className="animate-spin h-10 w-10" /></div>;
  if (error) return <div className="p-6 text-red-500">오류: {error}</div>;
  if (!product) return <div className="p-6">상품을 찾을 수 없습니다.</div>;

  return (
    <>
      <style jsx global>{`
        .frameless-editor .ql-toolbar.ql-snow {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background-color: #f9fafb;
          margin-bottom: 1.5rem;
        }
        .frameless-editor .ql-container.ql-snow {
          border: none;
        }
        .frameless-editor .ql-editor {
          font-size: 1.125rem; /* 18px */
          line-height: 1.75;
          color: #1f2937;
          padding: 0;
        }
        .frameless-editor .ql-editor p {
          font-size: 1.125rem !important; /* Enforce font size for paragraphs */
          margin-top: 0; /* Prevent double margin */
          margin-bottom: 1.25em;
        }
        .frameless-editor .ql-editor h1,
        .frameless-editor .ql-editor h2,
        .frameless-editor .ql-editor h3 {
          font-weight: 700;
          margin-top: 2.5em;
          margin-bottom: 1em;
          padding-bottom: 0;
          border-bottom: none;
        }
        .frameless-editor .ql-editor h1 {
          font-size: 2.25rem !important;
        }
        .frameless-editor .ql-editor h2 {
          font-size: 1.875rem !important;
        }
        .frameless-editor .ql-editor h3 {
          font-size: 1.5rem !important;
        }
      `}</style>
      <div className="bg-gray-100 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm shadow-md p-2 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"><ArrowLeft className="mr-2 h-4 w-4" />목록으로</button>
          <h1 className="text-lg font-semibold truncate mx-4 flex-1">{product.translatedName || '상품 상세 정보'}</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveChanges} disabled={isSaving || isRegistering || isUploading} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"><LoaderCircle className={`animate-spin mr-2 h-5 w-5 ${!isSaving && 'hidden'}`} /><Save className={`mr-2 h-5 w-5 ${isSaving && 'hidden'}`} />변경사항 저장</button>
            <button onClick={handleRegisterProduct} disabled={isSaving || isRegistering || isUploading} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"><LoaderCircle className={`animate-spin mr-2 h-5 w-5 ${!isRegistering && 'hidden'}`} /><UploadCloud className={`mr-2 h-5 w-5 ${isRegistering && 'hidden'}`} />최종 상품 등록</button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">이미지 갤러리 (편집)</h2>
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[1000px] h-auto mb-4 border rounded-lg overflow-hidden">
                  {selectedImage ? <Image src={selectedImage} alt="대표 이미지" width={1000} height={1000} className="w-full h-auto object-contain" priority /> : <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center text-gray-500">이미지가 없습니다.</div>}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {editableImages.map((image) => (
                    <div key={image.url} className={`w-24 h-24 relative group`}>
                      <div className={`w-full h-full relative cursor-pointer border-2 rounded-md overflow-hidden ${selectedImage === image.url ? 'border-indigo-500' : 'border-transparent'}`} onClick={() => setSelectedImage(image.url)}>
                        <Image src={image.url} alt={`썸네일`} layout="fill" objectFit="cover" className="hover:opacity-80 transition-opacity" />
                      </div>
                      <button onClick={() => handleDeleteImage(image.url)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-80 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-24 h-24 bg-gray-100 rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer disabled:opacity-50">
                    {isUploading ? <LoaderCircle className="animate-spin h-6 w-6" /> : <><PlusSquare className="h-8 w-8 mb-1" /><span className="text-xs">이미지 추가</span></>}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg mt-8 frameless-editor">
               <h2 className="text-2xl font-bold text-gray-800 mb-6">상세 내용 편집</h2>
               <ReactQuill theme="snow" value={detailContent} onChange={setDetailContent} modules={quillModules} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SourcedProductEditPage;