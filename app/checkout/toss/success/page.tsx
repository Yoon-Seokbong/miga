'use client'; // Ensure this is a client component

import { useEffect, useState, Suspense } from 'react'; // Import useState, Suspense
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext'; // Assuming CartContext is correctly imported

export default function TossPaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading payment success details...</div>}>
      <TossPaymentSuccessContent />
    </Suspense>
  );
}

function TossPaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const paymentKey = searchParams.get('paymentKey');
  const tossOrderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [hasConfirmed, setHasConfirmed] = useState(false); // New state to track confirmation

  useEffect(() => {
    // Only proceed if not already confirmed and all necessary params are present
    if (!hasConfirmed && paymentKey && tossOrderId && amount) {
      const confirmPayment = async () => {
        try {
          const response = await fetch('/api/checkout/toss/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentKey,
              orderId: tossOrderId,
              amount: Number(amount),
            }),
          });

          const data = await response.json();

          if (response.ok) {
            console.log('Payment confirmed successfully:', data);
            clearCart(); // Clear cart after successful checkout
            // Optionally, redirect to an order confirmation page or display success message
            setHasConfirmed(true); // Mark as confirmed
          } else {
            console.error('Payment confirmation failed:', data);
            router.replace(`/checkout/toss/fail?code=${data.code || 'UNKNOWN_ERROR'}&message=${data.message || 'Payment confirmation failed.'}`);
          }
        } catch (error) {
          console.error('Error confirming payment:', error);
          if (error instanceof Error) {
            router.replace(`/checkout/toss/fail?code=NETWORK_ERROR&message=${error.message}`);
          }
        } finally {
          // Ensure hasConfirmed is set to true even on error to prevent re-triggering
          setHasConfirmed(true);
        }
      };

      confirmPayment();
    } else if (!paymentKey || !tossOrderId || !amount) {
      // Handle missing parameters, redirect to fail page or show error
      router.replace('/checkout/toss/fail?code=MISSING_PARAMS');
    }
  }, [paymentKey, tossOrderId, amount, router, clearCart, hasConfirmed]); // Add hasConfirmed to dependency array

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-green-600 mb-4">결제 성공!</h1>
      <p className="text-lg text-gray-700 mb-2">결제가 성공적으로 처리되었습니다.</p>
      <p className="text-md text-gray-600">주문 번호: {tossOrderId}</p>
      <p className="text-md text-gray-600">결제 금액: {amount}원</p>
      {/* You might want to add a link to the order history page */}
      <button
        onClick={() => router.push('/my-orders')}
        className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        주문 내역 확인
      </button>
    </div>
  );
}