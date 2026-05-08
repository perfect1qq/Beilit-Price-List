<template>
  <div class="user-card-item">
    <div class="card-header">
      <h3 class="username">{{ user.username }}</h3>
      <el-tag :type="roleTagType" size="small">
        {{ roleLabel }}
      </el-tag>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="label">姓名：</span>
        <span class="value">
          <el-input v-if="user._editingName" v-model="user._editNameValue" size="small" placeholder="输入姓名"
            @blur="$emit('name-blur', user)" @keyup.enter="$emit('name-confirm', user)" />
          <span v-else class="editable-name" @click="$emit('name-edit', user)">
            {{ user.name || '—' }}
            <el-icon class="edit-icon">
              <Edit />
            </el-icon>
          </span>
        </span>
      </div>
      <div class="info-row">
        <span class="label">角色：</span>
        <span class="value">
          <el-select :model-value="user.role" size="small" placeholder="选择角色"
            @change="(val) => $emit('role-change', user, val)" :disabled="user.id === currentUserId">
            <el-option label="管理员" value="admin" />
            <el-option label="业务员" value="user" />
            <el-option label="游客(只读)" value="guest" />
          </el-select>
        </span>
      </div>
      <div class="info-row">
        <span class="label">注册时间：</span>
        <span class="value">{{ formatDate(user.createdAt) }}</span>
      </div>
    </div>

    <div class="card-footer">
      <el-button type="warning" size="small" plain :icon="Lock" @click.stop="$emit('reset-password', user)">
        重置密码
      </el-button>
      <el-button type="danger" size="small" plain :icon="Delete" @click.stop="$emit('delete', user)"
        :disabled="user.id === currentUserId">
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Lock, Delete, Edit } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'

const props = defineProps({
  user: { type: Object, required: true },
  currentUserId: { type: Number, default: null }
})

defineEmits(['name-edit', 'name-blur', 'name-confirm', 'role-change', 'reset-password', 'delete'])

const roleTagType = computed(() => {
  if (props.user.role === 'admin') return 'danger'
  if (props.user.role === 'user') return 'primary'
  return 'info'
})

const roleLabel = computed(() => {
  if (props.user.role === 'admin') return '管理员'
  if (props.user.role === 'user') return '业务员'
  return '游客(只读)'
})
</script>

<style scoped>
.user-card-item {
  padding: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.username {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.label {
  color: #64748b;
  flex-shrink: 0;
  width: 70px;
}

.value {
  color: #334155;
  flex: 1;
}

.editable-name {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.editable-name:hover {
  background: #f1f5f9;
}

.edit-icon {
  font-size: 12px;
  color: #94a3b8;
  opacity: 0;
  transition: opacity 0.2s;
}

.editable-name:hover .edit-icon {
  opacity: 1;
}

.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
</style>
