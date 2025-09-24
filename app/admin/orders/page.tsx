'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Define the Order type based on your Prisma schema
interface Order {
  id: string;
  tossOrderId: string | null;
  total: number;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // This new API route will need to be created
        const res = await fetch('/api/orders'); 
        if (!res.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('정말로 이 주문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '주문 삭제에 실패했습니다.');
      }
      // Update the state to remove the deleted order
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      alert('주문이 성공적으로 삭제되었습니다.');
    } catch (err) {
      alert(`삭제 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <p>주문 목록을 불러오는 중...</p>;
  if (error) return <p className="text-red-500">오류: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">주문 관리</h1>
      {orders.length === 0 ? (
        <p>주문 내역이 없습니다.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문 ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.tossOrderId || order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.user.name || order.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Intl.NumberFormat('ko-KR').format(order.total)}원</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <Link href={`/admin/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">상세보기</Link>
                    <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
