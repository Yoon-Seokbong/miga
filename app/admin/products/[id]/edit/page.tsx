'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import NativeEditor from '@/components/NativeEditor'; // Import the editor

// Interfaces
interface Category {
  id: string;
  name: string;
  subcategories: Category[];
}

interface ProductImage {
  id: string;
  url: string;
}

interface ProductVideo {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  brand: string | null;
  tags: string | null;
  categoryId: string;
  images: ProductImage[];
  detailImages: ProductImage[];
  videos: ProductVideo[];
  detailContent?: string | null; // Add detailContent to interface
}

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [brand, setBrand] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [detailContent, setDetailContent] = useState(''); // Add state for editor
  
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newDetailImages, setNewDetailImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [detailImagesToDelete, setDetailImagesToDelete] = useState<string[]>([]);
  const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

  const newImagesInputRef = useRef<HTMLInputElement>(null);
  const newDetailImagesInputRef = useRef<HTMLInputElement>(null);
  const newVideosInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProductAndCategories = async () => {
      setIsLoading(true);
      try {
        const productRes = await fetch(`/api/products/${id}`);
        if (!productRes.ok) throw new Error('Failed to fetch product details');
        const productData: Product = await productRes.json();
        setProduct(productData);
        setName(productData.name);
        setDescription(productData.description || '');
        setPrice(String(productData.price));
        setStock(String(productData.stock));
        setBrand(productData.brand || '');
        setTags(productData.tags || '');
        setCategoryId(productData.categoryId);
        setDetailContent(productData.detailContent || ''); // Set editor content

        const catRes = await fetch('/api/categories');
        if (!catRes.ok) throw new Error('Failed to fetch categories');
        const catData: Category[] = await catRes.json();
        setCategories(catData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [id]);

  const handleImageDelete = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setProduct(p => p ? { ...p, images: p.images.filter(img => img.id !== imageId) } : null);
  };

  const handleDetailImageDelete = (imageId: string) => {
    setDetailImagesToDelete(prev => [...prev, imageId]);
    setProduct(p => p ? { ...p, detailImages: p.detailImages.filter(img => img.id !== imageId) } : null);
  };
  
  const handleVideoDelete = (videoId: string) => {
    setVideosToDelete(prev => [...prev, videoId]);
    setProduct(p => p ? { ...p, videos: p.videos.filter(vid => vid.id !== videoId) } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('brand', brand);
    formData.append('tags', tags);
    formData.append('categoryId', categoryId);
    formData.append('detailContent', detailContent); // Add editor content to form data
    
    newImages.forEach(file => formData.append('newImages', file));
    newDetailImages.forEach(file => formData.append('newDetailImages', file));
    newVideos.forEach(file => formData.append('newVideos', file));

    formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    formData.append('detailImagesToDelete', JSON.stringify(detailImagesToDelete));
    formData.append('videosToDelete', JSON.stringify(videosToDelete));

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const getFileNameDisplay = (files: File[]) => {
    if (files.length === 0) return '선택된 파일 없음';
    if (files.length === 1) return files[0].name;
    return `${files.length}개 파일 선택됨`;
  };

  const formInputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  if (isLoading) return <div className="text-center p-8">Loading product...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!product) return <div className="text-center p-8">Product not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">상품 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-md">
        {/* ... other form fields ... */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">상품명</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputStyle} />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">요약 설명</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={formInputStyle}></textarea>
        </div>

        {/* Editor for Detail Content */}
        <div>
          <label htmlFor="detailContent" className="block text-sm font-medium text-gray-700">상세 내용 (AI 생성)</label>
          <div className="mt-1">
            <NativeEditor content={detailContent} onChange={setDetailContent} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">가격 (원)</label>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required className={formInputStyle} />
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
            {categories.map(parentCategory => (
                <optgroup key={parentCategory.id} label={parentCategory.name}>
                    {parentCategory.subcategories?.map(subCategory => (
                        <option key={subCategory.id} value={subCategory.id}>
                            {subCategory.name}
                        </option>
                    ))}
                </optgroup>
            ))}
          </select>
        </div>
        {/* ... image and video upload sections ... */}
        
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        <button type="submit" disabled={isUpdating} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {isUpdating ? '상품 업데이트 중...' : '상품 정보 저장'}
        </button>
      </form>
    </div>
  );
};

export default EditProductPage;
