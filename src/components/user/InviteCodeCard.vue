<template>
  <el-card shadow="never" class="card invite-code-card">
    <div class="invite-section">
      <div class="invite-left">
        <div class="invite-label">
          <el-icon class="invite-icon">
            <Key />
          </el-icon>
          <span>注册邀请码</span>
        </div>
        <p class="invite-desc">新用户注册时需要输入此邀请码，分享给需要注册的同事</p>
      </div>
      <div class="invite-right">
        <div class="invite-code-display">
          <span class="code-text">{{ code || '加载中...' }}</span>
          <el-button type="primary" text :icon="CopyDocument" @click="$emit('copy')" :disabled="!code">复制</el-button>
          <el-button type="warning" text :icon="Refresh" @click="$emit('refresh')" :loading="refreshing">刷新</el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Key, CopyDocument, Refresh } from '@element-plus/icons-vue'

defineProps({
  code: { type: String, default: '' },
  refreshing: { type: Boolean, default: false }
})

defineEmits(['copy', 'refresh'])
</script>

<style scoped>
.invite-code-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: none;
}

.invite-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.invite-left {
  flex: 1;
  min-width: 200px;
}

.invite-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.invite-icon {
  color: #3b82f6;
  font-size: 20px;
}

.invite-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.invite-right {
  flex-shrink: 0;
}

.invite-code-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-radius: 12px;
  border: 1px solid #c7d2fe;
}

.code-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #4338ca;
  user-select: all;
}
</style>
