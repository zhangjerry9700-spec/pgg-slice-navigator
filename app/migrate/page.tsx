'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function MigratePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // 直接跳转到首页，不再进行本地数据迁移
  useEffect(() => {
    if (authLoading) return;

    // 未登录用户重定向到登录页
    if (!user) {
      router.push('/auth');
      return;
    }

    // 已登录直接跳转到首页
    router.push('/');
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-[var(--text-secondary)]">正在跳转...</div>
    </div>
  );
}
