'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseChunkedLoadOptions <T>{
  items: T[];
  chunkSize?: number;
  initialChunks?: number;
}

interface UseChunkedLoadReturn<T> {
  visibleItems: T[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  totalCount: number;
}

/**
 * 分块加载 Hook - 用于大量数据的渐进式加载
 * @param options 配置选项
 * @returns 可见数据和控制方法
 */
export function useChunkedLoad<T>({
  items,
  chunkSize = 20,
  initialChunks = 1,
}: UseChunkedLoadOptions<T>): UseChunkedLoadReturn<T> {
  const [visibleCount, setVisibleCount] = useState(chunkSize * initialChunks);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  // 当源数据变化时重置
  useEffect(() => {
    setVisibleCount(chunkSize * initialChunks);
  }, [items.length, chunkSize, initialChunks]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const totalCount = items.length;

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    // 使用 requestAnimationFrame 优化性能
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + chunkSize, items.length));
      setIsLoading(false);
      loadingRef.current = false;
    });
  }, [chunkSize, hasMore, items.length]);

  return {
    visibleItems,
    hasMore,
    loadMore,
    isLoading,
    totalCount,
  };
}

/**
 * 虚拟列表 Hook - 用于超长列表的渲染优化
 * @param itemCount 项目总数
 * @param itemHeight 每项高度
 * @param containerHeight 容器高度
 * @returns 可见范围和控制方法
 */
export function useVirtualList({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleRange = {
    start: startIndex,
    end: endIndex,
  };

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    totalHeight,
    offsetY,
    onScroll,
    visibleCount,
  };
}
