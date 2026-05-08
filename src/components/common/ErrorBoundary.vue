/**
* @module components/common/ErrorBoundary
* @description 全局错误边界组件
*
* 捕获子组件树中的 JavaScript 错误，防止白屏崩溃。
* 提供友好的错误展示和恢复机制。
*
* @example
* &lt;ErrorBoundary&gt;
* &lt;YourComponent /&gt;
* &lt;/ErrorBoundary&gt;
*
* @example
* &lt;ErrorBoundary @error="onGlobalError"&gt;
* &lt;RouterView /&gt;
* &lt;/ErrorBoundary&gt;
*/

<template>
  <div class="error-boundary">
    <!-- 正常渲染子组件 -->
    <slot v-if="!hasError" />

    <!-- 错误状态展示 -->
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

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['error'])

/** 是否捕获到错误 */
const hasError = ref(false)

/** 错误信息 */
const errorMessage = ref('未知错误')

const router = useRouter()

/**
 * 捕获子组件错误
 * Vue 的错误生命周期钩子，当子组件抛出未捕获异常时触发
 */
onErrorCaptured((err, instance, info) => {
  // 捕获到组件错误

  hasError.value = true
  errorMessage.value = err?.message || String(err)

  emit('error', { error: err, instance, info })

  return false
})

/** 重试：重新渲染子组件 */
const handleRetry = () => {
  hasError.value = false
  errorMessage.value = ''
}

/** 返回首页 */
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
  border-radius: 12px;
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
