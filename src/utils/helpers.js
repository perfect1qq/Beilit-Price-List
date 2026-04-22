/**
 * @module utils/helpers
 * @description 通用工具函数集
 * 
 * 提供项目中常用的基础工具函数：
 * - 深拷贝
 * - 类型检查
 * - 数据格式化
 */

/**
 * 深拷贝对象或数组
 * 支持基本数据类型、对象、数组、Date、正则等
 * @param {*} source - 要拷贝的源数据
 * @returns {*} 深拷贝后的数据
 */
export const deepClone = (source) => {
  if (source === null || typeof source !== 'object') return source

  if (source instanceof Date) return new Date(source.getTime())
  if (source instanceof Array) return source.map(item => deepClone(item))
  if (source instanceof RegExp) return new RegExp(source.source, source.flags)

  const cloned = {}
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      cloned[key] = deepClone(source[key])
    }
  }
  return cloned
}

/**
 * 判断是否为空值（null, undefined, '', [], {}）
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 生成唯一ID
 * @param {string} [prefix=''] - ID前缀
 * @returns {string} 唯一ID字符串
 */
export const generateId = (prefix = '') =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * 防抖函数（简化版）
 * @param {Function} fn - 要防抖的函数
 * @param {number} [delay=300] - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流函数（简化版）
 * @param {Function} fn - 要节流的函数
 * @param {number} [interval=300] - 执行间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return (...args) => {
    const now = Date.now()
    if (now - lastTime >= interval) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

export default {
  deepClone,
  isEmpty,
  generateId,
  debounce,
  throttle
}
