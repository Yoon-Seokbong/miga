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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true, // Include the new field
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, phoneNumber } = await request.json();

    // Basic validation
    if (!name && !email && !phoneNumber) {
      return NextResponse.json({ message: 'No data provided for update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined, // Only update if provided
        email: email || undefined, // Only update if provided
        phoneNumber: phoneNumber || undefined, // Only update if provided
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Handle unique constraint violation for email if necessary
    if (error instanceof Error && error.message.includes('Unique constraint failed on the fields: (`email`)')) {
        return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}