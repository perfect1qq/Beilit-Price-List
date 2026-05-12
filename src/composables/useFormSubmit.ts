/**
 * @module composables/useFormSubmit
 * @description 表单提交防重复工具
 *
 * 功能：
 * - 防止表单重复提交（锁定机制）
 * - 自动管理加载状态
 * - 统一错误处理
 *
 * 使用示例：
 * ```javascript
 * const { submitLoading, withSubmitLock } = useFormSubmit()
 *
 * const handleSubmit = async () => {
 *   await withSubmitLock(async () => {
 *     // 提交逻辑...
 *   })
 * }
 * ```
 */

import { ref, type Ref } from 'vue'

interface FormSubmitOptions {
  lockDuration?: number
}

interface FormSubmitReturn {
  submitLoading: Ref<boolean>
  withSubmitLock: <T>(fn: () => Promise<T>) => Promise<T | null>
  resetSubmitState: () => void
}

export const useFormSubmit = (options: FormSubmitOptions = {}): FormSubmitReturn => {
  const { lockDuration = 300 } = options

  const submitLoading = ref(false)
  let lastSubmitTime = 0

  const withSubmitLock = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (submitLoading.value) {
      return null
    }

    const now = Date.now()
    if (now - lastSubmitTime < lockDuration) {
      return null
    }

    submitLoading.value = true
    lastSubmitTime = now

    try {
      const result = await fn()
      return result
    } finally {
      setTimeout(() => {
        submitLoading.value = false
      }, lockDuration)
    }
  }

  const resetSubmitState = (): void => {
    submitLoading.value = false
    lastSubmitTime = 0
  }

  return {
    submitLoading,
    withSubmitLock,
    resetSubmitState
  }
}

export default useFormSubmit
