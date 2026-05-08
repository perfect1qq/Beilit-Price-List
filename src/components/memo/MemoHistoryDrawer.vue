<!--
  @file components/memo/MemoHistoryDrawer.vue
  @description 备忘录修改历史抽屉组件
-->

<template>
  <el-drawer :model-value="visible" @update:model-value="$emit('update:visible', $event)" :title="title" size="420px">
    <el-timeline v-if="list.length" class="custom-timeline">
      <el-timeline-item v-for="h in list" :key="h.id" :timestamp="formatTime(h.createdAt)"
        :type="h.action === 'complete' ? 'success' : 'primary'">
        <div class="log-box">
          <p class="log-user"><strong>{{ h.operatorName }}</strong> {{ actionLabel(h.action) }}</p>
          <div class="log-content">{{ h.content }}</div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else />
  </el-drawer>
</template>

<script setup>
import { formatDateTime } from '@/utils/navigation'

defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: '日志' },
  list: { type: Array, default: () => [] },
})

defineEmits(['update:visible'])

const formatTime = (v) => formatDateTime(v)

const actionLabel = (a) =>
  ({
    create: '创建了任务',
    update: '更新了内容',
    complete: '完成了任务',
    reopen: '重新开启了任务'
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
.log-content {
  font-size: 13px;
  color: #475569;
  white-space: pre-wrap;
}
</style>
