// app/admin/page.tsx
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>
      <p className="mb-4">관리자 페이지에 오신 것을 환영합니다.</p>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/sourced-products" className="text-blue-600 hover:underline">
              가져온 상품 관리
            </Link>
          </li>
          {/* Add more admin links here as needed */}
        </ul>
      </nav>
    </div>
  );
}