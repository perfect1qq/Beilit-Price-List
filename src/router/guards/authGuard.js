/**
 * @module router/guards/authGuard
 * @description 全局路由鉴权守卫
 * 
 * 统一处理页面访问权限：
 * - 公开页面（登录/注册）无需认证
 * - 已登录用户访问登录页时重定向到首页
 * - 管理员专属页面做角色校验
 * - 未登录用户重定向到登录页
 */

import { readCurrentUser } from '@/utils/navigation'

/**
 * 应用全局鉴权守卫
 * @param {Object} to - 目标路由对象
 * @returns {string|boolean} 重定向路径或允许访问（true）
 */
export const applyAuthGuard = (to) => {
  const token = localStorage.getItem('token')
  const user = readCurrentUser()

  /** 公开页面处理 */
  if (to.meta.public) {
    if (token && (to.path === '/login' || to.path === '/register')) {
      return '/'
    }
    return true
  }

  /** 未登录拦截 */
  if (!token) {
    return '/login'
  }

  /** 管理员权限校验 */
  if (to.meta.adminOnly && user.role !== 'admin') {
    return '/'
  }

  return true
}
