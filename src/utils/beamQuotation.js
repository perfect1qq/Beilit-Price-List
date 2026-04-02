// 横梁载重表相关的通用工具函数
// 统一处理：时间格式、JSON 解析、行数据克隆与空行生成。

/**
 * 生成一条空白的横梁行数据。
 */
export const createEmptyBeamRow = () => ({
  name: '',
  length: '',
  spec: '',
  maxLoad: ''
})

/**
 * 深拷贝一份数据，避免直接修改源对象。
 */
export const cloneBeamData = (value) => {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

/**
 * 尝试把后端返回的 items 转成数组。
 * 兼容：数组 / JSON 字符串 / 空值。
 */
export const parseBeamItems = (items) => {
  if (Array.isArray(items)) return items
  if (typeof items !== 'string') return []

  try {
    const parsed = JSON.parse(items)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 提取一条历史记录中某个字段的首行值。
 * 历史列表页只展示摘要，所以默认读取第一行。
 */
export const getBeamFirstItemValue = (row, field, fallback = '-') => {
  const items = parseBeamItems(row?.items)
  if (!items.length) return fallback
  return items[0]?.[field] || fallback
}

/**
 * 把时间格式化成 yyyy-mm-dd。
 */
export const formatBeamDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).split(' ')[0] || '-'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取当前日期的 yyyy-mm-dd 格式，用于新增历史记录时写入时间字段。
 */
export const getTodayBeamDate = () => formatBeamDate(new Date())

/**
 * 规范化后端返回的横梁记录，补齐日期字段并保持字段结构统一。
 */
export const normalizeBeamRecord = (record = {}) => ({
  ...record,
  id: record.id,
  name: record.name || '',
  items: record.items ?? [],
  createDate: record.createDate || record.create_date || record.createTime || record.createdAt || record.created_at || record.date || '',
  createTime: record.createTime || record.createdAt || record.created_at || '',
  updateTime: record.updateTime || record.updatedAt || ''
})

