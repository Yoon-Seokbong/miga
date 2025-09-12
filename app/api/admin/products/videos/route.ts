import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const productVideos = await prisma.productVideo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json(productVideos, { status: 200 });
  } catch (error) {
    console.error("Error fetching product videos:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
