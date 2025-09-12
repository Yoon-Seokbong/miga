import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { writeFile, stat, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth';

// Function to ensure a directory exists
async function ensureDirExists(dirPath: string) {
  try {
    await stat(dirPath);
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: unknown }).code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw e;
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: reviewId } = params;

  try {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review || review.userId !== session.user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await request.formData();
    const video: File | null = data.get('video') as unknown as File;

    if (!video) {
      return NextResponse.json({ message: 'No video file provided.' }, { status: 400 });
    }

    if (!video.type.startsWith('video/')) {
        return NextResponse.json({ message: 'Invalid file type. Only videos are allowed.' }, { status: 400 });
    }

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${video.name.replace(/\s+/g, '-')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'review-videos');
    const path = join(uploadDir, filename);

    await ensureDirExists(uploadDir);

    await writeFile(path, buffer);
    console.log(`Review video uploaded to ${path}`);

    const newReviewVideo = await prisma.reviewVideo.create({
      data: {
        reviewId: reviewId,
        url: `/uploads/review-videos/${filename}`,
      },
    });

    return NextResponse.json(newReviewVideo, { status: 201 });
  } catch (error) {
    console.error('Error uploading review video:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong while uploading the review video.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { videoId: string } }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { videoId } = params;

    try {
        const video = await prisma.reviewVideo.findUnique({
            where: { id: videoId },
        });

        if (!video) {
            return NextResponse.json({ message: 'Video not found.' }, { status: 404 });
        }

        const filePath = join(process.cwd(), 'public', video.url);
        try {
            await stat(filePath);
            await unlink(filePath);
        } catch (e: unknown) {
            // Type-safe error handling
            if (typeof e === 'object' && e !== null && 'code' in e) {
                if ((e as { code: string }).code !== 'ENOENT') {
                    console.warn(`Could not delete file: ${filePath}`, e);
                }
            } else {
                // It's some other type of error, so we should probably log it
                console.warn(`An unexpected error occurred while deleting file: ${filePath}`, e);
            }
        }

        await prisma.reviewVideo.delete({ where: { id: videoId } });

        return NextResponse.json({ message: 'Review video deleted successfully.' }, { status: 200 });
    } catch (error) {
        console.error(`Error deleting review video ${videoId}:`, error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}
