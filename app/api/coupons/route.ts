import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET all coupons for admin
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// POST a new coupon
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      expiresAt,
      isActive,
      usageLimit,
      minPurchaseAmount,
    } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ message: 'Code, discount type, and value are required' }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? isActive : true,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
      },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ message: '이미 존재하는 쿠폰 코드입니다.' }, { status: 409 });
      }
    }
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}