/**
 * 全局 Provider 组件
 * 整合认证状态和业务逻辑
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMastery } from '@/hooks/useMastery';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 认证与数据管理 Provider
 * 自动根据登录状态切换数据存储后端
 */
export function MasteryProvider({ children }: ProvidersProps) {
  const { user } = useAuth();

  // 传递 userId 给 useMastery，自动切换 Repository
  useMastery(user?.id ?? null);

  // 将 mastery 数据注入到子组件
  // 这里可以通过 Context 提供，或者让子组件直接使用 useMastery
  return <>{children}</>;
}

/**
 * 根 Provider 组合
 */
export function RootProviders({ children }: ProvidersProps) {
  return (
    <MasteryProvider>
      {children}
    </MasteryProvider>
  );
}
