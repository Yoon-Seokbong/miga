import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;

  try {
    await prisma.productRequest.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Product request deleted successfully' });
  } catch (error) {
    console.error('Error deleting product request:', error);
    if (error instanceof Error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Product request not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error deleting product request' }, { status: 500 });
  }
}
