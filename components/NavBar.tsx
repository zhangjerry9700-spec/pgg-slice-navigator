'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { getContentRepository } from '../lib/repositories/ContentRepository';

const navItems = [
  { href: '/', label: '今日任务' },
  { href: '/practice', label: '真题练习' },
  { href: '/search', label: '题目搜索' },
  { href: '/bookmarks', label: '我的收藏' },
  { href: '/analysis', label: '薄弱点分析' },
  { href: '/achievements', label: '成就' },
  { href: '/history', label: '学习历史' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // 检查用户是否为管理员
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const repo = getContentRepository();
          const hasAccess = await repo.isContentAdmin();
          setIsAdmin(hasAccess);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  return (
    <nav className="hidden lg:flex items-center gap-6 border-b border-[var(--card-border)] pb-3 mb-5" aria-label="主导航">
      <div className="text-sm font-semibold text-[var(--accent-color)] mr-2">PGG</div>
      <div className="flex-1 flex items-center gap-4 xl:gap-6 overflow-x-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'text-sm font-medium transition-colors py-1',
                active
                  ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={[
              'text-sm font-medium transition-colors py-1 px-2 rounded bg-amber-100 text-amber-800 hover:bg-amber-200',
              pathname.startsWith('/admin') ? 'ring-2 ring-amber-400' : '',
            ].join(' ')}
          >
            管理后台
          </Link>
        )}
      </div>
      {/* 主题切换按钮 */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-colors"
        title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      >
        {isDark ? (
          // 太阳图标（浅色模式）
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // 月亮图标（深色模式）
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 24.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* 用户状态 */}
      {!authLoading && (
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)] truncate max-w-[150px]">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm px-3 py-1.5 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90 transition-opacity"
              >
                退出
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="text-sm px-3 py-1.5 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90 transition-opacity"
            >
              登录
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
