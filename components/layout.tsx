'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from 'next-auth/react';

interface LayoutProps {
  children: ReactNode;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  subcategories?: Category[];
}

export default function Layout({ children }: LayoutProps) {
  const { getTotalItems } = useCart();
  const [itemCount, setItemCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    setItemCount(getTotalItems());

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();

  }, [getTotalItems]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center gap-x-8">
          <h1 className="text-2xl font-bold"><Link href="/">MIGA 쇼핑몰</Link></h1>
          <nav className="flex-grow">
            <div className="flex justify-between items-center">
              {/* Left-aligned main menu */}
              <ul className="flex items-center space-x-4">
                <li><Link href="/" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">홈</Link></li>
                {categories.map(parentCategory => (
                  <li key={parentCategory.id} className="relative group">
                    <span className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors cursor-pointer">
                      {parentCategory.name}
                    </span>
                    {parentCategory.subcategories && parentCategory.subcategories.length > 0 && (
                      <ul className="absolute hidden group-hover:block bg-gray-800 text-white rounded-md shadow-lg mt-1 w-48 z-10">
                        {parentCategory.subcategories.map(subCategory => (
                          <li key={subCategory.id}>
                            <Link href={`/categories/${subCategory.id}`} className="block text-sm px-4 py-2 hover:bg-gray-700">
                              {subCategory.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              {/* Right-aligned utility menu */}
              <ul className="flex items-center space-x-4">
                <li><Link href="/my-orders" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">나의 주문</Link></li>
                <li><Link href="/my-reviews" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">내 활동 내역</Link></li>
                <li>
                  <Link href="/cart" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">
                    장바구니 ({itemCount})
                  </Link>
                </li>
                <li><Link href="/request-product" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">상품 요청</Link></li>
                {session?.user?.role === 'ADMIN' && (
                  <li><Link href="/admin" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">관리자</Link></li>
                )}
                {session?.user ? (
                  <>
                    <li><Link href="/my-account/wishlist" className="text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">위시리스트</Link></li>
                    <li>
                      <button onClick={() => signOut()} className="text-sm px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors">
                        로그아웃
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/auth/login" className="text-sm px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors">
                        로그인
                      </Link>
                    </li>
                    <li>
                      <Link href="/auth/register" className="text-sm px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors">
                        회원가입
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </nav>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-grow container mx-auto p-8">
        {children}
      </main>
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center shadow-inner">
        <div className="container mx-auto">
          <p>&copy; {new Date().getFullYear()} MIGA 쇼핑몰. 모든 권리 보유.</p>
        </div>
      </footer>
    </div>
  );
}