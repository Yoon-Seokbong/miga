import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { couponCode, cartTotal } = await request.json();

    if (!couponCode || cartTotal === undefined) {
      return NextResponse.json({ message: 'Coupon code and cart total are required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    // 1. Validation Checks
    if (!coupon) {
      return NextResponse.json({ message: '유효하지 않은 쿠폰 코드입니다.' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ message: '비활성화된 쿠폰입니다.' }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ message: '만료된 쿠폰입니다.' }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return NextResponse.json({ message: '사용 한도를 초과한 쿠폰입니다.' }, { status: 400 });
    }

    if (coupon.minPurchaseAmount && cartTotal < coupon.minPurchaseAmount) {
      return NextResponse.json({ message: `이 쿠폰을 사용하려면 최소 ${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매해야 합니다.` }, { status: 400 });
    }

    // 2. Calculate Discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = cartTotal * (coupon.discountValue / 100);
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    const finalPrice = cartTotal - discountAmount;

    // 3. Return successful validation
    return NextResponse.json({
      isValid: true,
      discountAmount: Math.round(discountAmount),
      finalPrice: Math.round(finalPrice),
      message: '쿠폰이 성공적으로 적용되었습니다.',
    }, { status: 200 });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ message: '쿠폰 검증 중 오류가 발생했습니다.' }, { status: 500 });
  }
}