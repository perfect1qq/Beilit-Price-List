/**
 * @module utils/navigation
 * @description 路由导航、用户状态和格式化工具
 * 
 * 提供统一的路由跳转方法、用户信息读取和日期格式化：
 * - 路由导航（push/back）
 * - 用户信息读取（从 localStorage）
 * - 日期时间格式化
 * - 路由标题解析
 */

import { useRouter } from 'vue-router'

/** 路由实例缓存（避免重复创建） */
let routerInstance = null

/**
 * 获取路由实例（单例模式）
 * @returns {import('vue-router').Router}
 */
const getRouter = () => {
  if (!routerInstance) {
    routerInstance = useRouter()
  }
  return routerInstance
}

/**
 * 从 localStorage 读取当前用户信息
 * @returns {Object} 用户对象 { username, role, name }
 */
export const readCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : { role: 'user' }
  } catch {
    return { role: 'user' }
  }
}

/**
 * 格式化日期时间为本地字符串
 * @param {string|Date} dateStr - 日期字符串或 Date 对象
 * @param {string} [locale='zh-CN'] - 语言环境
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateTime = (dateStr, locale = 'zh-CN') => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return String(dateStr)
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(dateStr)
  }
}

/** 路由路径到显示标题的映射 */
const ROUTE_TITLE_MAP = {
  '/message': (route) => {
    const user = readCurrentUser()
    return user.role === 'admin' ? '留言管理' : '我的留言'
  },
  '/home': () => '首页',
  '/quotation': () => '报价单',
  '/beam-quotation': () => '横梁载重单',
  '/approval': () => '审批管理',
  '/memo-management': () => '备忘录',
  '/medium-shelf-weight': () => '中型货架重量表',
  '/usd-conversion': () => '美金换算',
  '/user-management': () => '用户管理'
}

/**
 * 解析路由显示标题
 * @param {Object} route - 路由对象
 * @returns {string} 显示标题
 */
export const resolveRouteDisplayTitle = (route) => {
  const path = route?.path || route || ''
  
  if (ROUTE_TITLE_MAP[path]) {
    return ROUTE_TITLE_MAP[path](route)
  }
  
  if (route?.meta?.title) {
    return route.meta.title
  }
  
  const match = Object.keys(ROUTE_TITLE_MAP).find(key => path.startsWith(key))
  return match ? ROUTE_TITLE_MAP[match](route) : path.split('/').pop() || '页面'
}

/**
 * 获取留言页面标题（根据角色）
 * @param {string} role - 用户角色
 * @returns {string} 页面标题
 */
export const getMessagePageTitle = (role) =>
  role === 'admin' ? '留言管理' : '我的留言'

/**
 * 导航到指定路径
 * @param {string} path - 目标路径
 * @param {Object} [params={}] - 路径参数
 */
export const navigateTo = (path, params = {}) => {
  const router = getRouter()
  if (Object.keys(params).length > 0) {
    router.push({ path, query: params })
  } else {
    router.push(path)
  }
}

/**
 * 在新窗口打开路径
 * @param {string} url - 目标 URL
 */
export const openInNewTab = (url) => window.open(url, '_blank')

/**
 * 返回上一页
 */
export const goBack = () => {
  const router = getRouter()
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

export default {
  navigateTo,
  openInNewTab,
  goBack,
  readCurrentUser,
  formatDateTime,
  resolveRouteDisplayTitle,
  getMessagePageTitle
}
