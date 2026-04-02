# AutoPGG 设计债务与待办清单

生成日期：2026-03-31

## 设计债务

### TODO-001: 创建独立的 DESIGN.md
- **What:** 从 `IMPLEMENTATION_PLAN.md` 中抽离出完整的设计系统规范，生成独立的 `DESIGN.md`。
- **Why:** 随着功能扩展，需要单一事实来源来防止视觉风格漂移。
- **Pros:** 统一配色、排版、组件使用规则；降低后续迭代的决策成本。
- **Cons:** 需要维护多一个文档。
- **建议时机:** MVP 功能稳定后（2-3 周后），运行 `/design-consultation` 自动生成。

### TODO-002: 重构现有组件中的过度卡片化
- **What:** 按照新设计系统规范，移除装饰性边框卡片，改为平铺排版层级。
- **Why:** 当前代码触发 AI Slop 的「App UI made of stacked cards」硬否定，削弱了产品的精致感和独特性。
- **Pros:** 界面更清爽、更高级；减少不必要的 DOM 嵌套；提升移动端体验。
- **Cons:** 需要小幅重构 NavBar、Analysis 页错题本列表、多个信息面板，有一定回归测试成本。
- **具体修改点:**
  1. `NavBar.tsx`：导航项从带边框按钮改为简洁 link/tab。
  2. `AnalysisPage` 错题本列表：用底部分隔线 `border-b` 替代每个条目的 rounded-lg 卡片。
  3. `HomePage` 右侧学习状态面板：内部子项去除二次套卡片，直接平铺。

## Week 2 任务清单

### ✅ TODO-003: 配置 Vercel 部署
- **状态:** 已完成
- **文件:** `vercel.json`, `.github/workflows/deploy.yml`, `DEPLOY.md`
- **What:** 配置 Vercel 项目，设置环境变量，部署生产版本
- **Why:** 将本地开发版本部署到线上，供用户访问

### ✅ TODO-004: 配置 Supabase Production 环境
- **状态:** 已完成
- **文件:** `scripts/setup-production.js`, `sql/seed-admin.sql`
- **What:** 创建 Supabase 生产项目，配置数据库迁移，设置 RLS 策略
- **Why:** 区分开发和生产环境，确保数据安全

### ✅ TODO-005: 实现自适应推荐引擎 V1
- **状态:** 已完成
- **文件:** `lib/recommendation/types.ts`, `lib/recommendation/engine.ts`
- **What:** 基于规则引擎实现题目推荐（弱项加权 + 难度递进 + 遗忘曲线）
- **Why:** 为用户提供个性化学习体验
- **算法策略:**
  - 弱项加权（掌握度 < 60% 优先）
  - 遗忘曲线（3天未练习增加权重）
  - 难度递进（根据掌握度推荐合适难度）
  - 错题优先（曾答错题目加权）
  - 多样性保证（避免连续相同主题）

### ✅ TODO-006: 内容管理后台 (CMS)
- **状态:** 已完成
- **文件:** `app/admin/`, `lib/repositories/ContentRepository.ts`, `components/QuestionReviewCard.tsx`, `components/AdminGuard.tsx`
- **What:** 创建题目上传、审核、修正的后台管理界面
- **Why:** 2-5 人内容团队需要管理真题和知识点
- **功能:**
  - 题目审核（通过/拒绝）
  - 审核意见填写
  - 审计日志查看
  - 权限管理（content_admin 角色）
