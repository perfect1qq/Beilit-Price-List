# Beilit-Price-List 版本记录

## 版本: v2.0-guest-permission (2026-04-21)

### 📋 版本说明
此版本是 **游客权限功能 + 代码优化** 的基线版本。在开始深度优化前，请确保此版本可以正常运行。

### ✅ 本版本已完成的功能

#### 1. 游客(Guest)只读权限系统
| 文件 | 修改内容 |
|------|----------|
| `server/services/userService.js` | VALID_ROLES 添加 'guest'；注册默认角色改为 guest |
| `server/routes/auth.js` | 添加 guest 菜单配置（只含查看页面） |
| `src/composables/usePermissions.js` | 新建：权限控制 composable |
| `src/views/UserManagement.vue` | 角色选择添加「游客(只读)」选项；姓名支持点击编辑 |
| `src/views/MessageManagement.vue` | Guest 隐藏指派/删除按钮 |
| `src/views/MemoManagement.vue` | Guest 隐藏新建/编辑/删除按钮 |
| `src/views/QuotationList.vue` | Guest 隐藏工具栏编辑按钮和操作列 |
| `src/views/BeamQuotationList.vue` | Guest 隐藏添加行、保存按钮 |
| `src/views/BeamQuotationHistory.vue` | Guest 只显示查看按钮 |
| `src/views/QuotationHistory.vue` | Guest 只显示查看按钮 |
| `src/views/MediumShelfWeightTable.vue` | Guest 隐藏编辑/新增/保存按钮 |

#### 2. 注册功能增强
| 文件 | 修改内容 |
|------|----------|
| `src/views/register.vue` | 用户名正则：必须包含字母，可含数字，不能全数字/中文/符号 |

#### 3. Bug修复
| 文件 | 问题 | 修复 |
|------|------|------|
| `src/composables/usePermissions.js` | 导入路径错误 `@/utils/auth` | 改为 `@/utils/navigation` |
| `src/views/approval.vue:91` | `quotationApi.markAllNotificationsAsRead` 不存在 | 改为 `messageApi.markAllAsRead` |
| `src/api/user.js` | 缺少 `updateName` 方法 | 已添加 |

### 🔐 Guest 权限规则

| 功能 | Admin | User | Guest |
|------|-------|------|-------|
| 查看数据 | ✅ | ✅ | ✅ |
| 新增数据 | ✅ | ✅ | ❌ |
| 编辑数据 | ✅ | ✅ | ❌ |
| 删除数据 | ✅ | ✅ | ❌ |
| 导出数据 | ✅ | ✅ | ❌ |
| 用户管理 | ✅ | ❌ | ❌ |
| 审批管理 | ✅ | ❌ | ❌ |

### 📁 项目架构总览

```
d:\work\server\                    # 后端 (Node.js + Express + Prisma)
├── index.js                        # 入口文件
├── authMiddleware.js               # JWT 认证中间件
├── roleMiddleware.js               # 角色权限中间件
├── prismaClient.js                 # Prisma 客户端
├── routes/                         # 路由层 (10个路由模块)
│   ├── auth.js                     # 认证/用户/菜单
│   ├── quotations.js               # 报价单 CRUD + 审批
│   ├── approvals.js                # 审批列表
│   ├── beams.js                    # 横梁载重单
│   ├── messages.js                 # 留言板
│   ├── memos.js                    # 备忘录
│   ├── notifications.js            # 通知
│   ├── mediumShelfWeight.js        # 中型货架重量表
│   └── tools.js                    # 工具接口
├── services/                       # 业务逻辑层
│   ├── userService.js              # 用户服务
│   ├── quotationService.js         # 报价单服务
│   ├── messageService.js           # 留言服务
│   ├── memoService.js              # 备忘录服务
│   ├── notificationService.js      # 通知服务
│   └── quotation/                  # 报价单子模块
│       ├── calculation.js          # 价格计算
│       ├── mapper.js               # 数据映射
│       └── payload.js              # 数据清洗
├── utils/                          # 工具函数
│   ├── cache.js                    # TTL 内存缓存
│   ├── response.js                 # 统一响应格式
│   ├── httpHandlers.js             # 异步处理器包装
│   ├── pagination.js               # 分页参数解析
│   └── validators.js               # 参数校验
└── middleware/                      # 中间件
    └── requestLogger.js            # 请求日志

d:\work\Beilit-Price-List\src\      # 前端 (Vue 3 + Element Plus)
├── api/                            # API 接口层 (8个模块)
├── composables/                    # 组合式函数 (16个)
├── views/                          # 页面组件 (20个)
├── components/                     # 公共组件
├── layout/                         # 布局组件
├── stores/                         # Pinia 状态管理
├── utils/                          # 工具函数
└── router/                         # 路由配置
```

### 🔄 回退方法
如果优化后出现问题：
1. 使用 Git 回退到本版本的 commit
2. 或手动恢复此文档中列出的所有文件的原始状态

### ⏰ 创建时间
2026-04-21
