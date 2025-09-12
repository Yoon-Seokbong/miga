import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { unlink } from 'fs/promises';
import { join } from 'path';
import { stat } from 'fs/promises';

// Helper function to check if file exists
async function fileExists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: unknown }).code === 'ENOENT') {
            return false;
        }
        throw e;
    }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const { id: productId, videoId } = await params;

  try {
    // 1. Find the video record in the database
    const video = await prisma.productVideo.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ message: 'Video not found.' }, { status: 404 });
    }

    // Ensure the video belongs to the correct product
    if (video.productId !== productId) {
        return NextResponse.json({ message: 'Video does not belong to this product.' }, { status: 400 });
    }

    // 2. Delete the physical file from the server
    const filePath = join(process.cwd(), 'public', video.url);
    
    if (await fileExists(filePath)) {
        await unlink(filePath);
        console.log(`Deleted video file: ${filePath}`);
    } else {
        console.warn(`Video file not found, but proceeding to delete DB record: ${filePath}`);
    }

    // 3. Delete the video record from the database
    await prisma.productVideo.delete({
      where: { id: videoId },
    });

    return NextResponse.json({ message: 'Video deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting video ${videoId}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong during video deletion.' }, { status: 500 });
  }
}