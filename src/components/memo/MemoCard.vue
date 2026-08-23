<template>
  <div :class="['card', item.color, { 'is-pinned': item.pinned, 'is-completed': item.completed, 'is-highlighted': highlightId === item.id }]"
    :data-memo-id="item.id">
    <div class="card-inner">
      <div v-if="boardMode" class="card-side">
        <el-checkbox :model-value="item.completed" @change="() => $emit('toggle-completed', item)" />
      </div>

      <el-checkbox v-else :model-value="item.completed" @change="() => $emit('toggle-completed', item)" />

      <div class="card-main" @click="$emit('edit', item)">
        <div class="card-header">
          <span class="card-title">{{ item.title }}</span>
          <el-tag v-if="boardMode && item.pinned" size="small" type="warning" effect="dark" round>
            置顶
          </el-tag>
          <el-tag v-if="!boardMode && item.completed" size="small" type="success">DONE</el-tag>
        </div>

        <p class="card-body">{{ item.content }}</p>

        <div v-if="boardMode" class="card-meta">
          <span class="date">{{ formatTime(item.updatedAt) }}</span>
        </div>
      </div>

      <div v-if="boardMode" class="card-actions">
        <el-dropdown trigger="click" :disabled="isGuest">
          <AppButton link :icon="MoreFilled"></AppButton>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="!isGuest" @click="$emit('edit', item)">编辑详情</el-dropdown-item>
              <el-dropdown-item v-if="!isGuest" @click="$emit('toggle-pinned', item)">
                {{ item.pinned ? '取消置顶' : '置顶任务' }}
              </el-dropdown-item>
              <el-dropdown-item @click="$emit('history', item)">查看日志</el-dropdown-item>
              <el-dropdown-item v-if="!isGuest" divided style="color: #f56c6c" @click="$emit('remove', item)">
                彻底删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div v-else class="card-actions">
        <template v-if="!isGuest">
          <AppButton variant="edit" @click="$emit('edit', item)">编辑</AppButton>
          <AppButton variant="delete" @click="$emit('remove', item)">删除</AppButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/date'
import type { MemoData } from '@/types'

defineProps({
  item: { type: Object as PropType<MemoData>, required: true },
  boardMode: { type: Boolean, default: true },
  highlightId: { type: Number, default: null },
  isGuest: { type: Boolean, default: false }
})

defineEmits(['toggle-completed', 'edit', 'toggle-pinned', 'history', 'remove'])

const formatTime = (v: string | undefined) => formatDateTime(v || '')
</script>

<style scoped>
.card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: default;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 4px;
  border-radius: 0 4px 4px 0;
}

.card.blue::after { background: #3b82f6; }
.card.green::after { background: #10b981; }
.card.amber::after { background: #f59e0b; }
.card.rose::after { background: #f43f5e; }
.card.purple::after { background: #a855f7; }

.card.is-completed {
  opacity: 0.6;
}

.card.is-completed .card-title {
  text-decoration: line-through;
  color: #94a3b8;
}

.card.is-highlighted {
  animation: highlight-pulse 1.5s ease-out;
  box-shadow: 0 0 0 3px #3b82f6, 0 12px 24px -8px rgba(59, 130, 246, 0.3);
}

@keyframes highlight-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.card-inner {
  padding: 18px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.card-main {
  flex: 1;
  cursor: pointer;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.card-body {
  font-size: 13px;
  color: #475569;
  margin: 0 0 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag {
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.date {
  font-size: 11px;
  color: #cbd5e1;
}
</style>

