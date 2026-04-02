/**
 * 内容管理后台首页
 * 展示概览统计
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContentRepository } from '@/lib/repositories/ContentRepository';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const repo = getContentRepository();

        const [pending, approved, rejected, total] = await Promise.all([
          repo.getPendingQuestions({ status: 'pending', limit: 1 }),
          repo.getPendingQuestions({ status: 'approved', limit: 1 }),
          repo.getPendingQuestions({ status: 'rejected', limit: 1 }),
          repo.getPendingQuestions({ limit: 1 }),
        ]);

        setStats({
          pendingCount: pending.total,
          approvedCount: approved.total,
          rejectedCount: rejected.total,
          totalCount: total.total,
        });
      } catch (error) {
        console.error('加载统计失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">概览</h2>
        <p className="text-gray-600">管理题目审核和内容运营</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {stats.pendingCount}
          </div>
          <div className="text-gray-600">待审核</div>
          <Link
            href="/admin/questions?status=pending"
            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
          >
            去审核 →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.approvedCount}
          </div>
          <div className="text-gray-600">已通过</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {stats.rejectedCount}
          </div>
          <div className="text-gray-600">已拒绝</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats.totalCount}
          </div>
          <div className="text-gray-600">总计</div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">快速操作</h3>
        <div className="flex gap-4">
          <Link
            href="/admin/upload"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            上传题目
          </Link>
          <Link
            href="/admin/questions"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            审核题目
          </Link>
          <Link
            href="/admin/audit"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            查看审计日志
          </Link>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">内容审核指南</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>所有人工上传的题目需要审核通过后才能进入正式题库</li>
          <li>审核时请检查题目内容、答案和解析的正确性</li>
          <li>确保题目分类和难度标注准确</li>
          <li>拒绝时请填写拒绝原因，方便上传者修改</li>
        </ul>
      </div>
    </div>
  );
}
