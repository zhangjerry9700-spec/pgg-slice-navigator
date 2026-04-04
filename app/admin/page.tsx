/**
 * 管理员后台登录界面
 * 集成的管理员登录 + 管理面板
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getContentRepository } from '@/lib/repositories/ContentRepository';

// 管理后台统计组件
function AdminDashboard() {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">管理后台</h2>
        <p className="text-gray-600">内容审核和题目管理</p>
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
        <div className="flex flex-wrap gap-4">
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

// 管理员登录表单
function AdminLoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { user, signIn, isLoading: authLoading } = useAuth();

  // 检查是否已是管理员
  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;

      if (user) {
        try {
          const repo = getContentRepository();
          const isAdmin = await repo.isContentAdmin();
          if (isAdmin) {
            onLogin();
          }
        } catch {
          // 不是管理员，显示登录表单
        }
      }
      setIsChecking(false);
    };

    checkAdmin();
  }, [user, authLoading, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 使用 Supabase 登录
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // 检查是否是管理员
      const repo = getContentRepository();
      const isAdmin = await repo.isContentAdmin();

      if (!isAdmin) {
        setError('您没有管理员权限');
        setIsLoading(false);
        return;
      }

      // 登录成功且是管理员
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[500px] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-blue-600 mb-4">PGG</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">管理后台登录</h1>
          <p className="text-gray-600">仅限授权管理员访问</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              管理员邮箱
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 密码输入 */}
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              密码
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                登录中...
              </span>
            ) : (
              '进入管理后台'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

// 主组件
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                PGG
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-lg font-semibold text-gray-800">
                {isAuthenticated ? '管理后台' : '管理员登录'}
              </h1>
            </div>
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/upload"
                  className="text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  上传题目
                </Link>
                <Link
                  href="/admin/questions"
                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  审核题目
                </Link>
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  返回首页
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          <AdminDashboard />
        ) : (
          <AdminLoginForm onLogin={() => setIsAuthenticated(true)} />
        )}
      </main>
    </div>
  );
}
