/**
 * @module utils/date
 * @description 日期格式化工具
 * 
 * 提供常用的日期格式化函数：
 * - formatDateOnly: 只提取日期部分（YYYY-MM-DD）
 */

/**
 * 格式化日期为 YYYY-MM-DD 字符串（仅日期，不含时间）
 * 
 * @param {string|Date|number} value - 日期值（字符串、Date 对象或时间戳）
 * @returns {string} 格式化后的日期字符串，无效输入返回空字符串
 */
const formatDateOnly = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).split(' ')[0] || ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export { formatDateOnly }
