# PGG 项目部署指南

## 环境变量配置

### 开发环境 (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 生产环境 (Vercel Dashboard)
在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值来源 | 说明 |
|--------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings > API > Project URL | 生产环境 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings > API > anon public | 生产环境匿名密钥 |

## 部署步骤

### 1. 连接 Vercel 项目
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link
```

### 2. 配置生产环境 Supabase
1. 在 Supabase 创建新项目（Production）
2. 执行 `sql/schema.sql` 创建数据库
3. 创建 `avatars` Storage bucket
4. 复制 API URL 和 Anon Key 到 Vercel 环境变量

### 3. 首次部署
```bash
vercel --prod
```

### 4. 自动部署
推送代码到 `main` 分支会自动触发部署（通过 GitHub Actions）

## 域名配置（可选）

1. 在 Vercel Dashboard > Settings > Domains 添加自定义域名
2. 在 DNS 提供商添加 CNAME 记录指向 `cname.vercel-dns.com`

## 验证部署

1. 访问生产环境 URL
2. 测试注册/登录功能
3. 验证数据正确保存到生产 Supabase
4. 检查 Console 无错误

## 回滚

在 Vercel Dashboard > Deployments 中选择历史版本，点击 **Promote to Production**
