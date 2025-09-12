'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

interface AuthContextType {
  user: { id: string; email: string; name?: string } | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt.decode(token) as { userId: string; email: string; name?: string; exp: number };
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.userId, email: decoded.email, name: decoded.name });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded = jwt.decode(token) as { userId: string; email: string; name?: string };
    setUser({ id: decoded.userId, email: decoded.email, name: decoded.name });
    router.push('/'); // Redirect to home after login
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login'); // Redirect to login after logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
