/**
 * 题目审核页面
 * 内容管理员审核待处理的题目
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getContentRepository } from '@/lib/repositories/ContentRepository';
import type { PendingQuestion } from '@/lib/repositories/types';
import { QuestionReviewCard } from '@/components/QuestionReviewCard';

function QuestionReviewContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(statusParam);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const repo = getContentRepository();
      const result = await repo.getPendingQuestions({
        status: status || undefined,
        limit: perPage,
        offset: (page - 1) * perPage,
      });
      setQuestions(result.questions);
      setTotal(result.total);
    } catch (error) {
      console.error('加载题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [status, page]);

  const handleReview = async (id: number, approved: boolean, note?: string) => {
    try {
      const repo = getContentRepository();
      await repo.reviewPendingQuestion({
        id,
        status: approved ? 'approved' : 'rejected',
        reviewNote: note,
      });
      // 刷新列表
      loadQuestions();
    } catch (error) {
      console.error('审核失败:', error);
      alert('审核失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">题目审核</h2>
        <p className="text-gray-600">审核用户上传的题目，通过后加入正式题库</p>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2">
        {[
          { key: null, label: '全部' },
          { key: 'pending', label: '待审核' },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setStatus(tab.key as typeof status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition ${
              status === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">暂无题目</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionReviewCard
              key={q.id}
              question={q}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > perPage && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2">
            第 {page} 页，共 {Math.ceil(total / perPage)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * perPage >= total}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuestionReviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">加载中...</div>}>
      <QuestionReviewContent />
    </Suspense>
  );
}
