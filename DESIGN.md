# PGG 设计系统

## 设计理念

**简洁、专注、高效**

PGG是一个德语学习工具，设计应服务于学习目标，而非分散注意力。界面应当：
- 减少视觉噪音，突出内容
- 清晰的层次结构，引导用户视线
- 一致的交互模式，降低认知负担

## 色彩系统

### CSS变量定义

所有颜色通过CSS变量定义，支持自动深色模式切换。

```css
:root {
  --background: #fafafa;      /* 页面背景 - 微灰，减轻眼睛疲劳 */
  --foreground: #171717;      /* 主文本 */
  --card-bg: #ffffff;         /* 卡片背景 */
  --card-border: #e5e7eb;     /* 边框颜色 */
  --text-primary: #111827;    /* 主要文本 */
  --text-secondary: #6b7280;  /* 次要文本 */
  --accent-color: #3730a3;    /* 品牌主色 - 靛蓝 */
  --accent-text: #ffffff;     /* 品牌色上的文字 */
  --success-bg: #f0fdf4;
  --success-text: #15803d;
  --error-bg: #fef2f2;
  --error-text: #b91c1c;
  --warning-bg: #fffbeb;
  --warning-text: #92400e;
  --info-bg: #eff6ff;
  --info-text: #1d4ed8;
}
```

### 使用规范

**背景色**
- 页面背景：`var(--background)`
- 卡片/面板背景：`var(--card-bg)`
- 悬停背景：`var(--background)` 或 `opacity` 变化

**文字色**
- 主要文本：`var(--text-primary)`
- 次要文本：`var(--text-secondary)`
- 链接/按钮：`var(--accent-color)`

**强调色**
- 主按钮背景：`var(--accent-color)`
- 主按钮文字：`var(--accent-text)`
- 链接、高亮：`var(--accent-color)`

**语义色**
- 成功：`var(--success-bg)` + `var(--success-text)`
- 错误：`var(--error-bg)` + `var(--error-text)`
- 警告：`var(--warning-bg)` + `var(--warning-text)`
- 信息：`var(--info-bg)` + `var(--info-text)`

## 间距系统

### 基础单位

基于4px网格系统：

| 名称 | 值 | 用途 |
|------|-----|------|
| `space-1` | 4px | 图标间隙、紧凑内联间距 |
| `space-2` | 8px | 小间隙、行内元素间距 |
| `space-3` | 12px | 中等间隙 |
| `space-4` | 16px | 标准卡片内边距 |
| `space-5` | 20px | 大间隙、面板间距 |
| `space-6` | 24px | 区块间距 |
| `space-8` | 32px | 大区块间距 |

### 布局规范

**页面布局**
- 最大宽度：`max-w-5xl` (1024px)
- 页面内边距：`p-4 lg:p-6`
- 区块间距：`space-y-4 lg:space-y-5`

**卡片/面板**
- 内边距：`p-4` 或 `p-5`
- 圆角：`rounded-xl`
- 边框：`border border-[var(--card-border)]`

## 排版系统

### 字体栈

```css
font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

### 字号规范

| 级别 | Tailwind类 | 用途 |
|------|-----------|------|
| 标题1 | `text-2xl font-bold` | 页面主标题、统计数据 |
| 标题2 | `text-lg font-semibold` | 卡片标题、区块标题 |
| 正文 | `text-sm` | 主要内容 |
| 小字 | `text-xs` | 标签、辅助信息 |

### 行高

- 正文：`leading-relaxed` (1.625)
- 紧凑文本：`leading-snug` (1.375)

## 组件规范

### 按钮

**主按钮**
```
px-5 py-2 rounded-md text-sm font-medium
bg-[var(--accent-color)] text-[var(--accent-text)]
hover:opacity-90
focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none
```

**次要按钮**
```
px-5 py-2 rounded-md text-sm font-medium
border border-[var(--card-border)]
bg-[var(--card-bg)] text-[var(--text-primary)]
hover:bg-[var(--background)]
```

**禁用状态**
```
disabled:bg-gray-300 disabled:cursor-not-allowed
```

### 卡片/面板

**标准面板**
```
bg-[var(--card-bg)]
border border-[var(--card-border)]
rounded-xl
p-4 lg:p-5
```

**任务项（简化版）**
```
border-b border-[var(--card-border)]
py-4
last:border-b-0
```

### 标签

**状态标签**
```
text-xs px-2 py-1 rounded
bg-[var(--accent-color)]/10
border border-[var(--accent-color)]/30
text-[var(--accent-color)]
```

**分类标签**
```
text-xs px-2 py-1 rounded
bg-[var(--background)]
border border-[var(--card-border)]
text-[var(--text-secondary)]
```

### 表单元素

**输入框**
```
w-full px-3 py-2 rounded-lg
border border-[var(--card-border)]
bg-[var(--card-bg)]
text-[var(--text-primary)]
placeholder:text-[var(--text-secondary)]
focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]
```

## 设计原则

### 1. 减法优先

- 每个元素都要证明其存在的必要性
- 优先移除而非添加
- 留白是设计的一部分

### 2. 层次清晰

- 通过字体大小、颜色深浅、间距建立视觉层次
- 重要信息突出，次要信息弱化
- 避免所有元素同等强调

### 3. 一致性

- 所有组件使用统一的CSS变量
- 相同的交互模式，相同的视觉反馈
- 颜色、间距、圆角保持一致

### 4. 内容为王

- 界面服务于内容，而非相反
- 减少装饰性元素
- 让用户聚焦于学习任务

## 反模式（避免）

❌ **卡片套卡片** - 避免多层嵌套的圆角容器
❌ **过度装饰** - 避免阴影、渐变、动画过度使用
❌ **颜色过多** - 限制使用主色、强调色、语义色
❌ **信息密度过高** - 留出足够的呼吸空间
❌ **不一致的圆角** - 统一使用`rounded-xl`

## 响应式断点

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px（主要断点，切换导航模式）
- `xl`: 1280px

## 无障碍

- 所有交互元素最小尺寸：44×44px
- 颜色对比度符合WCAG AA标准
- 键盘可访问：focus状态清晰可见
- 支持prefers-reduced-motion
