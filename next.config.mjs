/** @type {import('next').NextConfig} */
const nextConfig = {
  // 注意：移除了 output: 'export' 以支持 Supabase Auth Middleware
  // 项目使用服务器端渲染，部署到 Vercel
};

export default nextConfig;
