

<template>
  <div class="user-management">

    <InviteCodeCard :code="inviteCode" :refreshing="refreshingCode" @copy="copyInviteCode"
      @refresh="handleRefreshCode" />


    <el-card shadow="never" class="card">
      <template #header>
        <div class="header-box">

          <div class="title-section">
            <h2 class="title">系统用户管理</h2>
            <p class="subtitle">管理平台各业务人员账号及权限，支持查询及强行密码重置配置</p>
          </div>

          <div class="actions">
            <SearchBar v-model="search" placeholder="搜索用户名" button-text="刷新列表" @search="fetchUsers">
              <template #extra>
                <el-button type="primary" :icon="Refresh" @click="fetchUsers">刷新</el-button>
              </template>
            </SearchBar>
          </div>
        </div>
      </template>


      <CardList :data="filteredUsers" :loading="loading" :show-pagination="false" :columns="3"
        empty-description="暂无用户数据" :empty-image-size="100">
        <template #card="{ item }">
          <UserCard :user="item" :current-user-id="currentUser.id" @name-edit="startEditName"
            @name-blur="handleNameBlur" @name-confirm="confirmNameChange" @role-change="handleRoleChange"
            @reset-password="handleResetClick" @delete="handleDelete" />
        </template>
      </CardList>
    </el-card>


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
        <el-button @click="resetDialog.password = ''; resetDialog.visible = false">取消</el-button>
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
  border-left: 4px solid #3b82f6;
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
  color: #3b82f6;
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
