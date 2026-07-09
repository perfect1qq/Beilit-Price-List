<template>
  <div class="memo-stats">
    <div
      :class="['stat-card', { active: activeFilter === 'all' }]"
      @click="$emit('filter-click', 'all')"
    >
      <div class="stat-value">{{ stats.total }}</div>
      <div class="stat-label">全部任务</div>
    </div>
    <div
      :class="['stat-card', 'stat-todo', { active: activeFilter === 'todo' }]"
      @click="$emit('filter-click', 'todo')"
    >
      <div class="stat-value">{{ stats.todoTotal }}</div>
      <div class="stat-label">未完成</div>
    </div>
    <div
      :class="['stat-card', 'stat-done', { active: activeFilter === 'done' }]"
      @click="$emit('filter-click', 'done')"
    >
      <div class="stat-value">{{ stats.doneTotal }}</div>
      <div class="stat-label">已完成</div>
    </div>
    <div
      :class="['stat-card', 'stat-pinned', { active: activeFilter === 'pinned' }]"
      @click="$emit('filter-click', 'pinned')"
    >
      <div class="stat-value">{{ stats.pinnedTotal }}</div>
      <div class="stat-label">置顶</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { MemoStatsData } from "@/types";
defineProps({
  stats: { type: Object as PropType<MemoStatsData>, required: true },
  activeFilter: { type: String, default: "all" },
});
defineEmits(["filter-click"]);
</script>

<style scoped>
.memo-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 100px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.stat-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.stat-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.stat-todo .stat-value {
  color: #f59e0b;
}

.stat-done .stat-value {
  color: #22c55e;
}

.stat-pinned .stat-value {
  color: #8b5cf6;
}
</style>
