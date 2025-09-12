import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = params;
    const { status } = await request.json();

    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error(`Error updating order status:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
