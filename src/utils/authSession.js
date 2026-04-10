import router from '@/router'
import { ElMessage } from 'element-plus'
import { resetBreadcrumbTabs } from '@/composables/useBreadcrumbTabs'

let logoutInProgress = false

const reasonMessageMap = {
  SESSION_REVOKED: '账号已在其他设备登录，请重新登录',
  TOKEN_EXPIRED: '登录状态已过期，请重新登录',
  TOKEN_INVALID: '登录状态无效，请重新登录'
}

export const clearAuthStorage = () => {
  resetBreadcrumbTabs()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const handleAuthExpired = (reasonCode) => {
  if (logoutInProgress) return
  logoutInProgress = true

  const message = reasonMessageMap[reasonCode] || '登录状态失效，请重新登录'
  ElMessage.warning(message)

  clearAuthStorage()

  router.replace('/login').finally(() => {
    setTimeout(() => {
      logoutInProgress = false
    }, 300)
  })
}

export const logoutByUser = () => {
  clearAuthStorage()
  return router.replace('/login')
}
