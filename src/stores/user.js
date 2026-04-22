/**
 * @module stores/user
 * @description 用户状态管理（Pinia Store）
 * 
 * 管理用户认证状态和基本信息：
 * - Token 存储和自动注入
 * - 用户信息缓存
 * - 登录/登出状态管理
 * - JWT Payload 解码
 * 
 * 使用方式：
 * import { useUserStore } from '@/stores/user'
 * 
 * const userStore = useUserStore()
 * userStore.setToken('jwt-token-string')
 * console.log(userStore.isLoggedIn)  // true
 * console.log(userStore.username)    // 'admin'
 */

import { defineStore } from 'pinia'
import axios from 'axios'

/**
 * 安全地解析 JWT payload。
 * 这里只需要读出用户基本信息，不依赖额外三方包，避免构建期缺少依赖。
 * 
 * JWT 格式：header.payload.signature
 * payload 是 Base64 编码的 JSON，包含 userId、username、role、name 等字段
 * 
 * @param {string} token - JWT 字符串
 * @returns {Object|null} 解码后的 payload 对象，失败返回 null
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    
    const json = typeof window !== 'undefined' && window.atob
      ? window.atob(padded)
      : Buffer.from(padded, 'base64').toString('utf8')
      
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  /**
   * Store 初始状态
   * @returns {Object} 初始状态对象
   */
  state: () => ({
    /** JWT 认证令牌 */
    token: localStorage.getItem('token') || '',
    
    /** 解码后的用户信息（从 JWT 提取） */
    user: null,
    
    /** 是否正在加载中 */
    loading: false,
    
    /** 最后一次认证错误信息 */
    authError: null
  }),

  getters: {
    /**
     * 是否已登录（有有效 token）
     * @param {Object} state - Store state
     * @returns {boolean}
     */
    isLoggedIn: (state) => Boolean(state.token && state.token.length > 0),

    /**
     * 当前用户名
     * @param {Object} state - Store state
     * @returns {string}
     */
    username: (state) => state.user?.username || '',

    /**
     * 当前用户角色
     * @param {Object} state - Store state
     * @returns {string} 'admin' | 'user' | 'guest' | ''
     */
    role: (state) => state.user?.role || '',

    /**
     * 当前用户显示名称
     * @param {Object} state - Store state
     * @returns {string}
     */
    displayName: (state) => state.user?.name || state.user?.username || '',

    /**
     * 是否为管理员
     * @param {Object} state - Store state
     * @returns {boolean}
     */
    isAdmin: (state) => state.user?.role === 'admin',

    /**
     * 是否为游客（只读权限）
     * @param {Object} state - Store state
     * @returns {boolean}
     */
    isGuest: (state) => state.user?.role === 'guest'
  },

  actions: {
    /**
     * 初始化：从 localStorage 恢复登录状态
     * 应用启动时调用，检查是否有保存的 token 并解析用户信息
     */
    init() {
      if (this.token) {
        axios.defaults.headers.common.Authorization = `Bearer ${this.token}`
        
        const decoded = decodeJwtPayload(this.token)
        if (decoded) {
          this.user = decoded
          this.syncToLocalStorage()
        } else {
          this.logout()
        }
      }
    },

    /**
     * 设置认证 Token
     * 
     * @param {string} token - JWT 令牌字符串
     * @description
     * - 保存到 state 和 localStorage
     * - 自动注入 axios 默认请求头
     * - 解析并缓存用户信息
     */
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
      
      this.user = decodeJwtPayload(token)
      this.authError = null
      this.syncToLocalStorage()
    },

    /**
     * 设置认证错误信息
     * 
     * @param {Object|string} error - 错误信息
     */
    setAuthError(error) {
      this.authError = error?.message || String(error)
    },

    /**
     * 登出：清除所有认证状态
     * 
     * - 清空 token 和用户信息
     * - 移除 localStorage 存储
     * - 清除 axios 默认请求头
     */
    logout() {
      this.token = ''
      this.user = null
      this.authError = null
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      delete axios.defaults.headers.common.Authorization
    },

    /**
     * 同步用户信息到 localStorage
     * 用于非 Pinia 组件读取当前用户信息（兼容旧代码）
     */
    syncToLocalStorage() {
      if (this.user) {
        localStorage.setItem('user', JSON.stringify({
          username: this.user.username,
          role: this.user.role,
          name: this.user.name
        }))
      }
    },

    /**
     * 更新用户显示名称
     * 
     * @param {string} name - 新的显示名称
     */
    updateName(name) {
      if (this.user) {
        this.user.name = name
        this.syncToLocalStorage()
      }
    }
  }
})
