'use client';

import React, { useState, useEffect } from 'react';
import ToastNotification from '@/components/ToastNotification';
import { LoaderCircle, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Updated Category interface
interface Category {
  id: string;
  name: string;
  parentId: string | null;
  subcategories?: Category[];
}

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState<Category[]>([]); // Will hold parent categories
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState(''); // For the 'Add' form dropdown
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Set default parent category for the 'Add' form when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !newCategoryParentId) {
      setNewCategoryParentId(categories[0].id);
    }
  }, [categories, newCategoryParentId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setToast({ message: `카테고리 불러오기 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryParentId) {
      setToast({ message: '카테고리 이름과 상위 카테고리를 모두 입력/선택해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, parentId: newCategoryParentId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add category');
      }
      setToast({ message: '카테고리가 성공적으로 추가되었습니다.', type: 'success' });
      setNewCategoryName('');
      fetchCategories(); // Refresh list
    } catch (err) {
      setToast({ message: `카테고리 추가 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      setToast({ message: '카테고리 이름을 입력해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: editingCategory.name,
            parentId: editingCategory.parentId // Also send parentId
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      setToast({ message: '카테고리가 성공적으로 업데이트되었습니다.', type: 'success' });
      setEditingCategory(null);
      fetchCategories(); // Refresh list
    } catch (err) {
      setToast({ message: `카테고리 업데이트 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까? 이 카테고리에 속한 상품들은 카테고리 연결이 해제됩니다.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      setToast({ message: '카테고리가 성공적으로 삭제되었습니다.', type: 'success' });
      fetchCategories(); // Refresh list
    } catch (err) {
      setToast({ message: `카테고리 삭제 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="text-2xl font-bold mb-6">카테고리 관리</h1>

      {/* Add New Category Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">새 하위 카테고리 추가</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <select
            value={newCategoryParentId}
            onChange={(e) => setNewCategoryParentId(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="" disabled>상위 카테고리 선택</option>
            {categories.map(parent => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="새 하위 카테고리 이름"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <LoaderCircle className="animate-spin mr-2" size={20} /> : <PlusCircle className="mr-2" size={20} />}
            추가
          </button>
        </div>
      </div>

      {/* Category Lists by Parent */}
      {loading ? (
        <div className="flex justify-center items-center h-32"><LoaderCircle className="animate-spin h-8 w-8 text-indigo-600" /></div>
      ) : (
        categories.map(parentCategory => (
          <div key={parentCategory.id} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">{parentCategory.name}</h2>
            {parentCategory.subcategories && parentCategory.subcategories.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parentCategory.subcategories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600">등록된 하위 카테고리가 없습니다.</p>
            )}
          </div>
        ))
      )}

      {/* Edit Category Modal/Form */}
      {editingCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">카테고리 편집</h2>
            <div className="space-y-4">
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                    value={editingCategory.parentId || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="" disabled>상위 카테고리 선택</option>
                    {categories.map(parent => (
                        <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleEditCategory}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? <LoaderCircle className="animate-spin" size={20} /> : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;