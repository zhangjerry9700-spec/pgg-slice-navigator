/**
 * Supabase 浏览器端客户端
 * 用于 React 组件和客户端 Hook
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// 创建浏览器端 Supabase 客户端
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 单例客户端实例（复用连接）
let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
