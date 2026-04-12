<template>
  <el-row :gutter="16" class="memo-stats">
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
        <div class="stat-inner" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
          <div class="stat-label">{{ scopeStatCopy.totalLabel }}</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-tip">{{ scopeStatCopy.totalTip }}</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
        <div class="stat-inner" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
          <div class="stat-label">未完成</div>
          <div class="stat-value">{{ stats.todoTotal }}</div>
          <div class="stat-tip">{{ scopeStatCopy.todoTip }}</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
        <div class="stat-inner" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ stats.doneTotal }}</div>
          <div class="stat-tip">{{ scopeStatCopy.doneTip }}</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
        <div class="stat-inner" :class="{ 'is-history': scopeStatCopy.mode === 'history' }">
          <div class="stat-label">置顶</div>
          <div class="stat-value">{{ stats.pinnedTotal }}</div>
          <div class="stat-tip">{{ scopeStatCopy.pinnedTip }}</div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
defineProps({
  stats: { type: Object, required: true },
  scopeStatCopy: { type: Object, required: true }
})
</script>

<style scoped>
.memo-stats {
  margin-bottom: 0;
}

.stat-card {
  height: 100%;
  min-height: 116px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.stat-card.is-history {
  border-color: #dbeafe;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.stat-card.is-history:hover {
  border-color: #bfdbfe;
}

.stat-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.stat-inner.is-history .stat-label {
  color: #475569;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  line-height: 1.2;
  letter-spacing: 0.2px;
}

.stat-value {
  margin-top: 2px;
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.stat-inner.is-history .stat-value {
  color: #1d4ed8;
}

.stat-tip {
  margin-top: 0;
  min-height: 2.2em;
  font-size: 12px;
  line-height: 1.35;
  color: #94a3b8;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.stat-inner.is-history .stat-tip {
  min-height: 2em;
  color: #64748b;
}
</style>
