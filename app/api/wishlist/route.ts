import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET user's wishlist
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: { // Include the full product details
          include: {
            images: true, // Include product images
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(wishlistItems, { status: 200 });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// POST to add an item to the wishlist
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    // Check if the product exists before adding to wishlist
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Check if the item is already in the wishlist
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json({ message: 'Product already in wishlist' }, { status: 409 }); // 409 Conflict
    }

    const newWishlistItem = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId: productId,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(newWishlistItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE an item from the wishlist
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    });

    return NextResponse.json({ message: 'Product removed from wishlist' }, { status: 200 });
  } catch (error) {
    // Handle cases where the item to delete is not found
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json({ message: 'Item not found in wishlist' }, { status: 404 });
        }
    }
    console.error('Error removing from wishlist:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}