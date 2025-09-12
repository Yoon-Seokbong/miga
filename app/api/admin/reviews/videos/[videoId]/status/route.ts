import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

enum ContentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const session = await getServerSession(authOptions);

  // 1. Check for admin privileges
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
  }

  try {
    const { status } = await request.json();

    // 2. Validate the incoming status
    if (!status || !Object.values(ContentStatus).includes(status)) {
      return NextResponse.json({ message: 'Invalid status provided.' }, { status: 400 });
    }

    // 3. Update the video status in the database
    const updatedVideo = await prisma.reviewVideo.update({
      where: { id: videoId },
      data: { status },
    });

    return NextResponse.json(updatedVideo, { status: 200 });

  } catch (error) {
    console.error(`Error updating status for review video ${videoId}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while updating video status.' }, { status: 500 });
  }
}