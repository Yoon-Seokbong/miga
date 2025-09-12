'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  name: string;
  images: { url: string }[];
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistProductIds: Set<string>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { status } = useSession();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (status === 'authenticated') {
        setLoading(true);
        try {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const data: WishlistItem[] = await res.json();
            setWishlist(data);
            setWishlistProductIds(new Set(data.map(item => item.productId)));
          }
        } catch (error) {
          console.error('Failed to fetch wishlist', error);
          // Optionally, set an error state here if you want to display it
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        // Clear wishlist on logout
        setWishlist([]);
        setWishlistProductIds(new Set());
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [status]);

  const addToWishlist = async (productId: string) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setWishlist(prev => [...prev, newItem]);
        setWishlistProductIds(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Failed to add to wishlist', error);
      // Optionally, set an error state here
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setWishlist(prev => prev.filter(item => item.productId !== productId));
        setWishlistProductIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to remove from wishlist', error);
      // Optionally, set an error state here
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistProductIds, addToWishlist, removeFromWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
