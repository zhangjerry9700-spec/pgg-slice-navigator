# Supabase 项目设置指南

本指南帮助您创建和配置 PGG 项目所需的 Supabase 后端服务。

## 1. 创建 Supabase 项目

### 步骤
1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `pgg-learning` (或您喜欢的名称)
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离您用户最近的区域（如 `East Asia (Tokyo)`）
4. 等待项目创建完成（约 1-2 分钟）

## 2. 配置数据库 Schema

### 步骤
1. 进入项目 Dashboard
2. 点击左侧菜单 **SQL Editor**
3. 点击 **New query**
4. 复制 `sql/schema.sql` 文件的全部内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行

### 验证
执行后应看到以下成功信息：
```
Success. No rows returned
```

## 3. 启用 Storage（用户头像）

### 步骤
1. 点击左侧菜单 **Storage**
2. 点击 **New bucket**
3. 创建以下 bucket：
   - **Name**: `avatars`
   - **Public**: ✅ 勾选（允许公开访问头像）

### 配置上传策略
1. 进入 `avatars` bucket
2. 点击 **Policies** 标签
3. 添加以下策略：

**上传策略**（用户只能上传自己的头像）：
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**读取策略**（公开访问）：
```sql
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## 4. 配置 Auth 设置

### 邮件模板（可选）
1. 点击左侧菜单 **Authentication** > **Email Templates**
2. 可以自定义确认邮件和重置密码邮件的样式

### 认证方式
1. 点击 **Providers**
2. 确保 **Email** 已启用
3. （可选）启用 **WeChat** OAuth（需要微信开放平台配置）

## 5. 获取 API 密钥

### 步骤
1. 点击左侧菜单 **Project Settings**（齿轮图标）
2. 点击 **API** 标签
3. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 保密！）

### 配置本地环境
1. 复制 `.env.local.example` 为 `.env.local`
2. 填入上述获取的值

## 6. 配置内容运营团队权限

### 创建内容管理员角色

1. 打开 **SQL Editor**
2. 执行以下 SQL：

```sql
-- 添加角色字段到用户扩展表
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 创建第一个内容管理员（替换为实际用户 ID）
UPDATE user_profiles
SET role = 'content_admin'
WHERE id = '用户-UUID-这里';
```

### 邀请内容团队成员
1. 在 **Authentication** > **Users** 中邀请团队成员注册
2. 通过 SQL 将他们的角色设置为 `content_admin`

## 7. 验证配置

### 测试 RLS 策略
1. 在 **Table Editor** 中查看各表
2. 确认 RLS 已启用（表名旁有盾牌图标）
3. 尝试用不同用户身份查询数据，验证隔离性

### 测试 Storage
1. 上传测试图片到 `avatars` bucket
2. 确认可以通过公开 URL 访问

## 8. 生产环境 checklist

- [ ] 启用 **Database backups**（自动每日备份）
- [ ] 配置 **Usage alerts**（用量告警）
- [ ] 设置 **Custom domain**（自定义域名，可选）
- [ ] 配置 **Sentry** 错误监控
- [ ] 测试数据库 **Point-in-time recovery**

## 故障排查

### 问题：RLS 策略导致查询无结果
**解决**：检查是否已登录，且 JWT token 正确传递

### 问题：Storage 上传失败 403
**解决**：检查 bucket policies 是否已创建，且用户已认证

### 问题：Schema 执行报错
**解决**：确保按顺序执行：先创建表，再启用 RLS，最后创建策略

## 参考链接

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
