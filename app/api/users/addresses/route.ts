import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' }, // Default address first
    });

    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { address1, address2, city, state, zipCode, country, isDefault } = await request.json();

    if (!address1 || !city || !zipCode) {
      return NextResponse.json({ message: '필수 주소 정보가 누락되었습니다.' }, { status: 400 });
    }

    // If new address is set as default, unset previous default for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        address1,
        address2,
        city,
        state,
        zipCode,
        country: country || "대한민국",
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error('Error adding address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}