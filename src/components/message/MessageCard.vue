<template>
  <div class="message-card-item">
    <div class="card-header">
      <h3 class="contact-info">{{ item.contactInfo || '未提供联系方式' }}</h3>
      <el-tag :type="item.status === 'assigned' ? 'success' : 'warning'" size="small">
        {{ item.status === 'assigned' ? '已指派' : '待处理' }}
      </el-tag>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="label">提交时间：</span>
        <span class="value">{{ formatTime(item.createdAt) }}</span>
      </div>
      <div class="info-row">
        <span class="label">留言内容：</span>
        <span class="value content-text">{{ item.content || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="label">跟进人：</span>
        <span class="value">{{ (item.assignee?.name || '').trim() || item.assignee?.username || '—' }}</span>
      </div>
    </div>

    <div class="card-footer">
      <el-button type="primary" size="small" round @click.stop="$emit('view', item)">查看</el-button>
      <template v-if="!isGuest">
        <template v-if="isAdmin">
          <el-button type="warning" size="small" plain :loading="actionLoading"
            @click.stop="$emit('assign', item)">指派</el-button>
          <el-button type="danger" size="small" plain :loading="actionLoading"
            @click.stop="$emit('delete', item)">删除</el-button>
        </template>
        <el-button v-else type="danger" size="small" plain :loading="actionLoading"
          @click.stop="$emit('hide', item)">
          删除
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { formatDateTime } from '@/utils/date'
import type { MessageData } from '@/types'

defineProps({
  item: { type: Object as PropType<MessageData>, required: true },
  isAdmin: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false },
  actionLoading: { type: Boolean, default: false }
})

defineEmits(['view', 'assign', 'delete', 'hide'])

const formatTime = (dateStr: string | undefined) => formatDateTime(dateStr || '')
</script>
