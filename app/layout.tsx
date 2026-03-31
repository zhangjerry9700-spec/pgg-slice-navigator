import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PGG 真题切片导航器',
  description: '德语专业四级备考的自适应学习平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
