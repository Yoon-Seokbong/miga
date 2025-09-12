import { NextResponse } from 'next/server';
import axios, { isAxiosError } from 'axios';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const { cartItems, totalPrice, appliedCouponCode, discountAmount }: { cartItems: CartItem[], totalPrice: number, appliedCouponCode?: string, discountAmount?: number } = await request.json();

    const userId = session.user.id;
    const userFromDb = await prisma.user.findUnique({ where: { id: userId } });
    if (!userFromDb) {
      return NextResponse.json({ message: 'User not found for order creation.' }, { status: 400 });
    }

    if (!cartItems || cartItems.length === 0 || totalPrice === undefined) {
      return NextResponse.json({ message: 'Missing order details' }, { status: 400 });
    }

    const tossOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // --- Order Creation Logic with Transaction for Coupon --- 
    let newOrder;
    if (appliedCouponCode) {
      // Use a transaction to ensure both order creation and coupon update succeed or fail together
      try {
        const [order, couponUpdate] = await prisma.$transaction([
          // 1. Create the Order
          prisma.order.create({
            data: {
              userId: userFromDb.id,
              total: totalPrice,
              isPaid: false,
              status: 'PENDING',
              tossOrderId,
              appliedCouponCode: appliedCouponCode,
              discountAmount: discountAmount,
              lineItems: {
                create: cartItems.map((item: CartItem) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                })),
              },
            },
          }),
          // 2. Update the Coupon's usage count
          prisma.coupon.update({
            where: { code: appliedCouponCode },
            data: { timesUsed: { increment: 1 } },
          }),
        ]);
        newOrder = order;
        console.log(`Order ${order.id} created and coupon ${couponUpdate.code} usage updated.`);
      } catch (e) {
        console.error('Transaction failed:', e);
        if (e instanceof Error) {
            return NextResponse.json({ message: `Transaction failed: ${e.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: 'Failed to process order with coupon.' }, { status: 500 });
      }
    } else {
      // Create order without coupon
      newOrder = await prisma.order.create({
        data: {
          userId: userFromDb.id,
          total: totalPrice,
          isPaid: false,
          status: 'PENDING',
          tossOrderId,
          lineItems: {
            create: cartItems.map((item: CartItem) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      console.log('Order created successfully without coupon:', newOrder.id);
    }

    // --- Toss Payments API Call --- 
    const tossPaymentsApiUrl = 'https://api.tosspayments.com/v1/payments';
    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
    const basicAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

    const paymentResponse = await axios.post(tossPaymentsApiUrl, {
      orderId: tossOrderId,
      amount: Math.round(totalPrice),
      orderName: `MIGA-${tossOrderId}`,
      customerName: userFromDb.name || "MIGA User",
      customerEmail: userFromDb.email,
      method: "card",
      successUrl: `${request.headers.get('origin')}/checkout/toss/success`,
      failUrl: `${request.headers.get('origin')}/checkout/toss/fail`,
    }, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json(paymentResponse.data, { status: paymentResponse.status });

  } catch (error) {
    if (isAxiosError(error)) {
        console.error('Error initiating Toss payment:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        return NextResponse.json({
            message: `Failed to initiate payment: ${errorMessage}`,
            details: error.response?.data || null
        }, { status: 500 });
    } else if (error instanceof Error) {
        console.error('Error initiating Toss payment:', error.message);
        return NextResponse.json({ message: `Failed to initiate payment: ${error.message}` }, { status: 500 });
    }
    console.error('An unknown error occurred:', error);
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  }
}