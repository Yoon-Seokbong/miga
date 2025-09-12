import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST a new answer
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only ADMIN users can answer questions
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Only administrators can answer questions.' }, { status: 403 });
    }

    const { questionId, answerText } = await request.json();

    if (!questionId || !answerText) {
      return NextResponse.json({ message: 'Question ID and answer text are required' }, { status: 400 });
    }

    const newAnswer = await prisma.answer.create({
      data: {
        questionId,
        userId: session.user.id, // Assuming admin user's ID
        answerText,
      },
    });

    return NextResponse.json(newAnswer, { status: 201 });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json({ message: 'Something went wrong while creating the answer' }, { status: 500 });
  }
}