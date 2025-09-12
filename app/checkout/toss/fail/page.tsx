'use client';

import { Suspense } from 'react';
import PaymentFailContent from '@/app/payment/fail/PaymentFailContent';

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailContent />
    </Suspense>
  );
}