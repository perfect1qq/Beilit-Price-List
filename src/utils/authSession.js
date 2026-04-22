/**
 * @module utils/authSession
 * @description 认证会话管理
 * 
 * 处理 Token 存储和认证过期逻辑：
 * - Token 的存取与清除
 * - 401 错误时的自动跳转登录
 * - SESSION_REVOKED 时的友好提示
 * - 用户主动登出
 */

import { ElMessage } from 'element-plus'
import router from '../router'
import { logout } from '@/api/user'
import { to } from '@/utils/async'

/** Session 被撤销的错误码 */
const SESSION_REVOKED_CODE = 'SESSION_REVOKED'

/**
 * 获取当前 Token
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem('token')

/**
 * 设置 Token
 * @param {string} token - JWT Token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
  }
}

/**
 * 清除认证信息并跳转登录页
 * @param {string} [reasonCode] - 过期原因码（用于区分提示）
 */
export const clearAuthAndRedirect = (reasonCode) => {
  localStorage.removeItem('token')
  
  if (reasonCode === SESSION_REVOKED_CODE) {
    ElMessage.warning('账号已在其他设备登录')
  }
  
  router.push('/login').then(() => {}).catch(() => {})
}

/**
 * 处理认证过期
 * @param {string} [code] - 服务端返回的过期原因码
 */
export const handleAuthExpired = (code) => clearAuthAndRedirect(code)

/**
 * 用户主动登出（调用后端接口 + 清除本地状态）
 */
export const logoutByUser = async () => {
  await to(logout())
  clearAuthAndRedirect()
}

export default { getToken, setToken, handleAuthExpired, logoutByUser }
