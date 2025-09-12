'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react'; // Import useState, useEffect
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from 'next-auth/react'; // Import useSession and signOut

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { getTotalItems } = useCart();
  const [itemCount, setItemCount] = useState(0); // State for cart item count
  const { data: session } = useSession(); // Get session data

  useEffect(() => {
    setItemCount(getTotalItems()); // Update item count on client side
  }, [getTotalItems]); // Re-run when getTotalItems changes

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold"><Link href="/">MIGA 쇼핑몰</Link></h1>
          <nav>
            <ul className="flex space-x-4">
              <li><Link href="/" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">홈</Link></li>
              <li><Link href="/categories" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">카테고리</Link></li>
              <li><Link href="/my-orders" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">나의 주문</Link></li>
              <li><Link href="/my-reviews" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">내 활동 내역</Link></li>
              <li>
                <Link
                  href="/cart"
                  className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">
                  장바구니 ({itemCount}) {/* Display item count */}
                </Link>
              </li>
              <li><Link href="/request-product" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">상품 요청</Link></li>
              <li><Link href="/admin" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">관리자</Link></li> {/* New Admin link */}
              {session?.user ? ( // If session exists (user is logged in)
                <>
                  <li><Link href="/my-account/wishlist" className="px-3 py-1 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">위시리스트</Link></li>
                  <li>
                    <button
                      onClick={() => signOut()}
                      className="px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors"
                    >
                      로그아웃
                    </button>
                  </li>
                </>
              ) : ( // If no session (user is logged out or loading)
                <>
                  <li>
                    <Link href="/auth/login" className="px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors">
                      로그인
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/register" className="px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors">
                      회원가입
                    </Link>
                  </li>
                </>
              )}
            </ul>
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
