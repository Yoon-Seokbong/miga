import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    console.log('Fetched categories:', categories);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: '이미 존재하는 카테고리 이름입니다.' }, { status: 409 }); // 409 Conflict
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
