

<template>
  <div class="error-boundary">

    <slot v-if="!hasError" />


    <div v-else class="error-fallback">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">页面出现异常</h2>
      <p class="error-message">{{ errorMessage }}</p>

      <div class="error-actions">
        <el-button type="primary" @click="handleRetry">
          重新加载
        </el-button>
        <el-button @click="handleGoHome">
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['error'])


const hasError = ref(false)


const errorMessage = ref('未知错误')

const router = useRouter()



onErrorCaptured((err, instance, info) => {


  hasError.value = true
  errorMessage.value = err?.message || String(err)

  emit('error', { error: err, instance, info })

  return false
})


const handleRetry = () => {
  hasError.value = false
  errorMessage.value = ''
}


const handleGoHome = () => {
  handleRetry()
  router.push('/home')
}

</script>

<style scoped>
.error-boundary {
  width: 100%;
  min-height: 200px;
}

.error-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: #fef2f2;
  border-radius: 10px;
  border: 1px solid #fecaca;
  margin: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 20px;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.error-message {
  color: #b91c1c;
  font-size: 14px;
  max-width: 500px;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
