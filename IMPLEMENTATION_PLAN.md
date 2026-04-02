# PGG Phase 1 实施计划：Supabase 集成与用户系统

**状态**: 待审批
**预计工期**: 2 周
**生成时间**: 2026-03-31
**基于设计**: `claude-master-design-20250331-170000.md`

---

## 1. 执行摘要

本计划实现 PGG 从纯前端应用到云端服务的转型（Phase 1）。核心目标是：
1. 集成 Supabase 后端（PostgreSQL + Auth + Storage）
2. 实现用户注册/登录系统
3. 完成匿名用户数据迁移机制
4. 云端化自适应推荐算法

**关键决策**: 采用双 ID 系统（anonymous_id + user_id）确保游客模式与注册用户的无缝切换。

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   /auth      │  │   /practice  │  │   /analysis  │        │
│  │  登录/注册    │  │   练习页面    │  │   数据分析    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐         │
│  │         Repository Pattern 抽象层                │         │
│  │  ┌────────────────┐  ┌────────────────────┐     │         │
│  │  │LocalStorageRepo│  │  SupabaseRepository │     │         │
│  │  │   (现有复用)    │  │     (新增)          │     │         │
│  │  └────────────────┘  └────────────────────┘     │         │
│  └────────────────────────┬────────────────────────┘         │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼ HTTPS + Row Level Security
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Cloud                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │  Auth (JWT)  │  │    Storage   │        │
│  │   用户数据    │  │  认证服务     │  │   用户头像    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据库 Schema

```sql
-- 用户表（由 Supabase Auth 自动生成）
-- auth.users (id UUID PRIMARY KEY, email, ...)

-- 用户扩展信息表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT UNIQUE, -- 游客 ID，注册后关联
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户答题记录表
CREATE TABLE user_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  selected_option INTEGER,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP DEFAULT NOW()
);

-- 用户掌握度统计表
CREATE TABLE user_mastery (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grammar_topic TEXT NOT NULL,
  mastery_level DECIMAL(5,2), -- 0-100
  total_answered INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, grammar_topic)
);

-- 错题本表
CREATE TABLE user_mistakes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  mistake_count INTEGER DEFAULT 1,
  last_mistake_at TIMESTAMP DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, question_id)
);

-- 学习历史表（每日统计）
CREATE TABLE learning_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- RLS 策略示例（用户只能访问自己的数据）
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_answers_own_data ON user_answers
  FOR ALL USING (user_id = auth.uid());
```

### 2.3 Repository 模式实现

```typescript
// lib/repositories/types.ts
export interface IUserRepository {
  // 用户数据
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>;

  // 答题记录
  saveAnswer(userId: string, answer: UserAnswer): Promise<void>;
  getAnswers(userId: string, filters?: AnswerFilters): Promise<UserAnswer[]>;

  // 掌握度
  getMastery(userId: string): Promise<UserMastery[]>;
  updateMastery(userId: string, topic: string, data: Partial<MasteryData>): Promise<void>;

  // 错题本
  addMistake(userId: string, questionId: number): Promise<void>;
  removeMistake(userId: string, questionId: number): Promise<void>;
  getMistakes(userId: string): Promise<number[]>;

  // 学习历史
  getLearningHistory(userId: string, days: number): Promise<LearningHistory[]>;
  updateDailyStats(userId: string, date: string, stats: DailyStats): Promise<void>;
}

// lib/repositories/LocalStorageRepository.ts
// 复用现有逻辑，包装为 Repository 接口

// lib/repositories/SupabaseRepository.ts
// 新建：通过 Supabase Client 实现上述接口

// lib/repositories/RepositoryFactory.ts
// 根据登录状态返回对应实现
export function getRepository(): IUserRepository {
  const session = getCurrentSession();
  return session ? new SupabaseRepository() : new LocalStorageRepository();
}
```

---

## 3. 任务分解与工期

### Week 1: 基础设施与认证

#### Day 1-2: Supabase 项目初始化
- [ ] 创建 Supabase 项目
- [ ] 配置数据库 Schema（执行上述 SQL）
- [ ] 启用 RLS 策略
- [ ] 创建 Storage bucket（avatars）
- [ ] 配置环境变量模板

**交付物**: `SUPABASE_SETUP.md` + `.env.local.example`

#### Day 3: Auth 系统实现
- [ ] 安装 `@supabase/supabase-js`
- [ ] 创建 `lib/supabase/client.ts`（Browser Client）
- [ ] 创建 `lib/supabase/server.ts`（Server Client - 如需 SSR）
- [ ] 实现 `/auth` 页面（登录/注册切换）
  - 桌面：左右分栏布局（40/60）
  - 移动：全屏表单
- [ ] 实现邮箱/密码注册
- [ ] 实现邮箱/密码登录
- [ ] 实现密码重置流程

**交付物**: `/auth` 页面 + Auth Hook

#### Day 4: Repository 层重构
- [ ] 提取 `IUserRepository` 接口
- [ ] 包装现有 localStorage 逻辑为 `LocalStorageRepository`
- [ ] 实现 `SupabaseRepository`
- [ ] 实现 `RepositoryFactory`（根据登录状态自动切换）
- [ ] 编写 Repository 单元测试（mock Supabase）

**交付物**: `lib/repositories/*` + 测试文件

#### Day 5: 数据迁移功能
- [ ] 创建 `/migrate` 页面（或 Modal）
- [ ] 实现数据导出逻辑（localStorage → JSON）
- [ ] 实现批量导入逻辑（JSON → Supabase）
- [ ] 进度条组件（实时显示同步进度）
- [ ] 错误处理与重试机制
- [ ] 游客模式检测与提示

**交付物**: `/migrate` 页面 + 迁移 Hook

### Week 2: 云端化与部署

#### Day 6-7: useMastery Hook 重构
- [ ] 重写 `useMastery` 支持双数据源
- [ ] 实现云端掌握度计算
- [ ] 实现云端错题本同步
- [ ] 实现学习历史记录
- [ ] 处理离线/在线状态切换

**交付物**: 重构后的 `useMastery.ts` + 测试

#### Day 8: 云端推荐算法
- [ ] 将推荐逻辑从本地迁移到云端查询
- [ ] 实现薄弱点加权算法
- [ ] 实现难度递进算法
- [ ] 实现遗忘曲线复习提醒
- [ ] 创建推荐结果缓存机制

**交付物**: `lib/recommendation/cloudEngine.ts`

#### Day 9: 内容运营后台配置
- [ ] 配置 Supabase Dashboard 权限
- [ ] 创建 `content_admin` 角色
- [ ] 添加题目表管理视图
- [ ] （可选）创建极简 `/admin` 页面

**交付物**: 权限配置文档 +（可选）Admin 页面

#### Day 10: 测试与部署
- [ ] 多设备同步测试
- [ ] 数据迁移端到端测试
- [ ] 响应式布局测试
- [ ] 可访问性检查
- [ ] Vercel 部署验证
- [ ] 编写部署文档

**交付物**: 测试报告 + `DEPLOY.md`

---

## 4. 详细实现规范

### 4.1 页面路由设计

| 路由 | 功能 | 访问控制 |
|------|------|----------|
| `/auth` | 登录/注册 | 公开 |
| `/auth/reset-password` | 密码重置 | 公开（需 token） |
| `/migrate` | 数据迁移 | 需登录 |
| `/` (首页) | 学习仪表盘 | 公开（游客可访问） |
| `/practice` | 练习页面 | 公开（游客模式） |
| `/analysis` | 数据分析 | 公开（游客模式） |
| `/admin` | 内容管理 | 需 content_admin 角色 |

### 4.2 状态管理策略

```typescript
// 全局状态：认证状态
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  // ...
}));

// 本地状态：答题进度（保持现有逻辑）
// 云端状态：通过 Repository 抽象层自动同步
```

### 4.3 错误处理策略

| 错误类型 | 处理方式 | 用户提示 |
|----------|----------|----------|
| 网络断开 | 保存本地，待恢复后同步 | "已保存本地，联网后自动同步" |
| 认证过期 | 跳转登录页 | "登录已过期，请重新登录" |
| 数据冲突 | 弹窗让用户选择版本 | "检测到数据冲突，请选择保留版本" |
| 服务器错误 | 重试 3 次后报错 | "服务器繁忙，请稍后重试" |

---

## 5. 测试计划

### 5.1 单元测试覆盖

```
测试目标: 18 个路径（来自 Eng Review）

[★★★] 认证流程
  ├── 注册成功
  ├── 注册失败（邮箱已存在）
  ├── 登录成功
  ├── 登录失败（密码错误）
  └── 密码重置流程

[★★★] 数据迁移
  ├── 本地数据读取
  ├── 云端批量写入
  ├── 进度计算
  └── 错误重试

[★★☆] Repository 层
  ├── LocalStorageRepository 操作
  ├── SupabaseRepository 操作
  └── Factory 自动切换逻辑

[★☆☆] 推荐算法
  ├── 薄弱点计算
  ├── 难度递进
  └── 遗忘曲线
```

### 5.2 E2E 测试场景

1. **新用户完整流程**: 注册 → 数据迁移 → 答题 → 查看统计
2. **老用户迁移**: 游客答题 → 注册 → 数据导入 → 验证同步
3. **多设备同步**: 设备 A 答题 → 设备 B 登录 → 验证数据一致
4. **离线模式**: 断网答题 → 恢复网络 → 自动同步

### 5.3 性能测试

- 数据迁移: 1000 条答题记录应在 5 秒内完成
- 页面加载: `/auth` 首屏 < 1.5s (3G 网络)
- API 响应: P95 < 500ms

---

## 6. 风险与缓解

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|----------|
| Supabase 免费额度不足 | 中 | 高 | 监控使用量，提前设置告警；准备升级方案 |
| 数据迁移失败 | 低 | 高 | 保留本地备份；提供手动重试入口 |
| 用户抗拒注册 | 中 | 中 | 保留游客模式；强调注册价值（多设备同步） |
| RLS 配置错误导致数据泄露 | 低 | 极高 | 部署前审计；使用测试账号验证隔离性 |
| 推荐算法效果下降 | 中 | 中 | A/B 测试对比；保留本地算法作为 fallback |

---

## 7. 部署检查清单

### 部署前
- [ ] 所有环境变量已配置（Vercel + 本地）
- [ ] RLS 策略已启用并测试
- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 设计审查完成（无 AI Slop）

### 部署中
- [ ] 数据库迁移脚本已运行
- [ ] 功能开关（Feature Flag）已配置
- [ ] 监控告警已启用

### 部署后
- [ ]  smoke test 通过
- [ ] 注册流程验证
- [ ] 数据迁移验证
- [ ] 错误日志检查（无异常）

---

## 8. 成功标准检查

参照设计文档 Success Criteria:

| 标准 | 检查方式 | 状态 |
|------|----------|------|
| 支持邮箱注册登录 | E2E 测试 | ⬜ |
| 用户数据云端存储 | 单元测试 + 人工验证 | ⬜ |
| 多设备同步 | 双浏览器测试 | ⬜ |
| 内容运营团队可管理题目 | Supabase Dashboard 权限验证 | ⬜ |
| 推荐算法云端化 | 效果对比测试 | ⬜ |

---

## 9. 决策审计追踪

<!-- AUTONOMOUS DECISION LOG -->

| # | 决策 | 原因 | 替代方案 |
|---|------|------|----------|
| 1 | 使用 Supabase 而非自建后端 | 快速验证 PMF，零运维负担 | 自建 Node.js 后端（成本高，延迟） |
| 2 | 双 ID 系统（anonymous_id + user_id） | 支持游客模式，降低注册阻力 | 强制注册（可能流失用户） |
| 3 | Repository 模式 | 解耦数据源，便于未来迁移 | 直接调用 Supabase（紧耦合） |
| 4 | 规则引擎而非 ML 推荐 | 复杂度与价值匹配，先验证核心假设 | 直接上 ML（过早优化） |
| 5 | 全量数据迁移而非增量 | 逻辑简单，减少边缘情况 | 增量同步（复杂，收益低） |

---

## 10. 下一步行动

1. **审批本计划** - 确认任务分解和工期
2. **创建 Supabase 项目** - 获取 API 密钥
3. **设置环境变量** - 配置 `.env.local`
4. **开始 Day 1 任务** - 数据库 Schema 初始化

---

**计划作者**: Claude Code (autoplan)
**审查状态**: ✅ CEO Review / ✅ Eng Review / ✅ Design Review
**预计人天**: 10 天
**CC 预估时间**: 2-3 小时
