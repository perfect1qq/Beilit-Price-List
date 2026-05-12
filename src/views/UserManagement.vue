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
          <UserCard :user="(item as unknown as UserInfo)" :current-user-id="currentUser.id" @name-edit="startEditName"
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
        <el-button type="primary" :loading="loading" @click="confirmReset">确认重置</el-button>
      </template>
    </AsyncDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import userApi from '@/api/user'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { useClipboard } from '@/composables/useClipboard'
import SearchBar from '@/components/common/SearchBar.vue'
import CardList from '@/components/common/CardList.vue'
import AsyncDialog from '@/components/common/AsyncDialog.vue'
import InviteCodeCard from '@/components/user/InviteCodeCard.vue'
import UserCard from '@/components/user/UserCard.vue'
import type { UserInfo } from '@/types'

const loading = ref(false)
const users = ref<UserInfo[]>([])
const search = ref('')
const userStore = useUserStore()
const currentUser = computed(() => userStore.user || { id: 0, username: '', name: '', role: 'guest' as const })
const { copy } = useClipboard()

// 邀请码相关
const inviteCode = ref('')
const refreshingCode = ref(false)

const fetchInviteCode = async () => {
  const [err, data] = await to(userApi.getInviteCode())
  if (!err && data?.inviteCode) {
    inviteCode.value = data.inviteCode
  }
}

const copyInviteCode = async () => {
  if (!inviteCode.value) return
  await copy(inviteCode.value, '邀请码已复制到剪贴板')
}

const handleRefreshCode = async () => {
  refreshingCode.value = true
  const [err, data] = await to(userApi.refreshInviteCode())
  if (err) {
    showError(err, '刷新邀请码失败')
  } else if (data?.inviteCode) {
    inviteCode.value = data.inviteCode
    showSuccess('邀请码已刷新，旧邀请码立即失效')
  }
  refreshingCode.value = false
}

// 重置密码弹窗的状态管理
const resetDialog = reactive({
  visible: false,
  userId: null as number | null,
  username: '',
  password: ''
})

/** 重置密码对话框引用 */
const resetDialogRef = ref<InstanceType<typeof AsyncDialog> | null>(null)

/**
 * 实时过滤用户列表
 */
const filteredUsers = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return users.value
  return users.value.filter(u => u.username.toLowerCase().includes(kw))
})

const fetchUsers = async () => {
  loading.value = true
  const [err, data] = await to(userApi.list())
  if (err) {
    showError('无法获取用户列表')
    loading.value = false
    return
  }
  users.value = data.users || []
  loading.value = false
}

const handleResetClick = (row: UserInfo) => {
  resetDialog.userId = row.id
  resetDialog.username = row.username
  resetDialog.password = ''
  resetDialog.visible = true
}

// 执行重置密码请求
const confirmReset = async () => {
  if (!resetDialog.password) {
    return showWarning('请输入新密码')
  }
  if (resetDialog.password.length < 6) {
    return showWarning('密码长度至少为 6 位')
  }

  try {
    await resetDialogRef.value?.load(() =>
      userApi.resetPassword(resetDialog.userId as number | string, resetDialog.password)
    )
    showSuccess(`用户 ${resetDialog.username} 的密码已成功重置`)
    resetDialog.visible = false
  } catch (err) {
    showError(err, '重置失败')
  }
}

const handleDelete = async (row: UserInfo) => {
  const [confirmErr] = await to(ElMessageBox.confirm(`确定要删除用户 "${row.name || row.username}" 吗？此操作不可恢复！`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }))
  if (confirmErr) return

  const [err] = await to(userApi.remove(row.id))
  if (err) {
    showError(err, '删除用户失败')
    return
  }
  showSuccess('用户已成功删除')
  fetchUsers()
}

const handleRoleChange = async (row: UserInfo, newRole: string) => {
  const oldRole = row.role
  const roleLabels: Record<string, string> = { admin: '管理员', user: '业务员', guest: '游客(只读)' }
  const [confirmErr] = await to(ElMessageBox.confirm(`确定要将用户 ${row.username} 的权限修改为 "${roleLabels[newRole] || newRole}" 吗？`, '权限变更确认', {
    type: 'warning',
    confirmButtonText: '确定变更',
    cancelButtonText: '取消'
  }))
  if (confirmErr) {
    row.role = oldRole
    return
  }

  const [err] = await to(userApi.updateRole(row.id, newRole))
  if (err) {
    showError(err, '更新权限失败')
    row.role = oldRole
    fetchUsers()
    return
  }
  row.role = newRole as 'admin' | 'user' | 'guest'
  showSuccess('用户权限更新成功')
}

const startEditName = (row: UserInfo) => {
  row._editingName = true
  row._editNameValue = row.name || ''
}

const handleNameBlur = (row: UserInfo) => {
  if (!row._editingName) return
  confirmNameChange(row)
}

const confirmNameChange = async (row: UserInfo) => {
  const newName = (row._editNameValue || '').trim()
  if (!newName) {
    row._editingName = false
    return showWarning('姓名不能为空')
  }
  if (newName === row.name) {
    row._editingName = false
    return
  }
  const [err] = await to(userApi.updateName(row.id, newName))
  if (err) {
    showError(err, '修改姓名失败')
    row._editingName = false
    return
  }
  row.name = newName
  row._editingName = false
  if (currentUser.value.id === row.id) {
    if (userStore.user) {
      userStore.user.name = newName
    }
    userStore.refreshProfile()
  }
  showSuccess('姓名已更新')
}

onMounted(() => {
  fetchUsers()
  fetchInviteCode()
})
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
