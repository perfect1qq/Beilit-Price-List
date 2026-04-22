/**
 * @module utils/cache
 * @description API 响应缓存工具
 * 
 * 提供基于内存的 API 响应缓存机制：
 * - TTL（生存时间）自动过期
 * - 按请求 URL 自动缓存键
 * - 支持手动清除和批量操作
 * - 缓存命中率统计（开发调试用）
 * 
 * 适用场景：
 * - 用户列表、配置项等不常变数据
 * - 减少重复网络请求
 * - 提升页面切换响应速度
 * 
 * @example
 * import { apiCache } from '@/utils/cache'
 * 
 * // 获取或设置缓存
 * const data = await apiCache.getOrFetch('/api/users', () => fetchUsers())
 * 
 * // 手动清除特定缓存
 * apiCache.invalidate('/api/users')
 */

/** 默认缓存配置 */
const DEFAULT_CONFIG = {
  /** 默认缓存有效期（毫秒）- 5 分钟 */
  defaultTTL: 5 * 60 * 1000,
  
  /** 最大缓存条目数，防止内存泄漏 */
  maxEntries: 100,
  
  /** 是否启用缓存（可通过环境变量关闭） */
  enabled: true
}

/**
 * 缓存条目结构
 * @typedef {Object} CacheEntry
 * @property {*} data - 缓存的数据
 * @property {number} timestamp - 缓存创建时间戳
 * @property {number} ttl - 有效期（毫秒）
 * @property {string} key - 缓存键
 */

class ApiCache {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options }
    
    /** 缓存存储 Map<key, CacheEntry> */
    this.store = new Map()
    
    /** 统计信息 */
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0
    }
  }

  /**
   * 生成缓存键
   * 
   * @param {string} url - 请求 URL
   * @param {Object} [params={}] - 请求参数
   * @returns {string} 标准化的缓存键
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&')
    return `${url}${sortedParams ? `?${sortedParams}` : ''}`
  }

  /**
   * 检查缓存条目是否有效（未过期）
   * 
   * @param {CacheEntry} entry - 缓存条目
   * @returns {boolean} 是否有效
   */
  isEntryValid(entry) {
    if (!entry) return false
    const now = Date.now()
    return (now - entry.timestamp) < entry.ttl
  }

  /**
   * 获取缓存的值
   * 
   * @param {string} url - 请求 URL
   * @param {Object} [params={}] - 请求参数
   * @returns {*|null} 缓存的值，不存在或已过期返回 null
   */
  get(url, params = {}) {
    if (!this.config.enabled) return null

    const key = this.generateKey(url, params)
    const entry = this.store.get(key)

    if (!this.isEntryValid(entry)) {
      if (entry) this.store.delete(key)
      this.stats.misses += 1
      return null
    }

    this.stats.hits += 1
    return entry.data
  }

  /**
   * 设置缓存值
   * 
   * @param {string} url - 请求 URL
   * @param {*} data - 要缓存的数据
   * @param {Object} [options={}] - 缓存选项
   * @param {number} [options.ttl] - 自定义有效期（毫秒）
   * @param {Object} [options.params] - 请求参数
   */
  set(url, data, options = {}) {
    if (!this.config.enabled) return

    const { ttl = this.config.defaultTTL, params = {} } = options
    const key = this.generateKey(url, params)

    if (this.store.size >= this.config.maxEntries) {
      this.evictOldest()
    }

    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    })
  }

  /**
   * 获取缓存值，如果不存在则调用 fetcher 获取并缓存
   * 
   * 这是主要的对外接口，简化了 get + set 的流程。
   * 
   * @param {string} url - 请求 URL
   * @param {Function} fetcher - 数据获取函数，返回 Promise
   * @param {Object} [options={}] - 缓存选项
   * @returns {Promise<*>} 缓存或新获取的数据
   * 
   * @example
   * const users = await apiCache.getOrFetch(
   *   '/api/users',
   *   () => userApi.list(),
   *   { ttl: 10 * 60 * 1000 }
   * )
   */
  async getOrFetch(url, fetcher, options = {}) {
    const cached = this.get(url, options.params)
    if (cached !== null) return cached

    try {
      const data = await fetcher()
      this.set(url, data, options)
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * 使指定 URL 的缓存失效
   * 
   * @param {string} url - 请求 URL（支持前缀匹配）
   * @returns {number} 清除的条目数量
   */
  invalidate(url) {
    let count = 0
    
    if (!url) {
      count = this.store.size
      this.store.clear()
    } else {
      for (const key of this.store.keys()) {
        if (key.startsWith(url)) {
          this.store.delete(key)
          count += 1
        }
      }
    }
    
    this.stats.invalidations += count
    return count
  }

  /**
   * 清除所有已过期的缓存条目
   * 
   * @returns {number} 清除的条目数量
   */
  cleanup() {
    let count = 0
    
    for (const [key, entry] of this.store.entries()) {
      if (!this.isEntryValid(entry)) {
        this.store.delete(key)
        count += 1
      }
    }
    
    return count
  }

  /**
   * 淘汰最旧的缓存条目（LRU 策略的简化版）
   * 当缓存达到最大容量时调用
   */
  evictOldest() {
    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, entry] of this.store.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey !== null) {
      this.store.delete(oldestKey)
    }
  }

  /**
   * 获取缓存统计信息
   * 
   * @returns {Object} 统计信息对象
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.store.size,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A'
    }
  }

  /**
   * 重置所有统计数据
   */
  resetStats() {
    this.stats = { hits: 0, misses: 0, invalidations: 0 }
  }
}

/** 全局单例实例 */
export const apiCache = new ApiCache()

export { ApiCache }
export default apiCache
