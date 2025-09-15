'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, UploadCloud } from 'lucide-react';

const ManualImportPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleUploadImages = async () => {
    if (images.length === 0) {
      alert('이미지를 먼저 선택해주세요.');
      return;
    }
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);
        const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || '이미지 업로드 실패');
        uploadedUrls.push(result.url);
      }
      setUploadedImageUrls(uploadedUrls);
      alert(`${uploadedUrls.length}개의 이미지가 성공적으로 업로드되었습니다.`);
    } catch (err) {
      alert(`이미지 업로드 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert('상품명과 판매가는 필수 입력 항목입니다.');
      return;
    }
    if (uploadedImageUrls.length === 0) {
      alert('이미지를 업로드해야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // This API endpoint does not exist yet. We will create it next.
      const res = await fetch('/api/admin/create-sourced-product-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          description,
          imageUrls: uploadedImageUrls,
        }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).message || '수동 상품 소싱에 실패했습니다.');
      }

      alert('상품이 소싱 목록에 성공적으로 추가되었습니다! 이제 AI 상세페이지를 생성할 수 있습니다.');
      router.push('/admin/sourced-products'); // Redirect to the sourced products list

    } catch (err) {
      alert(`오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">새 상품 직접 등록</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">상품명</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">판매가 (원)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">상품 설명 (선택 사항)</label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">상품 이미지</label>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            />
            <button type="button" onClick={handleUploadImages} disabled={isUploading || images.length === 0} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50">
              <LoaderCircle className={`animate-spin mr-2 h-5 w-5 ${!isUploading && 'hidden'}`} />
              {isUploading ? '업로드 중...' : '이미지 업로드'}
            </button>
          </div>
          {uploadedImageUrls.length > 0 && (
            <div className="mt-4 text-sm text-green-600">
              <p>{uploadedImageUrls.length}개의 이미지가 업로드되었습니다. 폼을 제출하여 상품을 등록하세요.</p>
            </div>
          )}
        </div>

        <div className="text-right">
          <button type="submit" disabled={isSubmitting || uploadedImageUrls.length === 0} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            <LoaderCircle className={`animate-spin mr-2 h-5 w-5 ${!isSubmitting && 'hidden'}`} />
            <UploadCloud className={`mr-2 h-5 w-5 ${isSubmitting && 'hidden'}`} />
            AI 상세페이지 생성 준비
          </button>
        </div>

      </form>
    </div>
  );
};

export default ManualImportPage;
