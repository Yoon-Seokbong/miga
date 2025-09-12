import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const updatedRequest = await prisma.productRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ message: 'Product request status updated successfully', updatedRequest }, { status: 200 });
  } catch (error) {
    console.error('Error updating product request status:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}