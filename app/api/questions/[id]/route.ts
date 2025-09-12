import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET a single question by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json(question, { status: 200 });
  } catch (error) {
    console.error(`Error fetching question ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}

// PUT (update) a question by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const { questionText } = await request.json();

    // Find the question to check ownership
    const existingQuestion = await prisma.question.findUnique({ where: { id } });

    if (!existingQuestion) {
      return NextResponse.json({ message: 'Question not found.' }, { status: 404 });
    }

    // Check if the user is the owner or an admin
    if (existingQuestion.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to edit this question.' }, { status: 403 });
    }

    if (!questionText) {
      return NextResponse.json({ message: 'Question text is required.' }, { status: 400 });
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        questionText,
      },
    });

    return NextResponse.json(updatedQuestion, { status: 200 });
  } catch (error) {
    console.error(`Error updating question ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Something went wrong during question update.' }, { status: 500 });
  }
}

// DELETE a question by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;

    // Find the question to check ownership
    const existingQuestion = await prisma.question.findUnique({ where: { id } });

    if (!existingQuestion) {
      return NextResponse.json({ message: 'Question not found.' }, { status: 404 });
    }

    // Check if the user is the owner or an admin
    if (existingQuestion.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to delete this question.' }, { status: 403 });
    }

    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ message: 'Question deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting question ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Something went wrong during question deletion.' }, { status: 500 });
  }
}
