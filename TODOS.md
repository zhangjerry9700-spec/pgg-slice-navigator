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
