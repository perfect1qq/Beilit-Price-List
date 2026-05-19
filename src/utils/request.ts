import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import http from '../api/http'
import { triggerAuthExpired } from './authRuntime'
import { ElMessage } from 'element-plus'
import type { RequestConfig } from '@/types'

let refreshPromise: Promise<void> | null = null

const buildApiUrl = (path: string): string => {
  const baseURL = String(http.defaults.baseURL || '').replace(/\/+$/, '')
  const apiPath = String(path || '').startsWith('/') ? path : `/${path}`
  return `${baseURL}${apiPath}`
}

const refreshAccessToken = async (): Promise<void> => {
  await axios.post(buildApiUrl('/api/refresh'), null, {
    withCredentials: true,
  })
}

const getRefreshPromise = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

const CONFIG = {
  timeout: 15000,
  retryCount: 1,
  retryableStatuses: new Set([0, 500, 502, 503, 504]),
}

const ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误，请检查输入',
  401: '登录已失效，请重新登录',
  403: '没有权限执行此操作',
  404: '请求的资源不存在',
  408: '请求超时，请稍后重试',
  409: '数据冲突，请刷新后重试',
  422: '数据校验失败，请检查输入格式',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误，请联系管理员',
  502: '网关错误，服务暂时不可用',
  503: '服务维护中，请稍后重试',
  504: '网关超时，请稍后重试',
}

interface AxiosErrorLike {
  code?: string
  response?: {
    status?: number
    data?: {
      message?: string
      code?: string
    }
  }
  config?: RequestConfig & InternalAxiosRequestConfig
  message?: string
}

const getErrorMessage = (error: AxiosErrorLike): string => {
  if (error?.code === 'ERR_CANCELED') return ''

  const status = Number(error?.response?.status || 0)
  const serverMessage = error?.response?.data?.message

  if (
    serverMessage &&
    typeof serverMessage === 'string' &&
    serverMessage.length < 100
  ) {
    return serverMessage
  }

  return ERROR_MESSAGES[status] || `请求失败 (${status || '网络异常'})`
}

const shouldRetry = (error: AxiosErrorLike): boolean => {
  const method = String(error?.config?.method || '').toLowerCase()
  if (method !== 'get') return false
  const status = Number(error?.response?.status || 0)
  return CONFIG.retryableStatuses.has(status)
}

const pendingControllers = new Map<string, AbortController>()

const serializeRequestPart = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return JSON.stringify(value)

  if (value instanceof URLSearchParams) {
    return JSON.stringify(
      [...value.entries()].sort(([a], [b]) => a.localeCompare(b)),
    )
  }

  if (value instanceof FormData) {
    return '[form-data]'
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeRequestPart(item)).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) => !(key === '_t' && item !== undefined))
    .sort(([a], [b]) => a.localeCompare(b))

  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${serializeRequestPart(item)}`).join(',')}}`
}

const generateRequestKey = (config: InternalAxiosRequestConfig): string => {
  const method = String(config?.method || 'get').toLowerCase()
  const url = config?.url || ''
  const params = serializeRequestPart(config?.params)
  const data = method === 'get' ? '' : serializeRequestPart(config?.data)
  return `${method}:${url}:${params}:${data}`
}

const cancelPendingRequest = (requestKey: string): boolean => {
  const controller = pendingControllers.get(requestKey)
  if (controller) {
    controller.abort()
    pendingControllers.delete(requestKey)
    return true
  }
  return false
}

export const clearAllPendingRequests = (): void => {
  for (const [key, controller] of pendingControllers.entries()) {
    controller.abort()
    pendingControllers.delete(key)
  }
}

const service: AxiosInstance = axios.create({
  baseURL: http.defaults.baseURL,
  timeout: CONFIG.timeout,
  withCredentials: true,
})

service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipCancel) {
    const requestKey = generateRequestKey(config)
    cancelPendingRequest(requestKey)

    const controller = new AbortController()
    pendingControllers.set(requestKey, controller)

    if (config.signal) {
      config.signal?.addEventListener?.('abort', () => controller.abort(), { once: true })
    }
    ;(config as unknown as Record<string, unknown>).signal = controller.signal
  }

  if (pendingControllers.size > 200) {
    const keysToDelete: string[] = []
    for (const [key] of pendingControllers) {
      keysToDelete.push(key)
      if (keysToDelete.length >= 100) break
    }
    keysToDelete.forEach((key) => {
      const c = pendingControllers.get(key)
      c?.abort()
      pendingControllers.delete(key)
    })
  }

  return config
})

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response?.config

    if (!config.skipCancel) {
      const requestKey = generateRequestKey(response.config)
      pendingControllers.delete(requestKey)
    }

    const payload = response?.data

    if (payload?.success === false) {
      const err = new Error(payload.message || '请求失败') as Error & { code?: string; response?: AxiosResponse }
      err.code = payload.code
      err.response = response
      throw err
    }

    if (
      payload?.success === true &&
      Object.prototype.hasOwnProperty.call(payload, 'data')
    ) {
      return { ...response, data: payload.data } as AxiosResponse
    }

    return response
  },
  async (error: AxiosErrorLike) => {
    const config = error?.config as RequestConfig | undefined

    if (config && !config.skipCancel) {
      const requestKey = generateRequestKey(error.config!)
      pendingControllers.delete(requestKey)
    }

    if (config) {
      config.__retryCount = Number(config.__retryCount || 0)
    }
    const status = Number(error?.response?.status || 0)
    const reasonCode = error?.response?.data?.code

    if (status === 401) {
      if (config?._isRefreshRequest || config?._retryAfterRefresh) {
        if (config.authRedirect !== false) {
          triggerAuthExpired(reasonCode)
        }
        return Promise.reject(error)
      }

      try {
        await getRefreshPromise()
        const replayConfig = {
          ...error.config!,
          _retryAfterRefresh: true,
        } as InternalAxiosRequestConfig & RequestConfig
        return service(replayConfig)
      } catch {
        if (config?.authRedirect !== false) {
          triggerAuthExpired(reasonCode)
        }
        return Promise.reject(error)
      }
    }

    if (shouldRetry(error) && config && config.__retryCount! < CONFIG.retryCount) {
      config.__retryCount = config.__retryCount! + 1
      return service(error.config!)
    }

    const errorMessage = getErrorMessage(error)

    if (errorMessage && !config?.silent) {
      ElMessage.error(errorMessage)
    }

    return Promise.reject(error)
  },
)

export default service
