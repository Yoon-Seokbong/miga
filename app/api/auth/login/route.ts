import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    return NextResponse.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name } }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
