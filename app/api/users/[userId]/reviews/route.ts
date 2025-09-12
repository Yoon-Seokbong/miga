import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to access these reviews.' }, { status: 403 });
    }

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true, images: { select: { url: true }, take: 1 } } }, // Include product info
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error(`Error fetching reviews for user ${userId}:`, error);
    return NextResponse.json({ message: 'Something went wrong while fetching user reviews.' }, { status: 500 });
  }
}