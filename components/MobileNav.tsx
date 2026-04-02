'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mobileNavItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/practice', label: '练习', icon: '✏️' },
  { href: '/search', label: '搜索', icon: '🔍' },
  { href: '/analysis', label: '分析', icon: '📊' },
  { href: '/profile', label: '我的', icon: '👤' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--card-border)] z-50 lg:hidden"
      aria-label="底部导航"
    >
      <div className="flex items-center justify-around py-2 pb-safe">
        {mobileNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors min-w-[44px] min-h-[44px]',
                active
                  ? 'text-[var(--accent-color)]'
                  : 'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
