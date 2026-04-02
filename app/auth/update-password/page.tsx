/**
 * 更新密码页面
 * 用户通过邮箱链接跳转至此重置密码
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getBrowserClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const router = useRouter();
  const { updatePassword, isLoading, error, clearError } = useAuth();

  // 检查是否有有效的密码重置会话
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      // 密码重置链接会创建一个临时会话
      if (session) {
        setIsValidSession(true);
      }
      setIsChecking(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      return;
    }

    const { error } = await updatePassword(password);
    if (!error) {
      // 密码更新成功，跳转到首页
      router.push('/');
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">加载中...</div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">
            链接已过期
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            密码重置链接已过期或无效，请重新申请。
          </p>
          <a
            href="/auth"
            className="text-[var(--accent-color)] hover:underline"
          >
            返回登录页
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          设置新密码
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          请输入您的新密码
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              新密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位字符"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              确认新密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-sm text-red-500">两次输入的密码不一致</p>
            )}
          </div>

          {error && (
            <div
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || password !== confirmPassword || password.length < 6}
            className="w-full py-3 px-4 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? '更新中...' : '更新密码'}
          </button>
        </form>
      </div>
    </div>
  );
}
