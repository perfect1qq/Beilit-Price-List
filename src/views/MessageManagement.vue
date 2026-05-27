<template>
  <div class="message-management">
    <el-card shadow="never" class="card">
      <template #header>
        <MessageFilter v-model:keyword="keyword" :page-title="pageTitle" :page-subtitle="pageSubtitle"
          :is-admin="isAdmin" @search="handleSearch" />
      </template>

      <CardList v-if="!useVirtualTable" :data="messages" :loading="loading" :total="total" v-model:current-page="page"
        v-model:page-size="pageSize" :columns="2" empty-description="暂无留言线索" @page-change="(p) => loadMessages(p)">
        <template #card="{ item }">
          <MessageCard :item="item" :is-admin="isAdmin" :is-guest="isGuest"
            :action-loading="isActionLoading(item.id as string | number)" @view="openView" @assign="openAssign"
            @delete="doDelete" @hide="doHideFromList" />
        </template>
      </CardList>
      <div v-else class="virtual-table-wrap">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2 :columns="virtualColumns" :data="messages" :width="width" :height="Math.max(420, height)"
              :row-height="54" fixed />
          </template>
        </el-auto-resizer>
      </div>
      <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" class="load-error" />
    </el-card>

    <MessageDialogs v-model:view-visible="viewVisible" v-model:assign-visible="assignVisible" :view-title="viewTitle"
      :view-row="viewRow" :assign-form="assignForm" :staff-list="staffList" :assign-loading="assignLoading"
      :format-time="formatTime" @confirm-assign="confirmAssign" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'MessageManagement' })

import MessageDialogs from '@/components/message/MessageDialogs.vue'
import MessageCard from '@/components/message/MessageCard.vue'
import MessageFilter from '@/components/message/MessageFilter.vue'
import CardList from '@/components/common/CardList.vue'
import { useMessageManagement } from '@/composables/useMessageManagement'

const {
  isAdmin,
  isGuest,
  pageTitle,
  pageSubtitle,
  messages,
  loading,
  loadError,
  useVirtualTable,
  viewVisible,
  viewRow,
  viewTitle,
  staffList,
  assignVisible,
  assignLoading,
  assignForm,
  isActionLoading,
  keyword,
  page,
  pageSize,
  total,
  virtualColumns,
  formatTime,
  loadMessages,
  handleSearch,
  openView,
  openAssign,
  confirmAssign,
  doHideFromList,
  doDelete,
} = useMessageManagement()
</script>

<style scoped>
.message-management {
  padding: 0;
}

.card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.virtual-table-wrap {
  height: 460px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.virtual-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.load-error {
  margin-top: 12px;
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.status-extra {
  margin: 0;
}

.message-view-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: min(70vh, 520px);
  overflow-y: auto;
  padding-right: 4px;
}

.view-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.view-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.view-value {
  font-size: 14px;
  color: #0f172a;
  word-break: break-word;
}

.view-text-block {
  white-space: pre-wrap;
  line-height: 1.65;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.view-content {
  max-height: 320px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .virtual-table-wrap {
    height: 380px;
  }
}
</style>
