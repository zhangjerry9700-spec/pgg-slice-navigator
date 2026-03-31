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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
