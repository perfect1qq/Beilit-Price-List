import { readCurrentUser } from '@/utils/navigation'

/**
 * 全局鉴权守卫：
 * - 公开页可直接访问；
 * - 已登录访问登录/注册页时重定向到首页；
 * - 需要管理员权限的页面做角色拦截。
 */
export const applyAuthGuard = (to) => {
  const token = localStorage.getItem('token')
  const user = readCurrentUser()

  if (to.meta.public) {
    if (token && (to.path === '/login' || to.path === '/register')) return '/'
    return true
  }

  if (!token) return '/login'
  if (to.meta.adminOnly && user.role !== 'admin') return '/'
  return true
}
