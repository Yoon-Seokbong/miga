import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // Add this line

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const allOrders = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    let orders;
    let totalOrders;

    if (allOrders) {
      if (session.user?.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to view all orders.' }, { status: 403 });
      }

      [orders, totalOrders] = await prisma.$transaction([
        prisma.order.findMany({
          skip,
          take: limit,
          include: {
            lineItems: {
              include: {
                product: true,
              },
            },
            user: {
              select: { email: true },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.order.count(),
      ]);

    } else {
      const userId = session.user.id;
      
      [orders, totalOrders] = await prisma.$transaction([
        prisma.order.findMany({
          where: {
            userId: userId,
          },
          skip,
          take: limit,
          include: {
            lineItems: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.order.count({
          where: {
            userId: userId,
          },
        }),
      ]);
    }

    return NextResponse.json({ orders, totalOrders, page, limit }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Something went wrong while fetching orders' }, { status: 500 });
  }
}