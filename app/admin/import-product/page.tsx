'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScrapedData {
  [key: string]: unknown;
}

export default function ImportProductPage() {
  const [productUrl, setProductUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);

  const router = useRouter();

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);
    setScrapedData(null);

    try {
      // A single call to our backend API that handles scraping and importing.
      const res = await fetch('/api/run-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productUrl }),
      });

      if (!res.ok) {
        // Try to parse a meaningful error message from the server's JSON response
        let errorMessage = `An error occurred: ${res.statusText}`;
        try {
          const errData = await res.json();
          errorMessage = errData.message || errData.details || errorMessage;
        } catch (e) {
          // Ignore if the response body is not JSON
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      
      // Optional: show the final, imported product data for preview
      setScrapedData(result.sourcedProduct);

      alert("상품을 성공적으로 가져왔습니다! '가져온 상품 관리' 페이지로 이동합니다.");
      router.push('/admin/sourced-products');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">해외 상품 가져오기</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="space-y-4">
          <div>
            <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700">상품 URL</label>
            <input
              type="url"
              id="productUrl"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://detail.1688.com/offer/..."
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleScrape}
            disabled={isLoading || !productUrl}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? '가져오는 중...' : '상품 정보 가져오기'}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p className="font-bold">오류 발생:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {scrapedData && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold">성공적으로 가져온 데이터 (미리보기):</h3>
              <pre className="text-xs overflow-x-auto max-h-64 overflow-y-auto bg-white p-2 rounded-md">{JSON.stringify(scrapedData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}