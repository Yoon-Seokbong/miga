'use client';

import { useState } from 'react';

export default function RequestProductPage() {
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [description, setDescription] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('productUrl', productUrl);
    formData.append('description', description);
    formData.append('requesterEmail', requesterEmail);
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      const res = await fetch('/api/product-requests', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setProductName('');
        setProductUrl('');
        setDescription('');
        setRequesterEmail('');
        setSelectedFile(null);
      } else {
        setError(data.message || '상품 요청 제출에 실패했습니다.');
      }
    } catch (err) {
      console.error('Client-side product request error:', err);
      setError('예상치 못한 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">상품 요청하기</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700">상품명 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="productName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700">상품 URL (선택 사항)</label>
            <input
              type="url"
              id="productUrl"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명 (선택 사항)</label>
            <textarea
              id="description"
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">상품 이미지 (선택 사항)</label>
            <input
              type="file"
              id="image"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
              accept="image/*"
            />
            {selectedFile && <p className="mt-2 text-sm text-gray-500">선택된 파일: {selectedFile.name}</p>}
          </div>
          <div>
            <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700">요청자 이메일 (선택 사항)</label>
            <input
              type="email"
              id="requesterEmail"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            요청 제출
          </button>
        </form>
        {message && <p className="mt-4 text-center text-green-500 text-sm">성공: {message}</p>}
        {error && <p className="mt-4 text-center text-red-500 text-sm">오류: {error}</p>}
      </div>
    </div>
  );
}
