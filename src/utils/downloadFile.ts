import { ElMessage } from 'element-plus'

interface DownloadFileOptions {
  url: string
  name?: string
}

/**
 * 通过后端下载接口拉取附件并以浏览器下载方式保存
 * - 先 fetch 拿 blob，失败时回退到 window.open
 * - 复用于订单/合同历史等附件下载场景
 */
export const downloadFile = async ({ url, name }: DownloadFileOptions): Promise<void> => {
  const fileName = name || 'download'
  let msg: { close: () => void } | null = null
  try {
    msg = ElMessage.info({ message: `正在准备下载 ${fileName}...`, duration: 0 })
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const downloadUrl = `${baseUrl}/api/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`

    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error('Network response was not ok')

    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(objectUrl)

    if (msg) msg.close()
    ElMessage.success(`文件 ${fileName} 下载成功`)
  } catch (error) {
    console.error('Download failed, falling back to window.open:', error)
    if (msg) msg.close()
    ElMessage.warning('下载可能会在后台进行或已被拦截，尝试新窗口打开...')
    window.open(url, '_blank')
  }
}

export default downloadFile
