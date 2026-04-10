<template>
  <el-row :gutter="16" class="memo-stats">
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card">
        <div class="stat-label">{{ scopeStatCopy.totalLabel }}</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-tip">{{ scopeStatCopy.totalTip }}</div>
      </el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card">
        <div class="stat-label">未完成</div>
        <div class="stat-value">{{ stats.todoTotal }}</div>
        <div class="stat-tip">{{ scopeStatCopy.todoTip }}</div>
      </el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card">
        <div class="stat-label">已完成</div>
        <div class="stat-value">{{ stats.doneTotal }}</div>
        <div class="stat-tip">{{ scopeStatCopy.doneTip }}</div>
      </el-card>
    </el-col>
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="never" class="stat-card">
        <div class="stat-label">置顶</div>
        <div class="stat-value">{{ stats.pinnedTotal }}</div>
        <div class="stat-tip">{{ scopeStatCopy.pinnedTip }}</div>
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
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.stat-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}
</style>
