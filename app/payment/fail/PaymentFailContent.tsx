'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An unknown error occurred.';
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      // Notify the backend that the payment for this order failed/was canceled.
      // This helps prevent orders from being stuck in a 'PENDING' state.
      fetch('/api/payment/fail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      }).catch(err => console.error("Failed to notify backend of payment failure:", err));
    }
  }, [orderId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600">결제 실패</h1>
        <p className="text-gray-700">결제가 취소되었거나 오류가 발생했습니다.</p>
        <div className="p-4 text-left bg-red-50 rounded-md">
          <p className="font-semibold">오류 메시지:</p>
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
        {orderId && (
          <p className="text-sm text-gray-500">주문 번호: {orderId}</p>
        )}
        <button
          onClick={() => router.push('/cart')}
          className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          장바구니로 돌아가기
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full px-4 py-2 mt-2 font-bold text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-400"
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
}