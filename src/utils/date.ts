type DateInput = string | Date | number
type DateFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'YYYY/MM/DD' | 'MM-DD'

const formatDate = (value: DateInput, format: DateFormat = 'YYYY-MM-DD'): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).split(' ')[0] || ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  switch (format) {
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`
    case 'MM-DD':
      return `${month}-${day}`
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`
  }
}

const formatDateTime = (value: DateInput): string => formatDate(value, 'YYYY-MM-DD HH:mm')

const formatDateOnly = (value: DateInput): string => formatDate(value, 'YYYY-MM-DD')

const addDays = (days: number, fromDate?: DateInput): Date => {
  const date = fromDate ? new Date(fromDate) : new Date()
  date.setDate(date.getDate() + days)
  return date
}

const getRemainingDays = (dateStr: DateInput): number | null => {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 解析日期输入，支持标准格式与中文年月日格式（如 2026年9月28日、2026-09-28、2026/9/28）
 */
const parseDate = (value?: DateInput | null): Date | null => {
  if (!value) return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  const str = String(value).trim()
  if (!str) return null

  // 1. 中文年月日格式：如 2026年9月28日、2026年09月28日、2026年9月28
  const matchCn = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/)
  if (matchCn) {
    const y = parseInt(matchCn[1], 10)
    const m = parseInt(matchCn[2], 10) - 1
    const d = parseInt(matchCn[3], 10)
    return new Date(y, m, d)
  }

  // 2. 年月日用斜杠/横杠/点分隔：如 2026-9-28、2026/09/28、2026.9.28
  const matchSep = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (matchSep) {
    const y = parseInt(matchSep[1], 10)
    const m = parseInt(matchSep[2], 10) - 1
    const d = parseInt(matchSep[3], 10)
    return new Date(y, m, d)
  }

  const standard = new Date(str)
  return isNaN(standard.getTime()) ? null : standard
}

/**
 * 根据订单日期和工期天数推算预计交货日期
 * 例如：calculateDeliveryDate('2026年9月28日', '15天') => '2026年10月13日'
 */
const calculateDeliveryDate = (
  orderDate?: DateInput | null,
  deliveryDays?: string | number | null,
  format: 'CN' | 'YYYY-MM-DD' = 'CN'
): string => {
  if (!orderDate || deliveryDays === undefined || deliveryDays === null) return ''

  let days: number | null = null
  if (typeof deliveryDays === 'number') {
    days = deliveryDays > 0 ? deliveryDays : null
  } else {
    const m = String(deliveryDays).match(/(\d+)/)
    if (m) {
      days = parseInt(m[1], 10)
    }
  }
  if (!days || days <= 0) return ''

  const baseDate = parseDate(orderDate)
  if (!baseDate) return ''

  const target = new Date(baseDate.getTime())
  target.setDate(target.getDate() + days)

  const y = target.getFullYear()
  const m = target.getMonth() + 1
  const d = target.getDate()

  if (format === 'YYYY-MM-DD') {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return `${y}年${m}月${d}日`
}

export { formatDate, formatDateTime, formatDateOnly, addDays, getRemainingDays, parseDate, calculateDeliveryDate }