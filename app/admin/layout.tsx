/**
 * 内容管理后台布局
 * 仅内容管理员可访问
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/AdminGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold text-gray-900">内容管理后台</h1>
                <div className="flex gap-4">
                  <Link
                    href="/admin"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    概览
                  </Link>
                  <Link
                    href="/admin/upload"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    上传题目
                  </Link>
                  <Link
                    href="/admin/questions"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    题目审核
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    审计日志
                  </Link>
                </div>
              </div>
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                返回首页
              </Link>
            </div>
          </div>
        </nav>

        {/* 主内容 */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
