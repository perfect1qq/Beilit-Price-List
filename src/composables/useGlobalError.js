/**
 * @module composables/useGlobalError
 * @description 全局错误处理组合式函数
 * 
 * 提供统一的全局错误捕获和处理机制：
 * - Vue 组件错误捕获
 * - Promise 未捕获异常处理
 * - 资源加载错误处理
 * - 错误上报（可扩展 Sentry 等服务）
 * 
 * @example
 * const { registerGlobalHandlers, lastError, errorCount } = useGlobalError()
 * 
 * // 在 App.vue 的 onMounted 中调用
 * onMounted(() => registerGlobalHandlers())
 */

import { ref } from 'vue'

/**
 * 全局错误处理 composable
 * 
 * @returns {Object} 错误处理状态和方法
 * @returns {import('vue').Ref<Object|null>} returns.lastError - 最近一次错误信息
 * @returns {import('vue').Ref<number>} returns.errorCount - 错误累计次数
 * @returns {Function} returns.registerGlobalHandlers - 注册全局错误处理器
 * @returns {Function} returns.clearErrors - 清除错误记录
 */
export const useGlobalError = () => {
  /** 最近一次错误信息 */
  const lastError = ref(null)

  /** 错误累计次数（本次会话） */
  const errorCount = ref(0)

  /**
   * 处理并记录错误
   * 
   * @param {Error|string} error - 错误对象或消息
   * @param {string} [source='unknown'] - 错误来源标识
   */
  const handleError = (error, source = 'unknown') => {
    const errorInfo = {
      message: error?.message || String(error),
      stack: error?.stack || '',
      source,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    lastError.value = errorInfo
    errorCount.value += 1

    return errorInfo
  }

  /**
   * 注册全局错误处理器
   * 
   * 捕获以下类型的未处理异常：
   * - unhandledrejection: Promise rejection 未被 catch
   * - error: window.onerror 捕获的同步/异步错误
   */
  const registerGlobalHandlers = () => {
    /**
     * 处理未捕获的 Promise rejection
     * 常见场景：async 函数中的 throw 未被 catch
     */
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault()
      handleError(event.reason, 'unhandled-promise')
    })

    /**
     * 处理全局 JavaScript 错误
     * 作为最后的安全网，捕获所有未被组件 try/catch 的错误
     */
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        handleError(new Error(`资源加载失败: ${event.target.src || event.target.href}`), 'resource-error')
        return
      }
      handleError(event.error, 'global-error')
    })
  }

  /** 清除错误记录 */
  const clearErrors = () => {
    lastError.value = null
    errorCount.value = 0
  }

  return {
    lastError,
    errorCount,
    registerGlobalHandlers,
    clearErrors,
    handleError
  }
}
