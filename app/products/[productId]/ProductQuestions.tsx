'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import Link from 'next/link';

// Define types (these should ideally be imported from a shared types file)
interface UserInfo { id: string; name: string | null; email: string | null; }
interface Answer { id: string; answerText: string; createdAt: string; user: UserInfo; }
interface Question {
  id: string;
  questionText: string;
  createdAt: string;
  user: UserInfo;
  answers: Answer[];
}

interface ProductQuestionsProps {
  initialQuestions?: Question[]; // Optional: if you want to pass initial questions from server
}

export default function ProductQuestions({ initialQuestions }: ProductQuestionsProps) {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const { data: session } = useSession();

  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!productId) return;
    setQuestionLoading(true);
    try {
      const res = await fetch(`/api/questions?productId=${productId}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data.questions);
    } catch (err: unknown) {
      setQuestionError((err as Error).message || '질문을 불러오는 데 실패했습니다.');
    } finally {
      setQuestionLoading(false);
    }
  }, [productId, setQuestionLoading, setQuestions, setQuestionError]);

  useEffect(() => {
    fetchQuestions();
  }, [productId, fetchQuestions]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return alert('질문을 작성하려면 로그인해야 합니다.');
    if (!newQuestionText) return alert('질문 내용을 입력해주세요.');

    setQuestionLoading(true);
    setQuestionError(null);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, questionText: newQuestionText }),
      });

      if (!res.ok) throw new Error('질문을 제출하는 데 실패했습니다.');
      setNewQuestionText('');
      alert('질문이 성공적으로 제출되었습니다.');
      fetchQuestions();
    } catch (err: unknown) {
      setQuestionError((err as Error).message);
    } finally {
      setQuestionLoading(false);
    }
  };

  return (
    <div className="mt-12 p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-foreground mb-6">상품 Q&A</h2>
      {/* Question Display */}
      {questions.length === 0 ? <p className="text-center text-gray-600">아직 작성된 질문이 없습니다.</p> : <div className="space-y-6">{questions.map(question => (<div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0"><div className="flex justify-between items-center mb-2"><span className="font-semibold text-foreground">{question.user.name || question.user.email}</span><span className="text-sm text-gray-500">{new Date(question.createdAt).toLocaleDateString()}</span></div><p className="text-foreground">{question.questionText}</p>{question.answers && question.answers.length > 0 && (<div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-2">{question.answers.map(answer => (<div key={answer.id} className="bg-gray-50 p-3 rounded-md"><div className="flex justify-between items-center mb-1"><span className="font-semibold text-gray-700">{answer.user.name || answer.user.email}</span><span className="text-xs text-gray-500">{new Date(answer.createdAt).toLocaleDateString()}</span></div><p className="text-gray-700">{answer.answerText}</p></div>))}</div>)}</div>))}</div>}

      {/* Question Submission Form */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-foreground mb-4">질문 작성</h3>
        {session?.user ? (<form onSubmit={handleSubmitQuestion} className="space-y-4">
          <div><label htmlFor="questionText">질문 내용</label><input type="text" id="questionText" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} required /></div>
          <Button type="submit" disabled={questionLoading}>{questionLoading ? '제출 중...' : '질문 제출'}</Button>
          {questionError && <p className="text-red-500 text-sm mt-2">{questionError}</p>}
        </form>) : (<p>질문을 작성하려면 <Link href="/auth/login">로그인</Link> 해주세요.</p>)}
      </div>
    </div>
  );
}