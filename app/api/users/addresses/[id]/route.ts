import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const address = await prisma.address.findUnique({
      where: { id: (await params).id, userId: session.user.id }, // Ensure user owns the address
    });

    if (!address) {
      return NextResponse.json({ message: 'Address not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json(address, { status: 200 });
  } catch (error) {
    console.error('Error fetching single address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { address1, address2, city, state, zipCode, country, isDefault } = await request.json();

    // Ensure user owns the address before updating
    const existingAddress = await prisma.address.findUnique({
      where: { id: (await params).id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json({ message: 'Address not found or not owned by user' }, { status: 404 });
    }

    // If updated address is set as default, unset previous default for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: (await params).id },
      data: {
        address1: address1 || undefined,
        address2: address2 || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || undefined,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(updatedAddress, { status: 200 });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure user owns the address before deleting
    const existingAddress = await prisma.address.findUnique({
      where: { id: (await params).id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json({ message: 'Address not found or not owned by user' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: 'Address deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
