'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';

// Interfaces for data
interface ProductInfo {
  id: string;
  name: string;
  images: { url: string }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  product: ProductInfo;
}

interface Question {
  id: string;
  questionText: string;
  createdAt: string;
  product: ProductInfo;
  answers: { id: string; answerText: string; createdAt: string }[];
}

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');

  // State for editing
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editedReviewRating, setEditedReviewRating] = useState<number | ''>(0);
  const [editedReviewComment, setEditedReviewComment] = useState('');

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState('');

  const fetchMyContent = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      console.log('Session User ID:', session?.user?.id);
      const [reviewsRes, questionsRes] = await Promise.all([
        fetch(`/api/users/${session?.user?.id}/reviews`),
        fetch(`/api/users/${session?.user?.id}/questions`),
      ]);

      console.log('Reviews API Response:', reviewsRes.ok, reviewsRes.status, reviewsRes.statusText);
      if (!reviewsRes.ok) {
        const errorData = await reviewsRes.json();
        console.error('Reviews API Error Data:', errorData);
      }

      console.log('Questions API Response:', questionsRes.ok, questionsRes.status, questionsRes.statusText);
      if (!questionsRes.ok) {
        const errorData = await questionsRes.json();
        console.error('Questions API Error Data:', errorData);
      }

      if (!reviewsRes.ok || !questionsRes.ok) {
        throw new Error(
          `Failed to fetch my content. Reviews: ${reviewsRes.status} ${reviewsRes.statusText}, ` +
          `Questions: ${questionsRes.status} ${questionsRes.statusText}`
        );
      }

      const reviewsData = await reviewsRes.json();
      const questionsData = await questionsRes.json();

      setReviews(reviewsData);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error fetching my content:', err);
      if (err instanceof Error) {
        setError(err.message || '내 활동 내역을 불러오는 데 실패했습니다.');
      } else {
        setError('내 활동 내역을 불러오는 데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/auth/login'); // Redirect if not logged in
      return;
    }

    fetchMyContent();
  }, [session, status, router, fetchMyContent]);

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditedReviewRating(review.rating);
    setEditedReviewComment(review.comment || '');
  };

  const handleSaveReview = async (reviewId: string) => {
    if (!editedReviewRating || editedReviewRating < 1 || editedReviewRating > 5) {
      alert('평점은 1점에서 5점 사이로 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: editedReviewRating,
          comment: editedReviewComment,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update review');
      }

      alert('리뷰가 성공적으로 수정되었습니다.');
      setEditingReviewId(null);
      fetchMyContent(); // Re-fetch content to update the list
    } catch (err) {
      console.error('Error saving review:', err);
      if (err instanceof Error) {
        setError(err.message || '리뷰 수정에 실패했습니다.');
      } else {
        setError('리뷰 수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete review');
      }

      alert('리뷰가 성공적으로 삭제되었습니다.');
      fetchMyContent(); // Re-fetch content to update the list
    } catch (err) {
      console.error('Error deleting review:', err);
      if (err instanceof Error) {
        setError(err.message || '리뷰 삭제에 실패했습니다.');
      } else {
        setError('리뷰 삭제에 실패했습니다.');
      }
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditedQuestionText(question.questionText);
  };

  const handleSaveQuestion = async (questionId: string) => {
    if (!editedQuestionText.trim()) {
      alert('문의 내용을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: editedQuestionText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update question');
      }

      alert('문의가 성공적으로 수정되었습니다.');
      setEditingQuestionId(null);
      fetchMyContent(); // Re-fetch content to update the list
    } catch (err) {
      console.error('Error saving question:', err);
      if (err instanceof Error) {
        setError(err.message || '문의 수정에 실패했습니다.');
      } else {
        setError('문의 수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('정말로 이 문의를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete question');
      }

      alert('문의가 성공적으로 삭제되었습니다.');
      fetchMyContent(); // Re-fetch content to update the list
    } catch (err) {
      console.error('Error deleting question:', err);
      if (err instanceof Error) {
        setError(err.message || '문의 삭제에 실패했습니다.');
      } else {
        setError('문의 삭제에 실패했습니다.');
      }
    }
  };


  if (status === 'loading' || loading) {
    return <div className="text-center text-xl mt-8">내 활동 내역을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center text-xl mt-8 text-red-500">{error}</div>;
  }

  if (!session || !session.user) {
    return <div className="text-center text-xl mt-8 text-red-500">로그인이 필요합니다.</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">내 활동 내역</h1>
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
          <li className="mr-2" role="presentation">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('reviews')}
              role="tab"
              aria-controls="reviews"
              aria-selected={activeTab === 'reviews'}
            >
              내 리뷰 ({reviews.length})
            </button>
          </li>
          <li className="mr-2" role="presentation">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'questions' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('questions')}
              role="tab"
              aria-controls="questions"
              aria-selected={activeTab === 'questions'}
            >
              내 문의 ({questions.length})
            </button>
          </li>
        </ul>
      </div>
      <div id="my-content-tab-content">
        {activeTab === 'reviews' && (
          <div role="tabpanel" aria-labelledby="reviews-tab">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-600">작성한 리뷰가 없습니다.</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-lg shadow-lg p-6 flex items-start space-x-4">
                    <Link href={`/products/${review.product.id}`} >
                      <Image
                        src={review.product.images[0]?.url || '/placeholder.png'}
                        alt={review.product.name}
                        width={96}
                        height={96}
                        className="object-cover rounded-md flex-shrink-0"
                      />
                    </Link>
                    <div className="flex-grow">
                      <Link
                        href={`/products/${review.product.id}`}
                        className="text-lg font-semibold text-primary hover:underline"
                        >
                        {review.product.name}
                      </Link>
                      <p className="text-sm text-gray-500 mb-2">{new Date(review.createdAt).toLocaleDateString()}</p>

                      {editingReviewId === review.id ? (
                        <div className="space-y-2">
                          <div>
                            <label htmlFor={`rating-${review.id}`} className="block text-sm font-medium text-foreground mb-1">평점:</label>
                            <input
                              type="number"
                              id={`rating-${review.id}`}
                              min="1"
                              max="5"
                              value={editedReviewRating}
                              onChange={(e) => setEditedReviewRating(e.target.value === '' ? '' : parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label htmlFor={`comment-${review.id}`} className="block text-sm font-medium text-foreground mb-1">내용:</label>
                            <textarea
                              id={`comment-${review.id}`}
                              rows={3}
                              value={editedReviewComment}
                              onChange={(e) => setEditedReviewComment(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md"
                            ></textarea>
                          </div>
                          <div className="flex space-x-2">
                            <Button onClick={() => handleSaveReview(review.id)} size="sm">저장</Button>
                            <Button onClick={() => setEditingReviewId(null)} size="sm" variant="outline">취소</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-yellow-500 mb-1">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          <p className="text-foreground mb-2">{review.comment}</p>
                          <div className="flex space-x-2">
                            <Button onClick={() => handleEditReview(review)} size="sm" variant="outline">수정</Button>
                            <Button onClick={() => handleDeleteReview(review.id)} size="sm" variant="secondary">삭제</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div role="tabpanel" aria-labelledby="questions-tab">
            {questions.length === 0 ? (
              <p className="text-center text-gray-600">작성한 문의가 없습니다.</p>
            ) : (
              <div className="space-y-6">
                {questions.map((question) => (
                  <div key={question.id} className="bg-card rounded-lg shadow-lg p-6 flex items-start space-x-4">
                    <Link href={`/products/${question.product.id}`} >
                      <Image
                        src={question.product.images[0]?.url || '/placeholder.png'}
                        alt={question.product.name}
                        width={96}
                        height={96}
                        className="object-cover rounded-md flex-shrink-0"
                      />
                    </Link>
                    <div className="flex-grow">
                      <Link
                        href={`/products/${question.product.id}`}
                        className="text-lg font-semibold text-primary hover:underline"
                        >
                        {question.product.name}
                      </Link>
                      <p className="text-sm text-gray-500 mb-2">{new Date(question.createdAt).toLocaleDateString()}</p>

                      {editingQuestionId === question.id ? (
                        <div className="space-y-2">
                          <div>
                            <label htmlFor={`questionText-${question.id}`} className="block text-sm font-medium text-foreground mb-1">문의 내용:</label>
                            <textarea
                              id={`questionText-${question.id}`}
                              rows={3}
                              value={editedQuestionText}
                              onChange={(e) => setEditedQuestionText(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md"
                            ></textarea>
                          </div>
                          <div className="flex space-x-2">
                            <Button onClick={() => handleSaveQuestion(question.id)} size="sm">저장</Button>
                            <Button onClick={() => setEditingQuestionId(null)} size="sm" variant="outline">취소</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-foreground mb-2">Q. {question.questionText}</p>
                          {question.answers && question.answers.length > 0 && (
                            <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                              {question.answers.map((answer) => (
                                <div key={answer.id} className="bg-gray-50 p-3 rounded-md">
                                  <p className="text-sm font-semibold text-gray-700">A. {answer.answerText}</p>
                                  <p className="text-xs text-gray-500">
                                    답변자: 관리자 | {new Date(answer.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex space-x-2 mt-2">
                            <Button onClick={() => handleEditQuestion(question)} size="sm" variant="outline">수정</Button>
                            <Button onClick={() => handleDeleteQuestion(question.id)} size="sm" variant="secondary">삭제</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}