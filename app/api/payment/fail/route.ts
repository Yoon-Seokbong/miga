import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Only update if the order is still in a pending state.
    // Avoids overwriting a completed payment status if there's a race condition.
    if (order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELED' }, // Or 'FAILED'
      });
    }

    return NextResponse.json({ message: 'Order status updated to canceled' }, { status: 200 });
  } catch (error) {
    console.error('Error updating order status to fail:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error updating order status', error: errorMessage }, { status: 500 });
  }
}
