/**
 * 题目审核卡片组件
 * 展示待审核题目的详细信息和审核操作
 */

'use client';

import { useState } from 'react';
import type { PendingQuestion } from '@/lib/repositories/types';

interface QuestionReviewCardProps {
  question: PendingQuestion;
  onReview: (id: number, approved: boolean, note?: string) => void;
}

export function QuestionReviewCard({ question, onReview }: QuestionReviewCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onReview(question.id, true, reviewNote);
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!reviewNote.trim()) {
      alert('拒绝时请填写拒绝原因');
      return;
    }
    setIsSubmitting(true);
    await onReview(question.id, false, reviewNote);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 头部信息 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[question.status]}`}>
              {statusLabels[question.status]}
            </span>
            <span className="text-sm text-gray-500">{question.topic}</span>
            <span className="text-sm text-gray-500">难度: {question.difficulty}</span>
            {question.year && (
              <span className="text-sm text-gray-500">{question.year}年</span>
            )}
          </div>
          <p className="text-gray-900 font-medium">{question.content}</p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm ml-4"
        >
          {showDetails ? '收起' : '展开'}
        </button>
      </div>

      {/* 详情 */}
      {showDetails && (
        <div className="border-t pt-4 mt-4 space-y-4">
          {/* 选项（如果是选择题） */}
          {question.type === 'choice' && question.options && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">选项</h4>
              <div className="space-y-2">
                {question.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded ${
                      opt.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {opt.text}
                    {opt.isCorrect && (
                      <span className="ml-2 text-green-600 text-sm">✓ 正确答案</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 正确答案 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">正确答案</h4>
            <p className="text-gray-900 bg-gray-50 p-3 rounded">{question.correctAnswer}</p>
          </div>

          {/* 解析 */}
          {question.explanation && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">解析</h4>
              <p className="text-gray-600 bg-blue-50 p-3 rounded">{question.explanation}</p>
            </div>
          )}

          {/* 来源 */}
          {question.source && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">来源</h4>
              <p className="text-gray-600">{question.source}</p>
            </div>
          )}

          {/* 审核操作 */}
          {question.status === 'pending' && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">审核意见</h4>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="填写审核意见（拒绝时必须填写原因）"
                className="w-full p-3 border rounded-lg resize-none h-24"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? '处理中...' : '通过'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? '处理中...' : '拒绝'}
                </button>
              </div>
            </div>
          )}

          {/* 审核记录 */}
          {question.status !== 'pending' && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">审核记录</h4>
              <p className="text-sm text-gray-600">
                审核人: {question.reviewerId}
              </p>
              {question.reviewNote && (
                <p className="text-sm text-gray-600 mt-1">
                  审核意见: {question.reviewNote}
                </p>
              )}
              {question.reviewedAt && (
                <p className="text-sm text-gray-500 mt-1">
                  审核时间: {new Date(question.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
