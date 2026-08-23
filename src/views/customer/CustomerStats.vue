<template>
<div class="stats-row">
        <div
          class="stat-card"
          :class="{
            active: activeStat === ''
          }"
          @click="handleStatClick('')"
        >
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部客户</div>
        </div>
        <div
          class="stat-card stat-undealt"
          :class="{ active: activeStat === '未成交' }"
          @click="handleStatClick('未成交')"
        >
          <div class="stat-value">{{ stats.undealt }}</div>
          <div class="stat-label">未成交</div>
        </div>
        <div
          class="stat-card stat-dealt"
          :class="{ active: activeStat === '成交' }"
          @click="handleStatClick('成交')"
        >
          <div class="stat-value">{{ stats.dealt }}</div>
          <div class="stat-label">成交</div>
        </div>
        <div
          class="stat-card stat-pending"
          :class="{ active: activeStat === '待催款' }"
          @click="handleStatClick('待催款')"
        >
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待催款</div>
        </div>
        <div
          class="stat-card stat-settled"
          :class="{ active: activeStat === '已结款' }"
          @click="handleStatClick('已结款')"
        >
          <div class="stat-value">{{ stats.settled }}</div>
          <div class="stat-label">已结款</div>
        </div>
        <div
          class="stat-card stat-not-ordered"
          :class="{ active: activeStat === '未下单' }"
          @click="handleStatClick('未下单')"
        >
          <div class="stat-value">{{ stats.notOrdered }}</div>
          <div class="stat-label">未下单</div>
        </div>
        <div
          class="stat-card stat-ordered"
          :class="{ active: activeStat === '已下单' }"
          @click="handleStatClick('已下单')"
        >
          <div class="stat-value">{{ stats.ordered }}</div>
          <div class="stat-label">已下单</div>
        </div>
        <div
          class="stat-card stat-installed"
          :class="{ active: activeStat === '已安装' }"
          @click="handleStatClick('已安装')"
        >
          <div class="stat-value">{{ stats.installed }}</div>
          <div class="stat-label">已安装</div>
        </div>
        <div
          class="stat-card stat-dealer"
          :class="{ active: activeStat === '经销商' }"
          @click="handleStatClick('经销商')"
        >
          <div class="stat-value">{{ stats.dealer }}</div>
          <div class="stat-label">经销商</div>
        </div>
        <div
          class="stat-card stat-terminal"
          :class="{ active: activeStat === '终端' }"
          @click="handleStatClick('终端')"
        >
          <div class="stat-value">{{ stats.terminal }}</div>
          <div class="stat-label">终端</div>
        </div>
      </div>

      </template>

<script setup lang="ts">
defineProps<{ stats: Record<string, number>, activeStat: string }>();
const emit = defineEmits<{ (e: "stat-click", stat: string): void }>();
const handleStatClick = (stat: string) => { emit("stat-click", stat); };
</script>
<style scoped>
.stats-row {
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
.stat-undealt .stat-value {
  color: #64748b;
}
.stat-dealt .stat-value {
  color: #3b82f6;
}
.stat-pending .stat-value {
  color: #ef4444;
}
.stat-settled .stat-value {
  color: #22c55e;
}
.stat-ordered .stat-value {
  color: #409eff;
}
.stat-not-ordered .stat-value {
  color: #94a3b8;
}
.stat-installed .stat-value {
  color: #10b981;
}
.stat-dealer .stat-value {
  color: #f59e0b;
}
.stat-terminal .stat-value {
  color: #06b6d4;
}
</style>
