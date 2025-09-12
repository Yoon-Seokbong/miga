'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for the login link
import { signIn } from 'next-auth/react'; // Import signIn
import InputField from '@/components/InputField'; // Import the new InputField component
import Button from '@/components/Button'; // Import the new Button component

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        router.push('/auth/login');
      } else {
        setError(data.message || '회원가입 실패');
      }
    } catch (err) {
      console.error('Client-side registration error:', err);
      setError('예상치 못한 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground"> {/* Updated background and text color */}
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md"> {/* Updated background and shadow */}
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">회원가입</h2> {/* Updated heading color */}
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
            label="이름 (선택 사항)"
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value as string)}
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
            회원가입
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
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Google로 회원가입
          </Button>
        </div>
        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
        {message && <p className="mt-4 text-center text-green-500 text-sm">{message}</p>}
        <p className="mt-4 text-center text-sm text-foreground"> {/* Updated text color */}
          이미 계정이 있으신가요? {' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-purple-800">여기에서 로그인하세요</Link> {/* Updated link styling */}
        </p>
      </div>
    </div>
  );
}