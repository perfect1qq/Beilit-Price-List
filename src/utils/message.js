import { ElMessage } from 'element-plus'

const extractMessage = (err, fallback = '操作失败') => {
  if (!err) return fallback
  return err?.response?.data?.message || err?.message || fallback
}

const showError = (err, fallback = '操作失败') =>
  ElMessage.error(extractMessage(err, fallback))

const showSuccess = (msg = '操作成功') =>
  ElMessage.success(msg)

const showWarning = (msg) =>
  ElMessage.warning(msg)

const showInfo = (msg) =>
  ElMessage.info(msg)

export { showError, showSuccess, showWarning, showInfo, extractMessage }
