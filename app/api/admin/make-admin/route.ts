import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_MAKER_SECRET = process.env.ADMIN_MAKER_SECRET || 'super-secret-key';

export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json();

    if (secret !== ADMIN_MAKER_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' },
    });

    return NextResponse.json({ message: `User ${updatedUser.email} has been promoted to ADMIN.`, user: updatedUser });

  } catch (error) {
    console.error('Error promoting user to admin:', error);
    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json({ message: `User with email ${ (await request.json()).email } not found.` }, { status: 404 });
    }
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
