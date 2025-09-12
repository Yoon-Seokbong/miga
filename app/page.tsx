'use client';

import { useState, useEffect, Suspense } from 'react'; // Import Suspense
import Image from 'next/image'; // Import Image

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import WishlistButton from '@/components/WishlistButton'; // Import WishlistButton

const PAGE_SIZE = 12;

interface CategoryNode {
  id: string;
  name: string;
  subcategories: CategoryNode[];
  parentId: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string }[];
}

// Recursive CategoryTree component
const CategoryTree = ({ categories, handleCategoryClick, currentCategoryId }: {
  categories: CategoryNode[];
  handleCategoryClick: (id: string | null) => void;
  currentCategoryId: string | null;
}) => {
  return (
    <ul className="space-y-1">
      {categories.map((category) => (
        <li key={category.id}>
          <Button
            onClick={() => handleCategoryClick(category.id)}
            variant={currentCategoryId === category.id ? 'primary' : 'outline'}
            size="sm"
            className="w-full justify-start"
          >
            {category.name}
          </Button>
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="ml-4 mt-1">
              <CategoryTree
                categories={category.subcategories}
                handleCategoryClick={handleCategoryClick}
                currentCategoryId={currentCategoryId}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

function HomeContent() { // New component to encapsulate useSearchParams
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // States for input fields
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || ''); // New
  const [tags, setTags] = useState(searchParams.get('tags') || ''); // New

  const categoryId = searchParams.get('categoryId');
  const sortBy = searchParams.get('sortBy') || 'latest';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useSession();

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  const getValidImageUrl = (url: string | undefined | null) => {
    if (!url || url.startsWith('/placeholder-product-')) {
      // Use a local placeholder if URL is null, undefined, or a known invalid placeholder
      return '/placeholder.png'; // Use a local placeholder image
    }
    return url;
  };

  const handleUrlUpdate = (newParams: Record<string, string>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    for (const key in newParams) {
      if (newParams[key]) {
        currentParams.set(key, newParams[key]);
      } else {
        currentParams.delete(key);
      }
    }
    currentParams.set('page', '1'); // Reset to first page on any filter change
    router.push(`/?${currentParams.toString()}`);
  };

  const handleSearch = () => {
    handleUrlUpdate({
      search: searchTerm,
      minPrice: minPrice,
      maxPrice: maxPrice,
      brand: brand, // New
      tags: tags,   // New
    });
  };
  
  const handleCategoryClick = (id: string | null) => {
    handleUrlUpdate({ categoryId: id || '' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleUrlUpdate({ sortBy: e.target.value });
  };

  const handlePageChange = (page: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('page', page.toString());
    router.push(`/?${currentParams.toString()}`);
  };

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        // The source of truth for fetching is the URL search params
        const params = new URLSearchParams(searchParams.toString());
        
        // Ensure default sorting is applied if not in URL
        if (!params.has('sortBy')) {
            params.set('sortBy', 'latest');
        }
        
        // Set page size
        params.set('pageSize', PAGE_SIZE.toString());

        const query = params.toString();
        const res = await fetch(`/api/products${query ? `?${query}` : ''}`);

        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        setProducts(data.products);
        setTotalProducts(data.totalCount);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || '상품 목록을 불러오는 데 실패했습니다.');
        } else {
          setError('상품 목록을 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]); // Depend only on searchParams

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        if (err instanceof Error) {
          setError(err.message || '카테고리 목록을 불러오는 데 실패했습니다.');
        } else {
          setError('카테고리 목록을 불러오는 데 실패했습니다.');
        }
      }
    }
    fetchCategories();
  }, []);

  if (loading) return <main className="flex-grow container mx-auto p-8 text-center text-xl mt-8">상품 목록을 불러오는 중...</main>;
  if (error) return <main className="flex-grow container mx-auto p-8 text-center text-xl mt-8 text-red-500">{error}</main>;

  return (
    <main className="flex-grow container mx-auto p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">상품 목록</h2>
      {/* Category Filter */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 shadow">
        <h3 className="text-lg font-semibold mb-4">카테고리</h3>
        <Button onClick={() => handleCategoryClick(null)} variant={!categoryId ? 'primary' : 'outline'} size="md" className="w-full justify-start mb-2">모든 상품</Button>
        <CategoryTree
          categories={categories}
          handleCategoryClick={handleCategoryClick}
          currentCategoryId={categoryId}
        />
      </div>
      {/* Search, Price Filter, and Sort */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 shadow">
        <input type="text" placeholder="상품 검색..." className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-black dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <input type="number" placeholder="최소 가격" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-black dark:text-white" />
        <span className="text-gray-500 dark:text-gray-400">-</span>
        <input type="number" placeholder="최대 가격" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-black dark:text-white" />
        <input type="text" placeholder="브랜드 검색..." className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-black dark:text-white" value={brand} onChange={e => setBrand(e.target.value)} />
        <input type="text" placeholder="태그 검색 (쉼표로 구분)..." className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-black dark:text-white" value={tags} onChange={e => setTags(e.target.value)} />
        <select value={sortBy} onChange={handleSortChange} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-black dark:text-white">
          <option value="latest">최신순</option>
          <option value="price-asc">낮은 가격순</option>
          <option value="price-desc">높은 가격순</option>
        </select>
        <Button onClick={handleSearch}>필터 적용</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400"><p>해당 조건의 상품이 없습니다.</p></div>
        ) : (
          products.map(product => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 group">
                <div className="relative w-full h-48">
                  <Image
                    src={getValidImageUrl(product.images && product.images[0]?.url)}
                    alt={product.name}
                    width={192} // Set explicit width for img tag
                    height={192} // Set explicit height for img tag
                    className="object-cover object-center w-full h-full"
                  />
                  <WishlistButton productId={product.id} className="absolute top-2 right-2 z-10" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-purple-600">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-white font-bold text-lg">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(product.price)}</span>
                    <Button onClick={e => { e.preventDefault(); addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: (product.images && product.images.length > 0 ? product.images[0].url : undefined) }); }} size="sm">장바구니에 추가</Button>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline">이전</Button>
          {[...Array(totalPages)].map((_, index) => (
            <Button key={index + 1} onClick={() => handlePageChange(index + 1)} variant={currentPage === index + 1 ? 'primary' : 'outline'}>
              {index + 1}
            </Button>
          ))}
          <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline">다음</Button>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <HomeContent />
    </Suspense>
  );
}