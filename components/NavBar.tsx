'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { href: '/', label: '今日任务' },
  { href: '/practice', label: '真题练习' },
  { href: '/bookmarks', label: '我的收藏' },
  { href: '/analysis', label: '薄弱点分析' },
  { href: '/history', label: '学习历史' },
];

export default function NavBar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="flex items-center gap-6 border-b border-[var(--card-border)] pb-3 mb-5" aria-label="主导航">
      <div className="text-sm font-semibold text-[var(--accent-color)] mr-2">PGG</div>
      <div className="flex-1 flex items-center gap-6">
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
    </nav>
  );
}
