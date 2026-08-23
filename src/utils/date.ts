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

export { formatDate, formatDateTime, formatDateOnly, addDays, getRemainingDays }