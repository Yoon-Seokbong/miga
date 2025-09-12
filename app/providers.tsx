'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { WishlistProvider } from '@/context/WishlistContext';
import { Session } from 'next-auth'; // Import the Session type

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null; // Use the imported Session type
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}> {/* Pass session prop */}
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </SessionProvider>
  );
}