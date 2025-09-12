'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/Button';
import { User, MapPin } from 'lucide-react';

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  images: ProductImage[];
}

interface OrderLineItem {
  id: string;
  quantity: number;
  price: number;
  product: Product;
}

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  lineItems: OrderLineItem[];
}

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(10); // Orders per page

  useEffect(() => {
    if (status === 'authenticated') {
      async function fetchOrders() {
        setLoading(true);
        try {
          const res = await fetch(`/api/orders?page=${currentPage}&limit=${limit}`);
          if (!res.ok) {
            throw new Error('Failed to fetch orders');
          }
          const data = await res.json();
          setOrders(data.orders);
          setTotalOrders(data.totalOrders);
        } catch (err) {
          console.error('Error fetching orders:', err);
          if (err instanceof Error) {
            setError(err.message || '주문 내역을 불러오는 데 실패했습니다.');
          } else {
            setError('주문 내역을 불러오는 데 실패했습니다.');
          }
        } finally {
          setLoading(false);
        }
      }
      fetchOrders();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      // No need to set an error, the component will render a login prompt
    }
  }, [status, currentPage, limit]);

  const totalPages = Math.ceil(totalOrders / limit);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (status === 'loading') {
    return <div className="text-center text-xl mt-8">주문 내역을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center text-xl mt-8 text-red-500">{error}</div>;
  }

  if (!session?.user) {
    return (
      <div className="text-center text-xl mt-8">
        <p>주문 내역을 보려면 로그인해야 합니다.</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline">로그인</Link>
      </div>
    );
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('정말로 이 주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'CANCELLED' } : order
          )
        );
        alert('주문이 성공적으로 취소되었습니다.');
      } else {
        const data = await res.json();
        alert(`주문 취소 실패: ${data.message || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      alert('주문 취소 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">나의 주문 내역</h1>

      <div className="text-center mb-8 flex justify-center space-x-4">
        <Link href="/my-account/profile" >
          <Button className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 inline-flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>개인 정보 수정</span>
          </Button>
        </Link>
        <Link href="/my-account/addresses" >
          <Button className="bg-purple-500 text-white px-6 py-3 rounded-md hover:bg-purple-600 inline-flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>주소록 관리</span>
          </Button>
        </Link>
      </div>

      {orders.length === 0 && !loading ? (
        <div className="text-center text-gray-600">
          <p>아직 주문 내역이 없습니다.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            상품 둘러보기
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <div>
                    <h2 className="text-xl font-semibold">주문 번호: {order.id}</h2>
                    <p className="text-gray-600">주문일: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-blue-600">상태: {order.status}</span>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                      >
                        주문 취소
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {order.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold">{item.product.name}</h3>
                        <p className="text-gray-600">수량: {item.quantity}</p>
                        <p className="text-gray-900 font-bold">
                          {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                  <p className="text-xl font-bold">총 결제 금액: {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(order.total)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center mt-8">
            <Button onClick={handlePrevPage} disabled={currentPage === 1}>이전</Button>
            <span className="mx-4">{currentPage} / {totalPages}</span>
            <Button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>다음</Button>
          </div>
        </>
      )}
    </div>
  );
}