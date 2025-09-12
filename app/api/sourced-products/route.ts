import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  console.log('API - Sourced Products: Session User Role:', session?.user?.role);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    console.log(`API - Sourced Products: Fetching with page=${page}, limit=${limit}, skip=${skip}`);

    const [sourcedProducts, totalCount] = await prisma.$transaction([
      prisma.sourcedProduct.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          sourceUrl: true,
          translatedName: true,
          localPrice: true,
          status: true,
          createdAt: true,
          images: true,
          translatedDescription: true,
          attributes: true,
        }
      }),
      prisma.sourcedProduct.count(),
    ]);

    console.log('API - Sourced Products: Fetched products count:', sourcedProducts.length);
    console.log('API - Sourced Products: Fetched total count:', totalCount);

    return NextResponse.json({ sourcedProducts, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sourced products:', error);
    return NextResponse.json(
      { message: 'Something went wrong while fetching sourced products' },
      { status: 500 }
    );
  }
}