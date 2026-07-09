# 前端项目 UI 风格统一方案

## Summary

将前端项目所有页面（除 CustomerManagement 和 UserManagement 外）的 UI 风格统一对齐到 CustomerManagement 的视觉风格。包括：CSS 视觉统一（颜色、圆角、阴影、边框）、给没有标题的页面添加 CardHeader 组件、移除 emoji 标签换成纯文字、统计卡片样式对齐、登录/注册页从深色英雄面板改为浅色 el-card 风格。

**严禁修改任何业务逻辑** — 只改 UI/CSS/结构外观，不改功能、接口、数据流。

## Current State Analysis

### CustomerManagement 参考风格（不改）

文件：`src/views/CustomerManagement.vue`

核心视觉特征：
- **卡片容器**：`el-card shadow="never"`，无额外 border 类
- **标题**：使用 `CardHeader` 组件（`src/components/common/CardHeader.vue`），标题 18px/600/#1e293b
- **统计卡片**：plain div，`flex:1`，`min-width:100px`，`border-radius:10px`，`border:1px solid #e5e7eb`，`text-align:center`，数值 24px/700
- **搜索过滤行**：`background:#f5f7fa`，`border-radius:8px`，`padding:16px 20px`
- **数据列表**：使用 `CardList` 组件
- **颜色体系**：#3b82f6（主色）、#e5e7eb（边框）、#64748b（次要文字）、#0f172a（深色文字）
- **Hover**：`border-color:#3b82f6; box-shadow:0 2px 8px rgba(59,130,246,0.1)`
- **页面内边距**：20px
- **标签**：纯文字 label，无 emoji

### UserManagement（不改）

文件：`src/views/UserManagement.vue` — 已有自己的 `border-left:4px solid #3b82f6` 标题样式，不改。

### 需要修改的页面清单

| # | 文件 | 当前问题 |
|---|------|----------|
| 1 | HomeView.vue | 自定义 hero badge、渐变背景，无 CardHeader |
| 2 | QuotationList.vue | 无 CardHeader，card 圆角 12px |
| 3 | QuotationHistory.vue | card 圆角 14px，自定义 toolbar，无 CardHeader |
| 4 | BeamQuotationList.vue | 无 CardHeader，editor-card 圆角 12px |
| 5 | BeamQuotationHistory.vue | 无 CardHeader，history-card 圆角 12px |
| 6 | MediumShelfWeightTable.vue | 自定义 page-title/subtitle，section-card 圆角 4px，无 CardHeader |
| 7 | NotepadView.vue | 两栏布局，container 圆角 8px，风格独立 |
| 8 | MemoManagement.vue | padding 32px，wrapper 圆角 20px，背景 #fcfdfe |
| 9 | UsdConversion.vue | 已用 CardHeader，box-card 圆角 12px |
| 10 | Approval.vue | 自定义 head + border-left，emoji 标签(🏢👤📅)，card 圆角 14px |
| 11 | ApprovalHistory.vue | 同 Approval.vue，emoji 标签 |
| 12 | ApprovalDetail.vue | 自定义 head + border-left，card 圆角 12px |
| 13 | QuotationStatistics.vue | 自定义 panel + h2 border-left，原生 table |
| 14 | Login.vue + AuthLayout.vue | 深色英雄面板分屏布局 |
| 15 | Register.vue | 同 Login.vue |

### 需要修改的组件清单

| # | 文件 | 当前问题 |
|---|------|----------|
| 1 | MemoStatsRow.vue | el-card + 圆角 16px，与 CustomerManagement 的 plain div 10px 不一致 |
| 2 | MemoFilter.vue | 自定义 header + "LIVE" badge，风格独立 |
| 3 | AuthLayout.vue | 深色分屏布局，需改为浅色 el-card 风格 |

## Proposed Changes

### 设计规范（统一标准）

所有页面统一使用以下 CSS 值：

```
卡片圆角: 10px (was 12px/14px/20px mixed)
内层圆角: 8px (search rows, inner panels)
卡片阴影: 无默认阴影 (shadow="never")，hover 时 0 2px 8px rgba(59,130,246,0.1)
边框: 1px solid #e5e7eb
页面内边距: 20px
主色: #3b82f6
次要文字: #64748b
深色文字: #0f172a
浅灰背景: #f5f7fa
标题: CardHeader 组件 (18px/600/#1e293b)
```

### 修改清单

#### 1. HomeView.vue
- 移除渐变 hero-badge，改为 CardHeader 标题 "工作台"
- hero-card 和 quick-card 圆角从 12px 改为 10px
- 移除 `linear-gradient(135deg, #eff6ff, #eef2ff)`，改用纯色或 #f5f7fa
- quick-card 使用 `border:1px solid #e5e7eb`，hover 时 `border-color:#3b82f6; box-shadow:0 2px 8px rgba(59,130,246,0.1)`
- 快捷卡片图标颜色统一 #3b82f6

#### 2. QuotationList.vue
- 在 el-card header 中加入 `CardHeader title="报价单编辑"`
- `.card` 圆角从 12px 改为 10px，阴影改为 `shadow="never"` 风格
- toolbar 保持不变（功能按钮区）

#### 3. QuotationHistory.vue
- 列表视图：在 el-card header 中加入 `CardHeader title="报价单历史"`
- 详情视图：在 el-card header 中加入 `CardHeader title="报价单详情"`
- `.card` 圆角从 14px 改为 10px
- history-toolbar 样式对齐 search-filter-row 风格（#f5f7fa 背景，8px 圆角）

#### 4. BeamQuotationList.vue
- 在 el-card header 中加入 `CardHeader title="横梁载重单编辑"`
- `.editor-card` 圆角从 12px 改为 10px

#### 5. BeamQuotationHistory.vue
- 在 el-card header 中加入 `CardHeader title="横梁载重单历史"`
- `.history-card` 圆角从 12px 改为 10px
- search-toolbar 对齐 search-filter-row 风格

#### 6. MediumShelfWeightTable.vue
- 移除自定义 page-title/page-subtitle，改用 `CardHeader title="中型货架重量表"`
- `.page-card` 圆角从 12px 改为 10px
- section-card 圆角从 4px 改为 10px
- section-title 移除 `border-left:4px solid #3b82f6`，改用普通标题样式

#### 7. NotepadView.vue
- `.notepad-container` 圆角从 8px 改为 10px
- `.notepad-container` 背景从 #f5f7fa 保持，阴影对齐
- sidebar 和 main 区域边框统一为 `1px solid #e5e7eb`
- note-item 圆角从 8px 改为 10px
- folder-item 圆角从 6px 改为 8px

#### 8. MemoManagement.vue
- `.memo-container` padding 从 32px 改为 20px
- `.memo-container` 背景从 #fcfdfe 改为透明（使用页面默认背景）
- `.memo-wrapper` 圆角从 20px 改为 10px
- `.memo-wrapper` 阴影对齐 CustomerManagement（无默认阴影或极轻）
- `.column` 圆角从 16px 改为 10px
- `.memo-content` padding 从 28px 改为 20px
- board-grid gap 从 32px 改为 16px

#### 9. UsdConversion.vue
- `.box-card` 圆角从 12px 改为 10px
- 已有 CardHeader，保持
- global-setting-group 背景从 #f8fafc 改为 #f5f7fa，圆角 8px（已一致）
- footer-summary 圆角从 8px 保持

#### 10. Approval.vue
- 移除自定义 `.head` 结构，改用 `CardHeader title="审批管理"` 放入 el-card header slot
- `.approval-card` 圆角从 14px 改为 10px
- 移除 `border:1px solid #e2e8f0`，改用 #e5e7eb
- 移除阴影 `0 8px 24px`，改用 shadow="never"
- **移除 emoji 标签**：`🏢 公司名称：` → `公司名称：`，`👤 提交人：` → `提交人：`，`📅 创建时间：` → `创建时间：`
- 移除自定义 `.head h2 { border-left:4px solid #3b82f6 }` 样式

#### 11. ApprovalHistory.vue
- 同 Approval.vue：移除自定义 head，改用 `CardHeader title="审批历史"`
- 圆角 14px → 10px
- **移除 emoji 标签**

#### 12. ApprovalDetail.vue
- 移除自定义 `.head` 结构，改用 `CardHeader` 放入 el-card header slot，标题显示公司/报价单名称
- `.card` 圆角从 12px 改为 10px
- 移除 `.head h2 { border-left:4px solid #3b82f6 }` 样式
- `.form` 背景从 #f8fafc 改为 #f5f7fa
- `.summary-bar` 背景从 #f8fafc 改为 #f5f7fa
- `.section-title` 移除 `border-left:4px solid #3b82f6`

#### 13. QuotationStatistics.vue
- 用 `el-card shadow="never"` + `CardHeader title="货架部件智能汇总"` 包裹整个页面
- `.page` 圆角从 12px 改为 10px
- `.panel` 圆角从 12px 改为 10px
- `h2` 移除 `border-left:4px solid #3b82f6`，改用普通标题或 CardHeader
- 原生 table 改用 el-table + smart-table 类（保持数据和功能不变，只换表格组件外观）

#### 14. Login.vue + AuthLayout.vue
- **AuthLayout.vue 完全重设计**：
  - 移除深色背景 `linear-gradient(135deg, #0f172a...)`
  - 移除 decor-1/decor-2 模糊圆球
  - 移除 hero-panel 深色英雄面板
  - 改为：居中单卡片布局，浅色背景 `#f5f7fa`
  - el-card 使用 `shadow="never"`，圆角 10px，`border:1px solid #e5e7eb`
  - card-title 样式对齐 CardHeader（18px/600/#1e293b）
  - card-sub 样式 #64748b
  - 输入框样式保持圆角 8px
  - 登录按钮保持渐变蓝色或改为纯 #3b82f6
- **Login.vue**：
  - 移除 hero-content slot 内容（hero-badges 等）
  - 保留表单部分，样式随 AuthLayout 调整
- **Register.vue**：
  - 同 Login.vue，移除 hero-content

#### 15. MemoStatsRow.vue（组件）
- 移除 el-card 包裹，改用 plain div（与 CustomerManagement stat-card 一致）
- 圆角从 16px 改为 10px
- 阴影从 `0 8px 22px rgba(15,23,42,0.04)` 改为无默认阴影
- `border:1px solid #e5e7eb`
- stat-value 字号从 26px 改为 24px，font-weight 从 800 改为 700
- text-align:center
- 添加 hover 效果：`border-color:#3b82f6; box-shadow:0 2px 8px rgba(59,130,246,0.1)`

#### 16. MemoFilter.vue（组件）
- 移除 "LIVE" badge
- memo-title 字号从 22px 改为 18px，font-weight 从 800 改为 600
- 移除 `letter-spacing:-0.5px`
- 搜索框和 segmented 样式保持，背景色对齐 #f5f7fa
- main-add-btn 移除自定义阴影，使用全局按钮样式

## Assumptions & Decisions

1. **不改业务逻辑**：所有功能、接口调用、数据流、事件处理保持不变
2. **不改路由结构**：QuotationLayout/BeamQuotationLayout/ApprovalLayout 保持原样（它们只是 `<router-view />`）
3. **不改 Sidebar/Navbar**：侧边栏和顶部导航栏保持现有深色风格（它们是框架级 UI，不属于页面内容）
4. **不改 global.css 中的全局表格/卡片样式**：这些是共享样式，改动会影响所有页面包括 CustomerManagement
5. **CardHeader 组件本身不改**：它已经是 CustomerManagement 的标准
6. **el-card shadow="never"**：所有页面统一使用 `shadow="never"`，通过自定义 CSS 控制边框和 hover 效果
7. **emoji 标签全部移除**：Approval.vue 和 ApprovalHistory.vue 中的 🏢👤📅 换成纯文字
8. **原生 table → el-table**：QuotationStatistics.vue 的原生 HTML table 改为 el-table + smart-table 类，保持数据不变

## Verification

1. 修改完成后运行 `npx vue-tsc --noEmit` 确认无类型错误
2. 启动 dev server (`npm run dev`) 逐页检查：
   - 每个页面是否有 CardHeader 标题
   - 圆角是否统一为 10px
   - 边框颜色是否统一为 #e5e7eb
   - 是否有 emoji 残留
   - 登录/注册页是否改为浅色卡片风格
3. 检查 CustomerManagement 和 UserManagement 未被修改（git diff 确认）
4. 检查响应式：768px 断点下各页面正常显示

## 实施顺序

1. 先改组件：MemoStatsRow.vue、MemoFilter.vue、AuthLayout.vue
2. 再改简单页面：UsdConversion.vue、HomeView.vue
3. 改卡片列表页：Approval.vue、ApprovalHistory.vue、ApprovalDetail.vue
4. 改编辑器页：QuotationList.vue、BeamQuotationList.vue、MediumShelfWeightTable.vue
5. 改历史页：QuotationHistory.vue、BeamQuotationHistory.vue
6. 改特殊页：NotepadView.vue、MemoManagement.vue、QuotationStatistics.vue
7. 改认证页：Login.vue、Register.vue
8. 最后统一验证
