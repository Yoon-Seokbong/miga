
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
  }

  try {
    const reviewVideos = await prisma.reviewVideo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        review: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            product: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(reviewVideos, { status: 200 });

  } catch (error) {
    console.error('Error fetching review videos:', error);
    return NextResponse.json({ message: 'Something went wrong while fetching review videos.' }, { status: 500 });
  }
}
