'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Save, ArrowLeft, Settings, LoaderCircle, Download, Replace } from 'lucide-react';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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

const EditSourcedProductPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<SourcedProduct | null>(null);
  const [detailContent, setDetailContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Temporary state for sidebar form data
  const [formData, setFormData] = useState<Partial<SourcedProduct>>({});

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/sourced-products/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch product details');
        const productData = await res.json();
        setProduct(productData);
        setDetailContent(productData.detailContent || `<h1>${productData.translatedName}</h1><p>여기에 상세 내용을 입력하세요...</p>`);
        setFormData({
            translatedName: productData.translatedName,
            localPrice: productData.localPrice,
            images: productData.images,
            // Initialize other form fields as needed
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSaveAndRegister = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const finalData = { ...product, ...formData, detailContent };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: finalData.translatedName,
            description: finalData.translatedDescription,
            price: finalData.localPrice,
            stock: 100, // Placeholder
            tags: '', // Placeholder
            categoryId: 'clwail60l0000wdd0n85251sv', // Placeholder for '구매대행'
            imageUrls: finalData.images?.map(img => img.url) || [],
            detailContent: finalData.detailContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      alert('상품이 성공적으로 등록되었습니다!');
      router.push('/admin/products');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      alert(`오류: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules = useMemo(() => ({ toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'color': [] }], ['link', 'image']] }), []);

  if (isLoading) return <div className="flex justify-center items-center h-screen"> <LoaderCircle className="animate-spin h-10 w-10" /> </div>;
  if (error) return <div className="p-6 text-red-500">오류: {error}</div>;
  if (!product) return <div className="p-6">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content - Full-page Editor */}
      <div className="flex-1 flex flex-col relative">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm shadow-md p-2 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록
          </button>
          <h2 className="text-lg font-semibold truncate mx-4 flex-1">{formData.translatedName}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                <Settings className="mr-2 h-4 w-4" />
                정보/이미지 관리
            </button>
            <button onClick={handleSaveAndRegister} disabled={isSubmitting} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {isSubmitting ? <LoaderCircle className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                저장 및 상품 등록
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
                <ReactQuill theme="snow" value={detailContent} onChange={setDetailContent} modules={modules} />
            </div>
        </div>
      </div>

      {/* Sidebar for Info/Image Management */}
      <div className={`w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} fixed top-0 right-0 h-full z-30 overflow-y-auto`}>
        <div className="p-6">
            <h3 className="text-xl font-semibold mb-6">상품 정보/이미지 관리</h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">상품명</label>
                    <input type="text" name="translatedName" value={formData.translatedName || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">가격 (원)</label>
                    <input type="number" name="localPrice" value={formData.localPrice || 0} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이미지 관리</label>
                    <div className="grid grid-cols-2 gap-4">
                        {product.images?.map((image, index) => (
                            <div key={index} className="relative group">
                                <Image src={image.url} alt={`상품이미지 ${index+1}`} width={150} height={150} className="w-full h-auto rounded-md" />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 bg-white rounded-full hover:bg-gray-200"><Download className="h-4 w-4 text-gray-800" /></button>
                                    <button className="p-2 bg-white rounded-full hover:bg-gray-200"><Replace className="h-4 w-4 text-gray-800" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditSourcedProductPage;