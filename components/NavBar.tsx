'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '今日任务' },
  { href: '/practice', label: '真题练习' },
  { href: '/analysis', label: '薄弱点分析' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 border-b border-gray-200 pb-3 mb-5" aria-label="主导航">
      <div className="text-sm font-semibold text-indigo-800 mr-2">PGG</div>
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'text-sm font-medium transition-colors py-1',
              active
                ? 'text-indigo-800 border-b-2 border-indigo-800'
                : 'text-gray-600 hover:text-gray-900',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
