import { ElMessage } from 'element-plus'

interface DownloadFileOptions {
  url: string
  name?: string
}

/**
 * 通过后端下载接口拉取附件并以浏览器下载方式保存
 * - 直接通过新标签页打开，借助浏览器的原生 cookie 传递能力
 * - 避免跨域 fetch blob 被拦截或产生内存占用问题
 */
export const downloadFile = ({ url, name }: DownloadFileOptions): void => {
  const fileName = name || 'download'
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const downloadUrl = `${baseUrl}/api/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`

  // 借助原生标签页打开，由于是同步的 click 事件触发，不会被 popup blocker 拦截
  // 如果后端返回 Content-Disposition: attachment，浏览器会下载并立即自动关闭该空白标签页
  window.open(downloadUrl, '_blank')
  ElMessage.success(`正在准备下载 ${fileName}...`)
}

export default downloadFile
