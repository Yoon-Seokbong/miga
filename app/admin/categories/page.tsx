'use client';

import React, { useState, useEffect, FormEvent } from 'react';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  subcategories: Category[];
}

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For creating/editing
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    const apiEndpoint = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, parentId: parentCategoryId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409 && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error(errorData.message || `Failed to ${method === 'POST' ? 'create' : 'update'} category`);
        }
      }

      // Reset form and refetch categories
      setEditingCategory(null);
      setCategoryName('');
      setParentCategoryId(null);
      await fetchCategories();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setParentCategoryId(category.parentId);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까? 하위 카테고리와 연관된 상품들도 영향을 받을 수 있습니다.')) return;

    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      await fetchCategories(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const renderCategory = (category: Category, level = 0) => (
    <div key={category.id} style={{ marginLeft: `${level * 20}px` }} className="p-2 border-b border-gray-200 flex justify-between items-center">
      <span>{category.name}</span>
      <div className="space-x-2">
        <button onClick={() => handleEdit(category)} className="text-sm text-blue-600 hover:underline">수정</button>
        <button onClick={() => handleDelete(category.id)} className="text-sm text-red-600 hover:underline">삭제</button>
      </div>
    </div>
  );

  const renderCategories = (categories: Category[], level = 0) => {
    return categories.map(category => (
      <React.Fragment key={category.id}>
        {renderCategory(category, level)}
        {category.subcategories && category.subcategories.length > 0 && renderCategories(category.subcategories, level + 1)}
      </React.Fragment>
    ));
  };

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">카테고리 관리</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">카테고리 목록</h2>
          <div className="border rounded-md">
            {categories.length > 0 ? renderCategories(categories) : <p className="p-4 text-gray-500">카테고리가 없습니다.</p>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-semibold mb-4">{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">카테고리 이름</label>
              <input 
                type="text" 
                id="categoryName" 
                value={categoryName} 
                onChange={(e) => setCategoryName(e.target.value)} 
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {/* Optional: Parent Category Selection - can be added later */}
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {editingCategory ? '업데이트' : '추가'}
            </button>
            {editingCategory && (
              <button type="button" onClick={() => { setEditingCategory(null); setCategoryName(''); setParentCategoryId(null); }} className="w-full mt-2 px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400">
                취소
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;