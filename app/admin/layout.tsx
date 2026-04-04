/**
 * 内容管理后台布局
 * 权限检查由各个 page 组件自行处理
 */

import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // 布局本身不处理权限，由 page 组件处理
  return <>{children}</>;
}
