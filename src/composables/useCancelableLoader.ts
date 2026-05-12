import { onUnmounted, ref, type Ref } from 'vue'

interface TaskContext {
  signal: AbortSignal
  seq: number
}

interface TaskResult<T = unknown> {
  ok: boolean
  canceled: boolean
  result?: T
  error?: Error & { code?: string; response?: { data?: { message?: string } } }
  seq: number
}

interface CancelableLoaderReturn {
  loading: Ref<boolean>
  loadError: Ref<string>
  run: <T>(task: (ctx: TaskContext) => Promise<T>) => Promise<TaskResult<T>>
  isLatest: (seq: number) => boolean
}

export const useCancelableLoader = (): CancelableLoaderReturn => {
  const loading = ref(false)
  const loadError = ref('')
  let abortController: AbortController | null = null
  let requestSeq = 0

  const run = async <T>(task: (ctx: TaskContext) => Promise<T>): Promise<TaskResult<T>> => {
    if (abortController) abortController.abort()
    abortController = new AbortController()
    const signal = abortController.signal
    const seq = ++requestSeq

    loading.value = true
    loadError.value = ''

    try {
      const result = await task({ signal, seq })
      return { ok: true, canceled: false, result, seq }
    } catch (error: unknown) {
      const err = error as Error & { code?: string; response?: { data?: { message?: string } } }
      if (err?.code === 'ERR_CANCELED') {
        return { ok: false, canceled: true, error: err, seq }
      }
      loadError.value = err?.response?.data?.message || err?.message || '请求失败'
      return { ok: false, canceled: false, error: err, seq }
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  const isLatest = (seq: number): boolean => seq === requestSeq

  onUnmounted(() => {
    if (abortController) abortController.abort()
  })

  return {
    loading,
    loadError,
    run,
    isLatest
  }
}
