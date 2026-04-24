/**
 * @module utils/request
 * @description Axios HTTP 请求封装（增强版）
 * 
 * 统一配置 axios 实例，提供：
 * - 自动 Token 注入
 * - GET 请求缓存防穿透
 * - 响应数据标准化
 * - 错误统一处理与自动重试
 * - 401 自动跳转登录
 * - **AbortController 请求取消机制** - 防止竞态条件
 */

import axios from 'axios'
import http from '../api/http'
import { handleAuthExpired } from './authSession'

/** 请求配置常量 */
const CONFIG = {
  timeout: 15000,
  retryCount: 1,
  retryableStatuses: new Set([0, 500, 502, 503, 504])
}

/**
 * 错误码映射表（用户友好提示）
 * 
 * 将HTTP状态码和技术错误码转换为用户可理解的提示信息
 */
const ERROR_MESSAGES = {
  400: '请求参数错误，请检查输入',
  401: '登录已过期，请重新登录',
  403: '没有权限执行此操作',
  404: '请求的资源不存在',
  408: '请求超时，请稍后重试',
  409: '数据冲突，请刷新后重试',
  422: '数据验证失败，请检查输入格式',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误，请联系管理员',
  502: '网关错误，服务暂时不可用',
  503: '服务维护中，请稍后重试',
  504: '网关超时，请稍后重试'
}

/**
 * 获取用户友好的错误信息
 * 
 * @param {Error} error - 错误对象
 * @returns {string} 用户可读的错误提示
 */
const getErrorMessage = (error) => {
  if (error?.code === 'ERR_CANCELED') return ''
  
  const status = Number(error?.response?.status || 0)
  const serverMessage = error?.response?.data?.message
  
  if (serverMessage && typeof serverMessage === 'string' && serverMessage.length < 100) {
    return serverMessage
  }
  
  return ERROR_MESSAGES[status] || `请求失败 (${status || '网络异常'})`
}

/**
 * 待处理的请求控制器映射表
 * 
 * 用于实现请求去重和自动取消：
 * - Key: 请求唯一标识（method:url:params）
 * - Value: AbortController 实例
 * 
 * 当相同标识的新请求发起时，自动取消旧请求。
 */
const pendingControllers = new Map()

const serializeRequestPart = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return JSON.stringify(value)

  if (value instanceof URLSearchParams) {
    return JSON.stringify([...value.entries()].sort(([a], [b]) => a.localeCompare(b)))
  }

  if (value instanceof FormData) {
    return '[form-data]'
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => serializeRequestPart(item)).join(',')}]`
  }

  const entries = Object.entries(value)
    .filter(([key, item]) => !(key === '_t' && item !== undefined))
    .sort(([a], [b]) => a.localeCompare(b))

  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${serializeRequestPart(item)}`).join(',')}}`
}

/**
 * 生成请求的唯一标识符
 * 
 * @param {Object} config - axios 请求配置
 * @returns {string} 请求唯一标识
 * @example
 * // GET /api/users?page=1 → "get:/api/users:page=1"
 * // POST /api/users → "post:/api/users"
 */
const generateRequestKey = (config) => {
  const method = String(config?.method || 'get').toLowerCase()
  const url = config?.url || ''
  const params = serializeRequestPart(config?.params)
  const data = method === 'get' ? '' : serializeRequestPart(config?.data)
  return `${method}:${url}:${params}:${data}`
}

/**
 * 取消指定标识的待处理请求
 * 
 * @param {string} requestKey - 请求唯一标识
 * @returns {boolean} 是否成功取消了请求
 */
const cancelPendingRequest = (requestKey) => {
  const controller = pendingControllers.get(requestKey)
  if (controller) {
    controller.abort()
    pendingControllers.delete(requestKey)
    return true
  }
  return false
}

/**
 * 清除所有待处理的请求
 * 通常在页面切换或组件卸载时调用
 */
export const clearAllPendingRequests = () => {
  for (const [key, controller] of pendingControllers.entries()) {
    controller.abort()
    pendingControllers.delete(key)
  }
}

/** 创建 axios 实例 */
const service = axios.create({
  baseURL: http.defaults.baseURL,
  timeout: CONFIG.timeout
})

/**
 * 请求拦截器
 * 
 * 功能：
 * 1. 注入 Authorization Token
 * 2. GET 请求添加时间戳防止缓存
 * 3. 创建 AbortController 并注册到待处理队列
 * 4. 自动取消重复请求（防抖/防竞态）
 */
service.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const method = String(config?.method || 'get').toLowerCase()
  
  if (method === 'get' && !config.disableCacheBust) {
    config.params = { ...(config.params || {}), _t: Date.now() }
  }

  if (!config.skipCancel) {
    const requestKey = generateRequestKey(config)
    cancelPendingRequest(requestKey)

    const controller = new AbortController()
    config.signal = controller.signal
    pendingControllers.set(requestKey, controller)
  }

  return config
})

/**
 * 判断错误是否可重试
 * 
 * 只对 GET 请求且服务端错误的场景进行重试：
 * - 网络断开 (status=0)
 * - 服务器内部错误 (500/502/503/504)
 * - 非用户主动取消的错误
 * 
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
const shouldRetry = (error) => {
  const status = Number(error?.response?.status || 0)
  const method = String(error?.config?.method || 'get').toLowerCase()
  return method === 'get' && error?.code !== 'ERR_CANCELED' && (!status || CONFIG.retryableStatuses.has(status))
}

/**
 * 响应拦截器
 * 
 * 功能：
 * 1. 成功响应：从 pendingControllers 移除已完成的请求
 * 2. 业务错误：检测 success:false 并抛出异常
 * 3. 数据标准化：提取 payload.data 作为响应数据
 * 4. 401 处理：触发认证过期逻辑
 * 5. 自动重试：对符合条件的 GET 请求进行重试
 * 6. 清理：无论成功失败都清理 pendingControllers
 */
service.interceptors.response.use(
  (response) => {
    const config = response?.config || {}
    
    if (!config.skipCancel) {
      const requestKey = generateRequestKey(config)
      pendingControllers.delete(requestKey)
    }

    const payload = response?.data
    
    if (payload?.success === false) {
      const err = new Error(payload.message || '请求失败')
      err.code = payload.code
      err.response = response
      throw err
    }
    
    if (payload?.success === true && Object.prototype.hasOwnProperty.call(payload, 'data')) {
      return { ...response, data: payload.data }
    }
    
    return response
  },
  async (error) => {
    const config = error?.config || {}
    
    if (!config.skipCancel && !error?.code?.includes('ERR_CANCELED')) {
      const requestKey = generateRequestKey(config)
      pendingControllers.delete(requestKey)
    }

    config.__retryCount = Number(config.__retryCount || 0)
    const status = Number(error?.response?.status || 0)
    const reasonCode = error?.response?.data?.code

    if (status === 401) {
      handleAuthExpired(reasonCode)
      return Promise.reject(error)
    }

    if (shouldRetry(error) && config.__retryCount < CONFIG.retryCount) {
      config.__retryCount += 1
      return service(config)
    }

    const errorMessage = getErrorMessage(error)
    
    if (errorMessage && !config.silent) {
      try {
        const { ElMessage } = await import('element-plus')
        ElMessage.error(errorMessage)
      } catch {
        console.error('[Request Error]', errorMessage, error)
      }
    }

    return Promise.reject(error)
  }
)

export default service
export { generateRequestKey }
