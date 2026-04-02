/**
 * 管理员权限守卫组件
 * 检查当前用户是否为内容管理员
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getContentRepository } from '@/lib/repositories/ContentRepository';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const repo = getContentRepository();
        const hasAccess = await repo.isContentAdmin();

        if (!hasAccess) {
          router.push('/auth?redirect=/admin');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('权限检查失败:', error);
        router.push('/auth?redirect=/admin');
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">检查权限中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // 会被重定向
  }

  return <>{children}</>;
}
