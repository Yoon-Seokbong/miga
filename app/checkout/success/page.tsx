'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react'; // Import useRef
import { useCart } from '@/context/CartContext';

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const hasClearedCart = useRef(false); // Ref to track if cart has been cleared

  useEffect(() => {
    if (!hasClearedCart.current) { // Only clear cart once
      clearCart(); // Clear cart after successful checkout
      hasClearedCart.current = true;
    }
  }, [clearCart]); // clearCart is still a dependency, but the ref prevents infinite loop

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">결제 완료!</h1>
        <p className="text-gray-700 mb-6">주문이 성공적으로 처리되었습니다. 감사합니다!</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition duration-300">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
