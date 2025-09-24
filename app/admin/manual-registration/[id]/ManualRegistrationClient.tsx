'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Download } from 'lucide-react';

// Define a matching interface for the serialized product data
interface SerializableSourcedProduct {
  id: string;
  sourceUrl: string;
  translatedName: string | null;
  localPrice: number | null;
  status: string;
  createdAt: string;
  images: { url: string }[];
  videos: { url: string }[];
  detailContent: string | null;
}

interface ManualRegistrationClientProps {
  product: SerializableSourcedProduct;
}

const ManualRegistrationClient = ({ product }: ManualRegistrationClientProps) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string | null, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [field]: false }));
      }, 2000);
    });
  };

  const InfoField = ({ label, value, fieldName }: { label: string; value: string | number | null; fieldName: string }) => (
    <div className="grid grid-cols-3 gap-4 items-center">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 col-span-2 bg-gray-50 p-2 rounded-md flex justify-between items-center">
        <span>{value ?? 'N/A'}</span>
        <button onClick={() => handleCopy(value?.toString() ?? null, fieldName)} className="text-gray-500 hover:text-gray-800">
          {copiedStates[fieldName] ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </dd>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
        <dl className="space-y-4">
          <InfoField label="상품명" value={product.translatedName} fieldName="name" />
          <InfoField label="판매가" value={product.localPrice} fieldName="price" />
          <InfoField label="재고" value={100} fieldName="stock" />
        </dl>
      </div>

      {/* HTML Detail Content Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">상세설명 HTML</h2>
          <button 
            onClick={() => handleCopy(product.detailContent, 'html')} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {copiedStates['html'] ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />} 
            HTML 전체 복사
          </button>
        </div>
        <textarea 
          readOnly 
          value={product.detailContent || '상세설명 내용이 없습니다.'}
          className="w-full h-96 p-2 border border-gray-300 rounded-md font-mono text-xs bg-gray-50"
        />
      </div>

      {/* Image Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">이미지 목록</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {product.images && product.images.map((image, index) => (
            <div key={index} className="relative group border rounded-lg overflow-hidden">
              <Image 
                src={image.url} 
                alt={`Product Image ${index + 1}`}
                width={200}
                height={200}
                className="w-full h-full object-cover aspect-square"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={image.url} 
                  download 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center p-2 rounded-full text-white bg-gray-800 hover:bg-black"
                >
                  <Download className="h-6 w-6" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ManualRegistrationClient;
