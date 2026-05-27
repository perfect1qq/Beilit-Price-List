<!--
  @file views/UserManagement.vue
  @description 系统用户管理页面（仅管理员可见）

  功能说明：
  - 查看所有注册用户的列表（卡片形式展示）
  - 邀请码管理：查看、复制、刷新邀请码
  - 用户信息编辑：修改姓名（点击即编辑）
  - 角色权限管理：切换 admin/user/guest 角色
  - 密码重置：强制重置指定用户密码
  - 用户删除：移除不需要的账号
  - 实时搜索过滤

  页面结构：
  ┌──────────────────────────────────────────────────────────────┐
  │  UserManagement (容器)                                       │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │ 邀请码卡片 (invite-code-card)                          │  │
  │  │ 🔑 注册邀请码: ABC123 [复制] [刷新]                    │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │ 用户列表卡片                                            │  │
  │  │ Header: 标题 + 搜索栏                                  │  │
  │  ├────────────────────────────────────────────────────────┤  │
  │  │ CardList (3列网格)                                     │  │
  │  │ ┌───────────┐ ┌───────────┐ ┌───────────┐            │  │
  │  │ │ username   │ │ username   │ │ username   │            │  │
  │  │ │ [role-tag] │ │ [role-tag] │ │ [role-tag] │            │  │
  │  │ │ 姓名: xxx  │ │ 姓名: xxx  │ │ 姓名: xxx  │            │  │
  │  │ │ 角色: ▼    │ │ 角色: ▼    │ │ 角色: ▼    │            │  │
  │  │ │ 注册时间   │ │ 注册时间   │ │ 注册时间   │            │  │
  │  │ │[重置][删除]│ │[重置][删除]│ │[重置][删除]│            │  │
  │  │ └───────────┘ └───────────┘ └───────────┘            │  │
  │  └────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘

  权限控制：
  - 仅 admin 角色可访问此页面
  - 不能修改自己的角色（防止锁死）
  - 不能删除自己的账号
  - 游客角色只能查看，无法编辑任何内容

  角色说明：
  ┌──────────┬─────────────────────────────────────────────────┐
  │  role     │  权限描述                                        │
  ├──────────┼─────────────────────────────────────────────────┤
  │  admin    │  管理员，拥有所有权限，可管理其他用户              │
  │  user     │  业务员，可使用业务功能（报价单、客户管理等）      │
  │  guest    │  游客，只读模式，无法进行任何写操作               │
  └──────────┴─────────────────────────────────────────────────┘

  API 调用：
  - GET /api/invite-code → 获取邀请码
  - POST /api/invite-code/refresh → 刷新邀请码
  - GET /api/users → 获取用户列表
  - PUT /api/users/:id/name → 修改姓名
  - PUT /api/users/:id/role → 修改角色
  - POST /api/users/:id/reset-password → 重置密码
  - DELETE /api/users/:id → 删除用户

  交互特性：
  - 姓名支持点击后原地编辑（inline editing）
  - 角色切换需二次确认（防止误操作）
  - 删除操作需二次确认（不可恢复）
  - 密码重置有长度校验（至少6位）
-->

<template>
  <div class="user-management">
    <!-- 邀请码展示区域 -->
    <InviteCodeCard :code="inviteCode" :refreshing="refreshingCode" @copy="copyInviteCode"
      @refresh="handleRefreshCode" />

    <!-- 最外层承载卡片 -->
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header-box">
          <!-- 页面标题与引导副标题 -->
          <div class="title-section">
            <h2 class="title">系统用户管理</h2>
            <p class="subtitle">管理平台各业务人员账号及权限，支持查询及强行密码重置配置</p>
          </div>
          <!-- 右上角工具栏：搜索框与刷新按钮 -->
          <div class="actions">
            <SearchBar v-model="search" placeholder="搜索用户名" button-text="刷新列表" @search="fetchUsers">
              <template #extra>
                <el-button type="primary" :icon="Refresh" @click="fetchUsers">刷新</el-button>
              </template>
            </SearchBar>
          </div>
        </div>
      </template>

      <!-- 数据展示核心区：用户实体列表 -->
      <CardList :data="filteredUsers" :loading="loading" :show-pagination="false" :columns="3"
        empty-description="暂无用户数据" :empty-image-size="100">
        <template #card="{ item }">
          <UserCard :user="item" :current-user-id="currentUser.id" @name-edit="startEditName"
            @name-blur="handleNameBlur" @name-confirm="confirmNameChange" @role-change="handleRoleChange"
            @reset-password="handleResetClick" @delete="handleDelete" />
        </template>
      </CardList>
    </el-card>

    <!-- 重置密码对话框 -->
    <AsyncDialog ref="resetDialogRef" v-model="resetDialog.visible" title="重置用户密码" :width="400" :append-to-body="true">
      <div class="dialog-content">
        <p class="dialog-tip">正在为用户 <strong>{{ resetDialog.username }}</strong> 设置新密码</p>
        <el-form label-position="top">
          <el-form-item label="输入新密码" required>
            <el-input v-model="resetDialog.password" type="password" show-password placeholder="建议包含字母与数字" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer="{ loading }">
        <el-button @click="resetDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onConfirmReset">确认重置</el-button>
      </template>
    </AsyncDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import SearchBar from '@/components/common/SearchBar.vue'
import CardList from '@/components/common/CardList.vue'
import AsyncDialog from '@/components/common/AsyncDialog.vue'
import InviteCodeCard from '@/components/user/InviteCodeCard.vue'
import UserCard from '@/components/user/UserCard.vue'
import { useUserManagement } from '@/composables/useUserManagement'

defineOptions({ name: 'UserManagement' })

const resetDialogRef = ref<InstanceType<typeof AsyncDialog> | null>(null)

const {
  loading,
  search,
  currentUser,
  inviteCode,
  refreshingCode,
  resetDialog,
  filteredUsers,
  fetchUsers,
  copyInviteCode,
  handleRefreshCode,
  handleResetClick,
  confirmReset,
  handleDelete,
  handleRoleChange,
  startEditName,
  handleNameBlur,
  confirmNameChange,
} = useUserManagement()

const onConfirmReset = () => confirmReset(resetDialogRef.value)
</script>

<style scoped>
.user-management {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: none;
}

.header-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 10px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  border-left: 4px solid #6366f1;
  padding-left: 10px;
  line-height: 1;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #64748b;
  padding-left: 14px;
}

.actions {
  display: flex;
  align-items: center;
}

.dialog-content {
  padding: 10px 0;
}

.dialog-tip {
  margin-bottom: 20px;
  color: #475569;
  line-height: 1.5;
  font-size: 14px;
}

.dialog-tip strong {
  color: #6366f1;
}

@media (max-width: 768px) {
  .header-box {
    align-items: flex-start;
    gap: 10px;
  }

  .title {
    font-size: 16px;
  }

  .subtitle {
    font-size: 12px;
    padding-left: 0;
  }

  .actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .actions :deep(.el-input),
  .actions :deep(.el-input__wrapper) {
    width: 100% !important;
  }
}
</style>
