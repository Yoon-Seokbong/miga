'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // Import useSession

interface Category {
  id: string;
  name: string;
  subcategories: Category[];
}

const NewProductPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [brand, setBrand] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [detailImages, setDetailImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession(); // Get session data and status

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const detailImageInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('Debugging session in NewProductPage:', session);
    console.log('Session user ID:', session?.user?.id);
    console.log('Session status:', sessionStatus);

    if (sessionStatus === 'loading') {
      setError('세션 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
      return;
    }

    if (!session?.user?.id) {
      setError('로그인이 필요하거나 세션이 유효하지 않습니다.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('brand', brand);
    formData.append('tags', tags);
    formData.append('categoryId', categoryId);
    images.forEach(file => formData.append('images', file));
    detailImages.forEach(file => formData.append('detailImages', file));
    videos.forEach(file => formData.append('videos', file));

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryOptions = (categories: Category[] | undefined | null, level = 0): JSX.Element[] => {
    if (!categories || categories.length === 0) {
      return [];
    }
    return categories.flatMap(category => [
      <option key={category.id} value={category.id}>
        {`${'—'.repeat(level)} ${category.name}`}
      </option>,
      ...(category.subcategories && category.subcategories.length > 0
        ? renderCategoryOptions(category.subcategories, level + 1)
        : [])
    ]);
  };
  
  const formInputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      setter(Array.from(e.target.files));
    }
  };

  const getFileNameDisplay = (files: File[]) => {
    if (files.length === 0) return '선택된 파일 없음';
    if (files.length === 1) return files[0].name;
    return `${files.length}개 파일 선택됨`;
  };

  if (sessionStatus === 'loading') {
    return <div className="container mx-auto p-4 text-center">세션 로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">새 상품 추가</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">상품명</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputStyle} />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={formInputStyle}></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">가격 (원)</label>
            <input type="text" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required className={formInputStyle} />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">재고</label>
            <input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" className={formInputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">브랜드</label>
            <input type="text" id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={formInputStyle} />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">태그 (쉼표로 구분)</label>
            <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className={formInputStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">카테고리</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={formInputStyle}>
            <option value="">카테고리 선택</option>
            {renderCategoryOptions(categories)}
          </select>
        </div>
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700">메인 이미지 (다중 선택 가능)</label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="file"
              id="images"
              multiple
              onChange={(e) => handleFileChange(e, setImages)}
              className="hidden"
              ref={mainImageInputRef}
              accept="image/*"
            />
            <label htmlFor="images" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              파일 선택
            </label>
            <span className="text-gray-500 flex-grow truncate">{getFileNameDisplay(images)}</span>
          </div>
        </div>
        {/* Detail Images Custom File Input */}
        <div>
          <label htmlFor="detailImages" className="block text-sm font-medium text-gray-700">상세 이미지 (다중 선택 가능, 순서대로 표시)</label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="file"
              id="detailImages"
              multiple
              onChange={(e) => handleFileChange(e, setDetailImages)}
              className="hidden"
              ref={detailImageInputRef}
              accept="image/*"
            />
            <label htmlFor="detailImages" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              파일 선택
            </label>
            <span className="text-gray-500 flex-grow truncate">{getFileNameDisplay(detailImages)}</span>
          </div>
        </div>
         {/* Video File Custom File Input */}
         <div>
          <label htmlFor="videos" className="block text-sm font-medium text-gray-700">비디오 파일 (다중 선택 가능)</label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="file"
              id="videos"
              multiple
              onChange={(e) => handleFileChange(e, setVideos)}
              className="hidden"
              ref={videoFileInputRef}
              accept="video/*"
            />
            <label htmlFor="videos" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              파일 선택
            </label>
            <span className="text-gray-500 flex-grow truncate">{getFileNameDisplay(videos)}</span>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {isLoading ? '상품 등록 중...' : '상품 등록'}
        </button>
      </form>
    </div>
  );
};

export default NewProductPage;