import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';



const prisma = new PrismaClient();


export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Only administrators can update review status.' }, { status: 403 });
    }

    const { status } = await request.json(); // Expecting 'APPROVED', 'REJECTED', or 'PENDING'

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status provided.' }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedReview, { status: 200 });
  } catch (error) {
    console.error(`Error updating review status for ID ${id}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while updating review status.' }, { status: 500 });
  }
}
