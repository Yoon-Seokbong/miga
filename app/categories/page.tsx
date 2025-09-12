'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message || '카테고리를 불러오는 데 실패했습니다.');
        } else {
            setError('카테고리를 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return <div className="text-center text-xl mt-8">카테고리를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center text-xl mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">카테고리 목록</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link
              key={category.id}
              href={`/?categoryId=${category.id}`}
              className="block p-6 bg-card rounded-lg shadow-lg hover:bg-gray-400 transition duration-300">
              <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">생성된 카테고리가 없습니다.</p>
        )}
      </div>
    </div>
  );
}