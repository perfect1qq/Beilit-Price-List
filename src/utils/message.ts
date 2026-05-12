import { ElMessage } from 'element-plus'

interface AxiosLikeError {
  response?: { data?: { message?: string } }
  message?: string
}

const extractMessage = (err: AxiosLikeError | null | undefined, fallback: string = '操作失败'): string => {
  if (!err) return fallback
  return err?.response?.data?.message || err?.message || fallback
}

const showError = (err: unknown, fallback: string = '操作失败'): void => {
  const msg = extractMessage(err as AxiosLikeError, fallback)
  try {
    ElMessage.error(msg)
  } catch (_e) {
    console.error('[showError]', msg)
    alert(msg)
  }
}

const showSuccess = (msg: string = '操作成功'): void => {
  try {
    ElMessage.success(msg)
  } catch (_e) {
    console.warn('[showSuccess]', msg)
  }
}

const showWarning = (msg: string): void => {
  try {
    ElMessage.warning(msg)
  } catch (_e) {
    console.warn('[showWarning]', msg)
  }
}

const showInfo = (msg: string): void => {
  try {
    ElMessage.info(msg)
  } catch (_e) {
    console.warn('[showInfo]', msg)
  }
}

export { showError, showSuccess, showWarning, showInfo, extractMessage }
