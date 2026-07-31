import { ElMessage, ElMessageBox } from 'element-plus'

interface ConfirmDeleteOptions {
  /** 对话框标题，默认"提示" */
  title?: string
  /** 确认按钮文本，默认"确定" */
  confirmText?: string
  /** 取消按钮文本，默认"取消" */
  cancelText?: string
  /** 对话框类型，默认 warning */
  type?: 'warning' | 'info' | 'success' | 'error'
  /** 成功提示文案，默认"删除成功" */
  successMsg?: string
  /** 失败提示文案，默认"删除失败" */
  errorMsg?: string
}

/**
 * 删除确认 + 执行 + 消息提示的通用流程
 * @returns true 表示用户确认并删除成功；false 表示用户取消或删除失败
 */
const confirmAndDelete = async (
  message: string,
  deleteFn: () => Promise<unknown>,
  options: ConfirmDeleteOptions = {}
): Promise<boolean> => {
  const {
    title = '提示',
    confirmText = '确定',
    cancelText = '取消',
    type = 'warning',
    successMsg = '删除成功',
    errorMsg = '删除失败'
  } = options

  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type
    })
    await deleteFn()
    ElMessage.success(successMsg)
    return true
  } catch (err) {
    // 用户点击取消时 err === 'cancel'，不提示错误
    if (err !== 'cancel') ElMessage.error(errorMsg)
    return false
  }
}

export { confirmAndDelete }
