<template>
  <div class="stats-row">
    <!-- 1. 全部客户 -->
    <div
      class="stat-card"
      :class="{ active: activeStat === '' }"
      @click="handleStatClick('')"
    >
      <div class="stat-value">{{ stats.total }}</div>
      <div class="stat-label">全部客户</div>
    </div>

    <!-- 2. 已合作 -->
    <div
      class="stat-card stat-cooperated"
      :class="{ active: activeStat === '已合作' }"
      @click="handleStatClick('已合作')"
    >
      <div class="stat-value">{{ stats.dealt ?? 0 }}</div>
      <div class="stat-label">已合作</div>
    </div>

    <!-- 3. 未合作（原潜在客户） -->
    <div
      class="stat-card stat-uncooperated"
      :class="{ active: activeStat === '未合作' }"
      @click="handleStatClick('未合作')"
    >
      <div class="stat-value">{{ stats.undealt ?? 0 }}</div>
      <div class="stat-label">未合作</div>
    </div>

    <!-- 4. 待排产（车间状态为待排产） -->
    <div
      class="stat-card stat-pending-schedule"
      :class="{ active: activeStat === '待排产' }"
      @click="handleStatClick('待排产')"
    >
      <div class="stat-value">{{ stats.pendingSchedule ?? stats.notOrdered ?? 0 }}</div>
      <div class="stat-label">待排产</div>
    </div>

    <!-- 5. 待现场安装订单客户 -->
    <div
      class="stat-card stat-pending-install"
      :class="{ active: activeStat === '待现场安装' }"
      @click="handleStatClick('待现场安装')"
    >
      <div class="stat-value">{{ stats.reorderInstall ?? stats.pendingInstall ?? 0 }}</div>
      <div class="stat-label">待现场安装</div>
    </div>

    <!-- 6. 未开票（合作客户+未开票客户） -->
    <div
      class="stat-card stat-uninvoiced"
      :class="{ active: activeStat === '未开票' }"
      @click="handleStatClick('未开票')"
    >
      <div class="stat-value">{{ stats.uninvoiced ?? stats.ordered ?? 0 }}</div>
      <div class="stat-label">未开票</div>
    </div>

    <!-- 7. 待催款客户 -->
    <div
      class="stat-card stat-pending"
      :class="{ active: activeStat === '待催款' }"
      @click="handleStatClick('待催款')"
    >
      <div class="stat-value">{{ stats.pending ?? 0 }}</div>
      <div class="stat-label">待催款</div>
    </div>

    <!-- 8. 已结清客户 -->
    <div
      class="stat-card stat-settled"
      :class="{ active: activeStat === '已结清' }"
      @click="handleStatClick('已结清')"
    >
      <div class="stat-value">{{ stats.settled ?? 0 }}</div>
      <div class="stat-label">已结清</div>
    </div>

    <!-- 9. 渠道：经销商 -->
    <div
      class="stat-card stat-dealer"
      :class="{ active: activeStat === '经销商' }"
      @click="handleStatClick('经销商')"
    >
      <div class="stat-value">{{ stats.dealer ?? 0 }}</div>
      <div class="stat-label">经销商</div>
    </div>

    <!-- 10. 渠道：终端 -->
    <div
      class="stat-card stat-terminal"
      :class="{ active: activeStat === '终端' }"
      @click="handleStatClick('终端')"
    >
      <div class="stat-value">{{ stats.terminal ?? 0 }}</div>
      <div class="stat-label">终端</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ stats: Record<string, number>; activeStat: string }>();
const emit = defineEmits<{ (e: "stat-click", stat: string): void }>();
const handleStatClick = (stat: string) => {
  emit("stat-click", stat);
};
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
  min-width: 95px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
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
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  white-space: nowrap;
}
.stat-cooperated .stat-value {
  color: #10b981;
}
.stat-uncooperated .stat-value {
  color: #64748b;
}
.stat-pending-schedule .stat-value {
  color: #f59e0b;
}
.stat-ordered .stat-value,
.stat-uninvoiced .stat-value {
  color: #0284c7;
}
.stat-pending .stat-value {
  color: #ef4444;
}
.stat-settled .stat-value {
  color: #16a34a;
}
.stat-pending-install .stat-value {
  color: #6366f1;
}
.stat-dealer .stat-value {
  color: #8b5cf6;
}
.stat-terminal .stat-value {
  color: #0891b2;
}
</style>
