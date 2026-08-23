<template>
  <div class="not-found-page">
    <el-card class="not-found-card" shadow="never">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <div class="error-title">页面不存在</div>
        <p class="error-desc">您访问的页面可能已被删除、移动，或地址输入有误。</p>
        <div class="error-actions">
          <AppButton variant="primary" @click="goHome">返回首页</AppButton>
          <AppButton @click="goBack">返回上一页</AppButton>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({ name: 'NotFound' })

const router = useRouter()

const goHome = () => {
  router.push('/home')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-page {
  padding: 20px;
}

.not-found-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-code {
  font-size: 96px;
  font-weight: 700;
  color: #4f46e5;
  line-height: 1;
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.error-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.error-desc {
  font-size: 14px;
  color: #64748b;
  max-width: 420px;
  line-height: 1.6;
  margin: 0 0 28px 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>

