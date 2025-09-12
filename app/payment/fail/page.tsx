'use client';

import dynamic from 'next/dynamic';

const PaymentFailContent = dynamic(() => import('./PaymentFailContent'), { ssr: false });

export default function PaymentFailPage() {
  return (
    <PaymentFailContent />
  );
}