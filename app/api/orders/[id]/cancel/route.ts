import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path as needed

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    // Authorization check: Only admin or the order owner can cancel
    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized to cancel this order.' }, { status: 403 });
    }

    // Only allow cancellation if the order is PENDING
    if (order.status !== 'PENDING') {
      return NextResponse.json({ message: `Order cannot be cancelled. Current status: ${order.status}` }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ message: 'Order cancelled successfully.', order: updatedOrder }, { status: 200 });

  } catch (error) {
    console.error('Error cancelling order:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Error cancelling order.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred while cancelling the order.' }, { status: 500 });
  }
}