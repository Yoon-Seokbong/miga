import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET questions for a specific product
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};

    if (!isAdmin) {
      where.status = 'APPROVED';
    }

    if (productId) {
      where.productId = productId;
    }

    const [questions, totalCount] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({ questions, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching questions:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while fetching questions' }, { status: 500 });
  }
}

// POST a new question
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { productId, questionText } = await request.json();

    if (!productId || !questionText) {
      return NextResponse.json({ message: 'Product ID and question text are required' }, { status: 400 });
    }

    const newQuestion = await prisma.question.create({
      data: {
        productId,
        userId: session.user.id,
        questionText,
        status: 'PENDING', // Default status for new questions
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while creating the question' }, { status: 500 });
  }
}