import React from 'react';
import { PrismaClient } from '@prisma/client';
import Image from 'next/image';
import OrderStatusUpdater from './OrderStatusUpdater'; // We will create this component next

const prisma = new PrismaClient();

async function getOrderDetails(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      lineItems: {
        include: {
          product: {
            include: {
              images: { take: 1 },
            },
          },
        },
      },
    },
  });
  return order;
}

const AdminOrderDetailPage = async ({ params }: { params: { id: string } }) => {
  const order = await getOrderDetails(params.id);

  if (!order) {
    return <div className="container mx-auto p-8 text-center">Order not found.</div>;
  }

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
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">주문 상세 정보</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">주문 상품</h2>
          <div className="space-y-4">
            {order.lineItems.map(item => (
              <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                <div className="w-20 h-20 relative flex-shrink-0">
                  <Image 
                    src={item.product.images[0]?.url || '/placeholder.png'} 
                    alt={item.product.name} 
                    fill 
                    className="object-cover rounded-md"
                  />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-sm text-gray-600">{new Intl.NumberFormat('ko-KR').format(item.price)}원 x {item.quantity}</p>
                </div>
                <p className="font-semibold">{new Intl.NumberFormat('ko-KR').format(item.price * item.quantity)}원</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">주문 요약</h2>
            <div className="space-y-2">
              <p><strong>주문 ID:</strong> {order.tossOrderId || order.id}</p>
              <p><strong>주문일:</strong> {new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>총 결제 금액:</strong> <span className="font-bold text-lg">{new Intl.NumberFormat('ko-KR').format(order.total)}원</span></p>
              <div className="flex items-center">
                <p className="mr-2"><strong>상태:</strong></p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">고객 정보</h2>
            <p><strong>이름:</strong> {order.user.name || 'N/A'}</p>
            <p><strong>이메일:</strong> {order.user.email}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">주문 상태 변경</h2>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
