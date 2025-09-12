import React from 'react';
import Image from "next/image";
import Link from 'next/link';
import Button from '@/components/Button';
import WishlistButton from '@/components/WishlistButton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getWishlistItems() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect('/auth/login');
  }

  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return wishlistItems;
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    notFound();
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client after use
  }
}

export default async function WishlistPage() {
  const wishlistItems = await getWishlistItems();

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">나의 위시리스트</h1>
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-400">위시리스트에 담긴 상품이 없습니다.</p>
          <Link href="/" >
            <Button className="mt-4">쇼핑 계속하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-primary">나의 위시리스트</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {wishlistItems.map(item => (
          <div key={item.productId} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 group">
            <Link href={`/products/${item.productId}`} >
              <div className="relative w-full h-48">
                <Image
                  src={(item.product.images && item.product.images[0]?.url) || '/placeholder.png'}
                  alt={item.product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center"
                />
              </div>
            </Link>
            <div className="p-4 flex flex-col">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-purple-600 flex-grow">{item.product.name}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-800 dark:text-white font-bold text-lg">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(item.product.price)}</span>
                {/* WishlistButton is a Client Component, so it can be used here */}
                <WishlistButton productId={item.productId} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}