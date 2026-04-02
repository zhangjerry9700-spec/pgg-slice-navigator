/**
 * 登录/注册页面
 * 桌面端：左右分栏布局（40% 品牌视觉，60% 表单）
 * 移动端：全屏表单
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// 表单类型：登录 | 注册 | 重置密码
type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuth();

  // 切换模式时清空表单
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsSuccess(false);
    clearError();
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        return; // 错误状态由 UI 显示
      }
      const { error } = await signUp(email, password);
      if (!error) {
        setIsSuccess(true);
      }
    } else if (mode === 'signin') {
      await signIn(email, password);
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (!error) {
        setIsSuccess(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* 左侧品牌区 - 桌面端显示 */}
      <div className="hidden lg:flex lg:w-[40%] bg-[var(--accent-color)] flex-col justify-center items-center px-12 text-[var(--accent-text)]">
        <div className="max-w-sm">
          {/* Logo */}
          <div className="text-5xl font-bold mb-4">PGG</div>

          {/* 副标题 */}
          <h2 className="text-xl font-medium mb-2 opacity-90">
            德语专四备考助手
          </h2>

          {/* 核心价值 */}
          <p className="text-sm opacity-75">
            记录每一步进步，让备考更高效
          </p>

          {/* 装饰性统计（可选） */}
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">200+</div>
              <div className="text-xs opacity-75 mt-1">真题精选</div>
            </div>
            <div>
              <div className="text-3xl font-bold">11</div>
              <div className="text-xs opacity-75 mt-1">语法主题</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* 移动端 Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="text-3xl font-bold text-[var(--accent-color)] mb-2">PGG</div>
            <p className="text-sm text-[var(--text-secondary)]">德语专四备考助手</p>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {mode === 'signin' && '继续你的德语专四备考之旅'}
            {mode === 'signup' && '开始你的备考之路'}
            {mode === 'forgot' && '重置密码'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            {mode === 'signin' && '登录以同步你的学习进度'}
            {mode === 'signup' && '创建账户，记录每一步进步'}
            {mode === 'forgot' && '输入邮箱接收重置链接'}
          </p>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱输入 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all"
                aria-label="邮箱地址"
              />
            </div>

            {/* 密码输入（登录/注册） */}
            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? '至少 6 位字符' : '输入密码'}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all"
                  aria-label="密码"
                />
              </div>
            )}

            {/* 确认密码（仅注册） */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all"
                  aria-label="确认密码"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">两次输入的密码不一致</p>
                )}
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* 成功提示 */}
            {isSuccess && (
              <div
                className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm"
                role="status"
                aria-live="polite"
              >
                {mode === 'signup'
                  ? '注册成功！请检查邮箱确认账户。'
                  : '重置链接已发送，请检查邮箱。'}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading || (mode === 'signup' && password !== confirmPassword)}
              className="w-full py-3 px-4 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
              aria-label={
                mode === 'signin' ? '登录' : mode === 'signup' ? '创建账户' : '发送重置链接'
              }
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
                  {mode === 'signin' && '登录中...'}
                  {mode === 'signup' && '创建账户中...'}
                  {mode === 'forgot' && '发送中...'}
                </span>
              ) : (
                <>
                  {mode === 'signin' && '开始学习'}
                  {mode === 'signup' && '创建账户'}
                  {mode === 'forgot' && '发送重置链接'}
                </>
              )}
            </button>
          </form>

          {/* 辅助链接 */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => switchMode('forgot')}
                  className="text-[var(--accent-color)] hover:underline"
                  type="button"
                >
                  忘记密码？
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className="text-[var(--accent-color)] hover:underline"
                  type="button"
                >
                  创建账户
                </button>
              </>
            )}
            {(mode === 'signup' || mode === 'forgot') && (
              <button
                onClick={() => switchMode('signin')}
                className="text-[var(--accent-color)] hover:underline"
                type="button"
              >
                已有账户？登录
              </button>
            )}
          </div>

          {/* 游客模式入口 */}
          <div className="mt-8 pt-6 border-t border-[var(--card-border)] text-center">
            <Link
              href="/"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              暂不登录，继续使用游客模式 →
            </Link>
          </div>

          {/* 社交登录（预留） */}
          {/*
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--card-border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--background)] text-[var(--text-secondary)]">
                  或使用以下方式
                </span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                使用微信登录
              </button>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
