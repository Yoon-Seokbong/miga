import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET a single review by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!review) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json(review, { status: 200 });
  } catch (error) {
    console.error(`Error fetching review ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}

// PUT (update) a review by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const { rating, comment } = await request.json();

    // Find the review to check ownership
    const existingReview = await prisma.review.findUnique({ where: { id } });

    if (!existingReview) {
      return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    }

    // Check if the user is the owner or an admin
    if (existingReview.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to edit this review.' }, { status: 403 });
    }

    if (!rating) { // Comment can be optional, but rating is required
      return NextResponse.json({ message: 'Rating is required.' }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating,
        comment,
      },
    });

    return NextResponse.json(updatedReview, { status: 200 });
  } catch (error) {
    console.error(`Error updating review ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Something went wrong during review update.' }, { status: 500 });
  }
}

// DELETE a review by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;

    // Find the review to check ownership
    const existingReview = await prisma.review.findUnique({ where: { id } });

    if (!existingReview) {
      return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    }

    // Check if the user is the owner or an admin
    if (existingReview.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to delete this review.' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ message: 'Review deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting review ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Something went wrong during review deletion.' }, { status: 500 });
  }
}
