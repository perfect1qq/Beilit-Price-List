import { showError, showSuccess } from '@/utils/message'

export const useClipboard = () => {
  const copy = async (text: string, successMsg: string = '已复制到剪贴板'): Promise<boolean> => {
    if (!text) return false

    try {
      await navigator.clipboard.writeText(text)
      showSuccess(successMsg)
      return true
    } catch {
      showError('复制失败，请手动复制')
      return false
    }
  }

  return { copy }
}
