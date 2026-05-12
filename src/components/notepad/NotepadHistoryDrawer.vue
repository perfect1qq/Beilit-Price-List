<template>
  <el-drawer :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="修改历史" size="420px">
    <el-timeline v-if="safeList.length" class="custom-timeline">
      <el-timeline-item v-for="h in safeList" :key="h.id" :timestamp="formatTime(h.createdAt)"
        :type="h.action === 'create' ? 'success' : 'primary'">
        <div class="log-box">
          <p class="log-user"><strong>{{ h.operatorName }}</strong> {{ actionLabel(h.action) }}</p>
          <div v-if="h.title" class="log-title">{{ h.title }}</div>
          <div v-if="h.content" class="log-content">{{ h.content }}</div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/utils/date'
import type { PropType } from 'vue'
import type { NotepadHistoryData } from '@/types'

const props = defineProps({
  visible: { type: Boolean, required: true },
  list: { type: Array as PropType<NotepadHistoryData[]>, default: () => [] },
})

defineEmits(['update:visible'])

const safeList = computed(() =>
  props.list.map(item => ({
    ...item,
    id: item.id ?? 0,
    action: item.action || '',
    operatorName: item.operatorName || '',
    title: item.title || '',
    content: item.content || '',
    createdAt: item.createdAt || ''
  }))
)

const formatTime = (v: string) => formatDateTime(v)

const actionLabel = (a: string): string =>
({
  create: '创建了笔记',
  update: '更新了内容',
  pin: '置顶了笔记',
  unpin: '取消了置顶',
  delete: '删除了笔记'
}[a] || a)
</script>

<style scoped>
.custom-timeline {
  padding: 8px 0;
}

.log-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.log-user {
  margin: 0 0 4px;
  font-size: 13px;
}

.log-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.log-content {
  font-size: 13px;
  color: #475569;
  white-space: pre-wrap;
  max-height: 120px;
  overflow: hidden;
}
</style>
