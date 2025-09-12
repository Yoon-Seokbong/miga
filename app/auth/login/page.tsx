'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import InputField from '@/components/InputField';
import Button from '@/components/Button'; // Import the new Button component

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError('이메일 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('Client-side login error:', err);
      setError('예상치 못한 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground"> {/* Updated background and text color */}
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md"> {/* Updated background and shadow */}
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">로그인</h2> {/* Updated heading color */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="이메일"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value as string)}
            required
            autoComplete="off"
          />
          <InputField
            label="비밀번호"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value as string)}
            required
            autoComplete="off"
          />
          <Button type="submit" fullWidth size="lg"> {/* Use Button component */}
            로그인
          </Button>
        </form>
        <div className="mt-6 text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-300"></div>
            <span className="relative bg-card px-2 text-sm text-gray-500">또는</span>
          </div>
          <Button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            fullWidth
            size="lg"
            className="mt-4 bg-blue-600 text-white"
          >
            Google로 로그인
          </Button>
          <Button
            onClick={() => signIn('naver', { callbackUrl: '/' })}
            fullWidth
            size="lg"
            className="mt-2 bg-green-600 text-white" // mt-2 for spacing
          >
            Naver로 로그인
          </Button>
        </div>
        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
        <p className="mt-4 text-center text-sm text-foreground"> {/* Updated text color */}
          계정이 없으신가요? {' '}
          <Link href="/auth/register" className="font-medium text-primary hover:text-purple-800">여기에서 회원가입하세요</Link> {/* Updated link styling */}
        </p>
      </div>
    </div>
  );
}
