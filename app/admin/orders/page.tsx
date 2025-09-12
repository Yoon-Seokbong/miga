import React from 'react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return orders;
}

const AdminOrdersPage = async () => {
  const orders = await getOrders();

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
                <th className="relative px-6 py-3"><span className="sr-only">상세보기</span></th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">상세보기</Link>
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