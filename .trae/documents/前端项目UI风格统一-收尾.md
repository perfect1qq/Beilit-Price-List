# 前端项目UI风格统一 — 收尾计划

## 概述

延续前一轮对话的工作，将前端项目剩余文件的UI风格对齐 CustomerManagement 的参考样式（10px 圆角、#e5e7eb 边框、shadow="never"、CardHeader 组件标题、无 emoji 标签）。

**不动文件**：CustomerManagement.vue、UserManagement.vue、Sidebar.vue、Navbar.vue、NavbarNotification.vue（框架级布局组件）

## 当前状态分析

前一轮已完成大部分文件的修改。经全面扫描，以下文件仍有旧样式残留：

### 扫描发现的问题清单

| 文件 | 问题 |
|------|------|
| QuotationStatistics.vue | CSS未更新：`.page`/`.panel` 12px圆角+box-shadow、`h1`样式残留、`h2`有border-left、native table样式残留 |
| Login.vue | `#hero-content` slot 模板块残留（AuthLayout已无此slot，属死代码） |
| Register.vue | 同上，`#hero-content` slot 模板块残留 |
| BeamQuotationEditor.vue | 无CardHeader、`.editor-card` 12px圆角+box-shadow+border:none |
| QuotationEditor.vue | `.inner-card` 8px圆角+#e2e8f0边框、`.section-title`有border-left、`.price-summary` #f8fafc背景 |
| QuotationHistory.vue | `.year-collapse > .el-collapse-item` 12px圆角+box-shadow+#f1f5f9边框 |
| MemoManagement.vue | `.date-count` 12px圆角 |
| MemoCard.vue | `.card` 14px圆角+#eef2f6边框 |
| InviteCodeCard.vue | `.invite-code-card` 12px圆角+box-shadow+border:none、`.invite-code-display` 渐变背景 |
| MemoEditorDrawer.vue | drawer标题含emoji：`✨ 开启新任务` / `📝 更新任务细节` |
| ErrorBoundary.vue | `.error-fallback` 12px圆角 |
| global.css | L130: `.el-card`等 14px圆角、L296: `.action-btns .el-button` 16px圆角 |

## 修改计划

### 步骤1：QuotationStatistics.vue — CSS收尾

文件：`src/views/QuotationStatistics.vue`（CSS区域，L238-L437）

- `.page`：`border-radius: 12px` → `10px`，删除 `box-shadow`，添加 `border: 1px solid #e5e7eb`
- `.panel`：`border-radius: 12px` → `10px`，删除 `box-shadow`
- 删除 `h1` 样式块（模板中h1已移除）
- `h2`：删除 `border-left: 4px solid #3b82f6` 和 `padding-left: 10px`
- 删除 `.table-wrap`、`table`、`th`、`td` 样式块（已替换为el-table）
- 媒体查询中：删除 `h1`、`table`、`th, td`、`.table-wrap` 相关规则，保留 `.page`/`.panel`/`h2`/`textarea` 规则
- 添加 `.page-card { border-radius: 10px; border: 1px solid #e5e7eb; }`

### 步骤2：Login.vue — 移除hero-content

文件：`src/views/Login.vue`

- 删除 `<template #hero-content>` 模板块（L6-L27），包含 h1、p、hero-badges
- 删除未使用的import：`DataLine, Grid`（保留 `Lock, User`）

### 步骤3：Register.vue — 移除hero-content

文件：`src/views/Register.vue`

- 删除 `<template #hero-content>` 模板块（L5-L22），包含 h1、p、hero-badges
- 删除未使用的import：`DataLine, Grid`（保留 `Lock, User, UserFilled, Key`）

### 步骤4：BeamQuotationEditor.vue — 添加CardHeader + CSS修复

文件：`src/components/beam/BeamQuotationEditor.vue`

该组件仅在 BeamQuotationHistory.vue 中作为详情/编辑视图使用。

模板修改：
- 在 `el-card` 内添加 `<template #header>` + `<CardHeader title="横梁载重单详情">`
- 将返回按钮和提交按钮移入 CardHeader 的 `#actions` slot
- 记录名称输入框保留在 card body 中

CSS修改：
- `.editor-card`：`border-radius: 12px` → `10px`，`border: none` → `1px solid #e5e7eb`，删除 `box-shadow`
- 删除 `.detail-toolbar` 中的按钮相关布局（按钮已移至header）

### 步骤5：QuotationEditor.vue — CSS修复

文件：`src/components/quotation/QuotationEditor.vue`

- `.inner-card`：`border-radius: 8px` → `10px`，`border: 1px solid #e2e8f0` → `#e5e7eb`
- `.section-title`：删除 `border-left: 4px solid #3b82f6` 和 `padding-left: 10px`
- `.price-summary`：`background: #f8fafc` → `#f5f7fa`，`border-radius: 6px` → `8px`

### 步骤6：QuotationHistory.vue — CSS修复

文件：`src/views/QuotationHistory.vue`

- `:deep(.year-collapse > .el-collapse-item)`：`border-radius: 12px` → `10px`，删除 `box-shadow`，`border: 1px solid #f1f5f9` → `#e5e7eb`

### 步骤7：MemoManagement.vue — CSS微调

文件：`src/views/MemoManagement.vue`

- `.date-count`：`border-radius: 12px` → `10px`

### 步骤8：MemoCard.vue — CSS修复

文件：`src/components/memo/MemoCard.vue`

- `.card`：`border-radius: 14px` → `10px`，`border: 1px solid #eef2f6` → `#e5e7eb`
- `.card:hover`：保留hover效果

### 步骤9：InviteCodeCard.vue — CSS修复

文件：`src/components/user/InviteCodeCard.vue`

- `.invite-code-card`：`border-radius: 12px` → `10px`，删除 `box-shadow`，`border: none` → `1px solid #e5e7eb`
- `.invite-code-display`：`border-radius: 12px` → `10px`，`background: linear-gradient(...)` → `#f5f7fa`，`border: 1px solid #c7d2fe` → `#e5e7eb`

### 步骤10：MemoEditorDrawer.vue — 移除emoji

文件：`src/components/memo/MemoEditorDrawer.vue`

- L3：`'✨ 开启新任务'` → `'开启新任务'`
- L3：`'📝 更新任务细节'` → `'更新任务细节'`

### 步骤11：ErrorBoundary.vue — CSS微调

文件：`src/components/common/ErrorBoundary.vue`

- `.error-fallback`：`border-radius: 12px` → `10px`

### 步骤12：global.css — 全局圆角统一

文件：`src/assets/styles/global.css`

- L130：`.el-card, .el-dialog, .el-dropdown-menu, .el-notification, .el-message` — `border-radius: 14px` → `10px`
- L296：`.action-btns .el-button` — `border-radius: 16px` → `10px`

### 步骤13：最终验证

- 运行 `npx vue-tsc --noEmit` 确认无TypeScript错误
- 检查 git diff 确认 CustomerManagement.vue 和 UserManagement.vue 未被修改
- 检查 Login.vue / Register.vue 无未使用import

## 假设与决策

1. **不动框架级布局组件**：Sidebar.vue、Navbar.vue、NavbarNotification.vue 保持不变（前一轮已决定）
2. **BeamQuotationEditor 添加CardHeader**：该组件仅在 BeamQuotationHistory 详情视图中使用，添加CardHeader使其与 QuotationHistory 的详情视图模式一致
3. **global.css 全局圆角改为10px**：这是影响全局的改动，但10px正是CustomerManagement的参考圆角值，所有已修改的scoped样式也已设为10px，保持一致
4. **.action-btns .el-button 圆角改为10px**：表格操作按钮从16px胶囊形改为10px圆角矩形，与整体风格统一
5. **不修改业务逻辑**：仅修改CSS样式和模板结构（CardHeader/header slot），不触碰任何接口、数据、功能逻辑

## 验证步骤

1. `cd d:\work\Beilit-Price-List && npx vue-tsc --noEmit` — TypeScript编译无错误
2. `git diff --name-only` — 确认修改的文件列表，验证 CustomerManagement.vue 和 UserManagement.vue 不在其中
3. 启动dev server，目视检查关键页面：Login、Register、QuotationStatistics、BeamQuotationHistory详情、QuotationHistory
