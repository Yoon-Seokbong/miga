'use client';

import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from './Button'; // Assuming a generic Button component exists

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ productId, className }) => {
  const { wishlistProductIds, addToWishlist, removeFromWishlist } = useWishlist();
  const { status } = useSession();
  const router = useRouter();

  const isWishlisted = wishlistProductIds.has(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if the button is inside a Link
    e.stopPropagation();

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (isWishlisted) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  // Don't render the button if the session is loading
  if (status === 'loading') {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      variant={isWishlisted ? 'primary' : 'outline'}
      size="sm"
      className={className}
    >
      {isWishlisted ? '❤️ 찜 해제' : '🤍 찜하기'}
    </Button>
  );
};

export default WishlistButton;