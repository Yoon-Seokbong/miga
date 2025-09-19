'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, LoaderCircle, Save, Trash2, UploadCloud, PlusSquare, Replace, Download } from 'lucide-react';
import NativeEditor from '@/components/NativeEditor'; // Import our new custom editor
import ToastNotification from '@/components/ToastNotification'; // ADDED

// Simplified interfaces for clarity
interface SourcedProduct {
  id: string;
  translatedName: string | null;
  translatedDescription?: string | null;
  localPrice: number | null;
  images: { url: string }[];
  videos: { url: string }[];
  detailContent: string | null;
  categoryId?: string;
  stock?: number;
  tags?: string;
}

interface Category {
    id: string;
    name: string;
}

const SourcedProductEditPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const id = params.id as string;
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<SourcedProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editableImages, setEditableImages] = useState<{ url: string }[]>([]);
  const [detailContent, setDetailContent] = useState('');
  const [imageToReplace, setImageToReplace] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/sourced-products/${id}`, { cache: 'no-store' }),
          fetch('/api/categories'),
        ]);

        if (!productRes.ok) throw new Error('Failed to fetch product details');
        const productData = await productRes.json();
        
        if(categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            setCategories(categoriesData || []);
        }

        const initialProduct = { ...productData, stock: productData.stock ?? 0 };
        setProduct(initialProduct);

        const initialImages = productData.images || [];
        setEditableImages(initialImages);
        if (initialImages.length > 0) {
          setSelectedImage(initialImages[0].url);
        }

        setDetailContent(productData.detailContent || '');

      } catch (err) {
        console.error(err);
        setToast({ message: `데이터 불러오기 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
        console.log('Setting toast:', `데이터 불러오기 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => {
      if (!prev) return null;
      const newValue = (name === 'localPrice' || name === 'stock') ? (value === '' ? null : Number(value)) : value;
      return { ...prev, [name]: newValue };
    });
  };

  const handleDownloadImage = (url: string) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = url.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch(() => setToast({ message: '이미지를 다운로드하는 데 실패했습니다.', type: 'error' }));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Upload failed');
    return result.url;
  }

  const handleDeleteImage = (urlToDelete: string) => {
    setEditableImages(prev => prev.filter(image => image.url !== urlToDelete));
    if (selectedImage === urlToDelete) {
      const remainingImages = editableImages.filter(img => img.url !== urlToDelete);
      setSelectedImage(remainingImages.length > 0 ? remainingImages[0].url : null);
    }
    setToast({ message: '갤러리에서 이미지가 삭제되었습니다. 에디터 내의 이미지는 수동으로 삭제해주세요.', type: 'success' });
    console.log('Setting toast:', '갤러리에서 이미지가 삭제되었습니다. 에디터 내의 이미지는 수동으로 삭제해주세요.', 'success');
  };

  const handleAddImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const newUrl = await uploadFile(file);
        setEditableImages(prev => [...prev, { url: newUrl }]);
      }
      setToast({ message: '갤러리에 이미지가 추가되었습니다. 에디터에 직접 이미지를 추가할 수 있습니다.', type: 'success' });
      console.log('Setting toast:', '갤러리에 이미지가 추가되었습니다. 에디터에 직접 이미지를 추가할 수 있습니다.', 'success');
    } catch (err) {
      setToast({ message: `업로드 실패: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      console.log('Setting toast:', `업로드 실패: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
    }
    event.target.value = '';
  };

  const handleReplaceImageClick = (currentUrl: string) => {
    setImageToReplace(currentUrl);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !imageToReplace) return;
    setIsUploading(true);
    try {
      const newUrl = await uploadFile(file);
      const oldUrl = imageToReplace;
      setEditableImages(prevImages => prevImages.map(img => img.url === oldUrl ? { url: newUrl } : img));
      if (selectedImage === oldUrl) {
        setSelectedImage(newUrl);
      }
      setToast({ message: '갤러리 이미지가 교체되었습니다. 에디터의 이미지는 수동으로 교체해주세요.', type: 'success' });
      console.log('Setting toast:', '갤러리 이미지가 교체되었습니다. 에디터의 이미지는 수동으로 교체해주세요.', 'success');
    } catch (err) {
      setToast({ message: `이미지 교체 실패: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      console.log('Setting toast:', `이미지 교체 실패: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
      setImageToReplace(null);
    }
    event.target.value = '';
  };

  const handleSaveChanges = async (suppressAlert = false) => {
    if (!product) return;
    setIsSaving(true);
    console.log('handleSaveChanges: Starting save operation...'); // ADDED
    try {
      const res = await fetch(`/api/sourced-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, images: editableImages, detailContent }),
      });
      console.log('handleSaveChanges: API response received. res.ok:', res.ok); // ADDED
      if (!res.ok) {
        const errorData = await res.json();
        console.error('handleSaveChanges: API error response:', errorData);
        throw new Error(errorData.message || 'Failed to save changes');
      }
      if (!suppressAlert) {
        setToast({ message: '변경사항이 성공적으로 저장되었습니다.', type: 'success' });
        console.log('Setting toast:', '변경사항이 성공적으로 저장되었습니다.', 'success');
      }
    } catch (err) {
      console.error('handleSaveChanges: Catch block error:', err);
      if (!suppressAlert) {
        setToast({ message: `변경사항 저장 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
        console.log('Setting toast:', `변경사항 저장 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
      }
      throw err; // Re-throw error to be caught by handleRegisterProduct
    } finally {
      setIsSaving(false);
      console.log('handleSaveChanges: Save operation finished. isSaving set to false.'); // ADDED
    }
  };

  const handleRegisterProduct = async () => {
    if (!product) return;

    // First, validate that required fields are filled on the frontend
    if (!product.translatedName || !product.localPrice || !detailContent) {
        setToast({ message: '상품명, 판매가, 상세 내용은 필수 입력 항목입니다.', type: 'error' });
        console.log('Setting toast:', '상품명, 판매가, 상세 내용은 필수 입력 항목입니다.', 'error');
        return;
    }

    setIsRegistering(true);
    try {
      // Step 1: Save any pending changes silently.
      await handleSaveChanges(true);

      // Step 2: Call the registration API.
      const res = await fetch('/api/admin/register-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcedProductId: product.id, categoryId: product.categoryId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to register product');
      }

      setToast({ message: '상품이 최종 등록되었습니다!', type: 'success' });
      console.log('Setting toast:', '상품이 최종 등록되었습니다!', 'success');
      router.push('/admin/products');

    } catch (err) {
      console.error('상품 등록 과정 오류:', err);
      setToast({ message: `상품 등록 과정 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
      console.log('Setting toast:', `상품 등록 과정 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoaderCircle className="animate-spin h-10 w-10" /></div>;
  if (!product) return <div className="p-6">상품을 찾을 수 없습니다.</div>;

  return (
    <div>
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-gray-100 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm shadow-md p-2 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"><ArrowLeft className="mr-2 h-4 w-4" />목록으로</button>
          <h1 className="text-lg font-semibold truncate mx-4 flex-1">
            {product.translatedName || '상품 상세 정보'}
            
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveChanges} disabled={isSaving || isRegistering || isUploading} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              <LoaderCircle className={`animate-spin mr-2 h-5 w-5 ${!isSaving && 'hidden'}`} />
              <Save className={`mr-2 h-5 w-5 ${isSaving && 'hidden'}`} />
              변경사항 저장
            </button>
            <button onClick={handleRegisterProduct} disabled={isSaving || isRegistering || isUploading || !detailContent || !product?.translatedName || !product?.localPrice || !product?.categoryId || product.stock === undefined} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              <LoaderCircle className={`animate-spin mr-2 h-5 w-5 ${!isRegistering && 'hidden'}`} />
              <UploadCloud className={`mr-2 h-5 w-5 ${isRegistering && 'hidden'}`} />
              최종 상품 등록
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Basic Info Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <label htmlFor="translatedName" className="block text-sm font-medium text-gray-700">상품명</label>
                  <input type="text" name="translatedName" id="translatedName" value={product?.translatedName || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="번역된 상품명을 입력하세요" />
                </div>
                <div>
                  <label htmlFor="localPrice" className="block text-sm font-medium text-gray-700">판매가 (원)</label>
                  <input type="number" name="localPrice" id="localPrice" value={product?.localPrice || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="판매 가격을 입력하세요" />
                </div>
                 <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">재고</label>
                  <input type="number" name="stock" id="stock" value={product?.stock || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="재고 수량을 입력하세요" />
                </div>
                <div className="lg:col-span-4">
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">카테고리</label>
                    <select id="categoryId" name="categoryId" value={product?.categoryId || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">카테고리를 선택하세요</option>
                        {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                </div>
              </div>
            </div>

            {/* Image Gallery Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">이미지 갤러리 (편집)</h2>
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[1000px] h-auto mb-4 border rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <Image src={selectedImage} alt="Main Image" width={1000} height={1000} className="w-full h-auto object-contain" priority />
                  ) : (
                    <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center text-gray-500">이미지가 없습니다.</div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {editableImages.map((image) => (
                    <div key={image.url} className="w-24 h-24 relative group">
                      <div className={`w-full h-full relative cursor-pointer border-2 rounded-md overflow-hidden ${selectedImage === image.url ? 'border-indigo-500' : 'border-transparent'}`} onClick={() => setSelectedImage(image.url)}>
                        <Image src={image.url} alt="Thumbnail" fill sizes="96px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="absolute top-0 right-0 flex flex-col gap-1 m-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownloadImage(image.url)} className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600"><Download className="h-3 w-3" /></button>
                        <button onClick={() => handleReplaceImageClick(image.url)} className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700"><Replace className="h-3 w-3" /></button>
                        <button onClick={() => handleDeleteImage(image.url)} className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                  <input type="file" ref={addFileInputRef} onChange={handleAddImageUpload} className="hidden" accept="image/*" multiple />
                  <input type="file" ref={replaceFileInputRef} onChange={handleReplaceImageUpload} className="hidden" accept="image/*" />
                  <button onClick={() => addFileInputRef.current?.click()} disabled={isUploading} className="w-24 h-24 bg-gray-100 rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200">
                    {isUploading ? <LoaderCircle className="animate-spin h-6 w-6" /> : <><PlusSquare className="h-8 w-8 mb-1" /><span className="text-xs">이미지 추가</span></>}
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
               <h2 className="text-2xl font-bold text-gray-800 mb-6">상세 내용 편집</h2>
               <NativeEditor content={detailContent} onChange={setDetailContent} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SourcedProductEditPage;
