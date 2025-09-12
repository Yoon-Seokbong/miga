import { NextResponse } from 'next/server';
import axios, { isAxiosError } from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ message: 'Missing payment confirmation details' }, { status: 400 });
    }

    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
    if (!TOSS_SECRET_KEY) {
      return NextResponse.json({ message: 'Toss Secret Key is not configured.' }, { status: 500 });
    }

    // Verify payment with Toss Payments API
    const tossPaymentsApiUrl = `https://api.tosspayments.com/v1/payments/${paymentKey}`;
    const basicAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

    const response = await axios.post(tossPaymentsApiUrl, {
      orderId: orderId,
      amount: amount,
    }, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });

    const tossPayment = response.data;

    // Find the order in your database using tossOrderId
    const order = await prisma.order.findUnique({
      where: { tossOrderId: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found in database.' }, { status: 404 });
    }

    // Check if payment is approved and amounts match
    if (tossPayment.status === 'DONE' && tossPayment.totalAmount === amount) {
      // Update order status in database
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          isPaid: true,
          status: 'PAID',
          paymentKey: paymentKey,
          paymentMethod: tossPayment.method,
          approvedAt: new Date(tossPayment.approvedAt),
          receiptUrl: tossPayment.receipt?.url || null,
        },
      });
      return NextResponse.json({ message: 'Payment confirmed and order updated.', orderId: updatedOrder.id }, { status: 200 });
    } else {
      // Payment not done or amount mismatch
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'FAILED',
        },
      });
      return NextResponse.json({ message: 'Payment verification failed.', details: tossPayment }, { status: 400 });
    }

  } catch (error) {
    if (isAxiosError(error)) {
        console.error('Error confirming Toss payment:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        return NextResponse.json({
            message: `Failed to confirm payment: ${errorMessage}`,
            details: error.response?.data || null
        }, { status: 500 });
    } else if (error instanceof Error) {
        console.error('Error confirming Toss payment:', error.message);
        return NextResponse.json({ message: `Failed to confirm payment: ${error.message}` }, { status: 500 });
    }
    console.error('An unknown error occurred:', error);
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  }
}