'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button'; // Assuming a Button component exists

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/profile');
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data: UserProfile = await res.json();
        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phoneNumber || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err instanceof Error) {
            setError(err.message || '프로필 정보를 불러오는 데 실패했습니다.');
        } else {
            setError('프로필 정보를 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phoneNumber }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data);
        setMessage('프로필 정보가 성공적으로 업데이트되었습니다!');
        // Optionally, refresh session or redirect
        // router.refresh();
      } else {
        setError(data.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err instanceof Error) {
        setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
      } else {
        setError('프로필 업데이트 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8 text-center">프로필 정보를 불러오는 중...</div>;
  }

  if (error && !profile) { // Only show full error if profile couldn't be loaded at all
    return <div className="container mx-auto p-8 text-red-500 text-center">오류: {error}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">개인 정보 수정</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">전화번호</label>
          <input
            type="text"
            id="phoneNumber"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700"
          disabled={submitting || loading}
        >
          {submitting ? '저장 중...' : '정보 저장'}
        </Button>

        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}