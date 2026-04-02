'use client';

import { Suspense, lazy, ComponentType, ReactNode } from 'react';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 懒加载包装组件 - 用于代码分割和按需加载
 * @param importFn 动态导入函数
 * @returns 懒加载的组件
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}

/**
 * 加载状态组件
 */
export function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-4 bg-[var(--card-border)] rounded w-3/4" />
      <div className="h-4 bg-[var(--card-border)] rounded w-1/2" />
      <div className="h-20 bg-[var(--card-border)] rounded" />
    </div>
  );
}

/**
 * 卡片加载骨架屏
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 animate-pulse"
        >
          <div className="h-4 bg-[var(--card-border)] rounded w-1/4 mb-3" />
          <div className="h-6 bg-[var(--card-border)] rounded w-3/4 mb-4" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-[var(--card-border)] rounded" />
            <div className="h-8 bg-[var(--card-border)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 带 Suspense 的懒加载包装器
 */
export function LazyComponent({
  children,
  fallback = <LoadingFallback />,
}: LazyComponentProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
