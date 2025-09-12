// app/admin/layout.tsx
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-purple-800 text-white p-4"> {/* Changed color to dark purple */}
        <h2 className="text-2xl font-bold mb-6">관리자 메뉴</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link href="/admin" className="block py-2 px-3 rounded hover:bg-gray-700">
                대시보드
              </Link>
            </li>
            <li>
              <Link href="/admin/sourced-products" className="block py-2 px-3 rounded hover:bg-gray-700">
                가져온 상품 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/import-product" className="block py-2 px-3 rounded hover:bg-gray-700">
                상품 가져오기
              </Link>
            </li>
            <li>
              <Link href="/admin/products" className="block py-2 px-3 rounded hover:bg-gray-700">
                제품 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/product-requests" className="block py-2 px-3 rounded hover:bg-gray-700">
                상품 요청 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/orders" className="block py-2 px-3 rounded hover:bg-gray-700">
                주문 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/categories" className="block py-2 px-3 rounded hover:bg-gray-700">
                카테고리 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/reviews" className="block py-2 px-3 rounded hover:bg-gray-700">
                리뷰 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/videos" className="block py-2 px-3 rounded hover:bg-gray-700">
                비디오 관리
              </Link>
            </li>
            {/* Add more admin navigation links here */}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-gray-100 overflow-y-auto"> {/* Added overflow-y-auto */}
        {children}
      </main>
    </div>
  );
}