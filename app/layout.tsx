import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileNav from '../components/MobileNav';

export const metadata: Metadata = {
  title: 'PGG 真题切片导航器',
  description: '德语专业四级备考的自适应学习平台',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-300 pb-16 lg:pb-0">
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
