import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;

  try {
    // First, delete related OrderLineItem records
    await prisma.orderLineItem.deleteMany({
      where: {
        orderId: id,
      },
    });

    // Then, delete the Order itself
    const deletedOrder = await prisma.order.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(deletedOrder);
  } catch (error) {
    console.error('Error deleting order:', error);
    // Handle cases where the order might not be found (e.g., already deleted)
    if (error instanceof Error && (error.name === 'NotFoundError' || (error as any).code === 'P2025')) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error deleting order' }, { status: 500 });
  }
}
