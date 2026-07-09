<template>
  <div class="auth-page">
    <div class="auth-wrap">
      <el-card shadow="never" class="auth-card">
        <div class="card-head">
          <div class="card-title">{{ cardTitle }}</div>
          <div class="card-sub">{{ cardSubtitle }}</div>
        </div>

        <slot></slot>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  cardTitle: {
    type: String,
    required: true
  },
  cardSubtitle: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f7fa;
}

.auth-wrap {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 36px 32px;
  background: #fff;
}

.card-head {
  margin-bottom: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.card-sub {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

:deep(.form .el-input__wrapper) {
  border-radius: 8px;
  height: 46px;
  background: #f5f7fa;
  box-shadow: 0 0 0 1px #e5e7eb inset;
}

:deep(.form .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
  background: #fff;
}

:deep(.form .el-input__prefix) {
  color: #94a3b8;
  font-size: 18px;
}

:deep(.login-btn) {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  background: #3b82f6;
  border: none;
  transition: all 0.25s ease;
}

:deep(.login-btn:hover) {
  background: #2563eb;
  transform: translateY(-1px);
}

:deep(.footer-links) {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #64748b;
  font-size: 14px;
  line-height: 1;
}

:deep(.footer-links .el-link) {
  font-weight: 600;
  color: #3b82f6;
  display: inline-flex;
  align-items: center;
}

@media (max-width: 768px) {
  .auth-page {
    padding: 14px;
    align-items: stretch;
  }

  .auth-wrap {
    max-width: 420px;
    margin: auto;
  }

  .auth-card {
    border-radius: 10px;
    padding: 28px 24px;
  }

  .card-head {
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 18px;
  }

  .card-sub {
    margin-top: 4px;
    font-size: 13px;
  }

  :deep(.form .el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.form .el-input__wrapper) {
    height: 44px;
  }

  :deep(.login-btn) {
    height: 44px;
    margin-top: 6px;
    font-size: 15px;
  }
}

@media (max-width: 420px) {
  .auth-page {
    padding: 10px;
  }

  .auth-card {
    padding: 20px 16px;
  }
}
</style>
