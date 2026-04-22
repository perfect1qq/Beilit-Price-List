/**
 * @module utils/debounce
 * @description 防抖/节流工具函数
 * 
 * 提供高性能的防抖（debounce）和节流（throttle）实现，
 * 用于优化高频触发事件（搜索、滚动、窗口调整等）。
 */

/**
 * 防抖函数 - 在最后一次调用后延迟执行
 * @param {Function} fn - 要防抖的函数
 * @param {number} [delay=300] - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return (...args) => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/** createDebounce - debounce 的别名（向后兼容） */
export const createDebounce = debounce

/**
 * 节流函数 - 固定间隔执行
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
