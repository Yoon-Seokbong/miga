'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import Button from '@/components/Button'; // Assuming you have this component

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(getTotalPrice());
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    setFinalPrice(getTotalPrice() - discount);
  }, [getTotalPrice, discount]);

  const handleApplyCoupon = async () => {
    setCouponMessage('');
    if (!couponCode) {
      setCouponMessage('쿠폰 코드를 입력해주세요.');
      return;
    }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode, cartTotal: getTotalPrice() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscount(data.discountAmount);
        setFinalPrice(data.finalPrice);
        setCouponMessage(data.message);
      } else {
        setDiscount(0);
        setFinalPrice(getTotalPrice());
        setCouponMessage(data.message || '쿠폰 적용에 실패했습니다.');
      }
    } catch {
      setDiscount(0);
      setFinalPrice(getTotalPrice());
      setCouponMessage('쿠폰 검증 중 오류가 발생했습니다.');
    }
  };

  const handleCheckout = async () => {
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    if (cartItems.length === 0) {
      alert('장바구니가 비어 있습니다.');
      return;
    }

    try {
      const response = await fetch('/api/checkout/toss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
          totalPrice: finalPrice, // Use finalPrice for checkout
          userId: currentUserId,
          appliedCouponCode: discount > 0 ? couponCode : null, // Pass coupon code if discount applied
          discountAmount: discount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.checkout.url;
      } else {
        alert(`결제 요청 실패: ${data.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('결제 요청 중 오류 발생:', error);
      alert('결제 요청 중 오류가 발생했습니다.');
    }
  };

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return null;

  const isCheckoutButtonDisabled = status === 'loading' || status === 'unauthenticated';

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">장바구니</h1>

      {cartItems.length === 0 ? (
        <div className="text-center text-gray-600">
          <p className="mb-4">장바구니가 비어 있습니다.</p>
          <Link href="/" className="text-blue-600 hover:underline">상품 둘러보기</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">상품 목록</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-gray-600">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(item.price)}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300">-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300">+</button>
                    <button onClick={() => removeFromCart(item.productId)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-2xl font-bold mb-4">결제 정보</h2>
            <div className="space-y-2 mb-6">
              <p className="flex justify-between"><span>총 상품 금액:</span> <span>{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(getTotalPrice())}</span></p>
              <p className="flex justify-between text-red-500"><span>할인 금액:</span> <span>- {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(discount)}</span></p>
              <p className="flex justify-between text-xl font-bold border-t pt-2 mt-2"><span>최종 결제 금액:</span> <span>{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(finalPrice)}</span></p>
            </div>

            <div className="mb-6">
              <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1">쿠폰 코드</label>
              <div className="flex gap-2">
                <input type="text" id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="쿠폰 코드를 입력하세요" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                <Button onClick={handleApplyCoupon}>적용</Button>
              </div>
              {couponMessage && <p className={`mt-2 text-sm ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>{couponMessage}</p>}
            </div>

            <button
              onClick={handleCheckout}
              className={`w-full bg-purple-700 text-white py-3 px-6 rounded-full text-lg font-semibold ${isCheckoutButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-800'}`}
              disabled={isCheckoutButtonDisabled}
            >
              {status === 'loading' ? '세션 로딩 중...' : '결제하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
