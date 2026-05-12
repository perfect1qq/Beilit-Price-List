export const toNum = (val: unknown): number => {
  const n = parseFloat(val as string)
  return isNaN(n) ? 0 : n
}

export const ceil = (num: number): number => Math.ceil(num)

export const fixed2 = (num: number): number => Number(Number(num || 0).toFixed(2))

export const normalizeRate = (rate: unknown): number => {
  const n = toNum(rate)
  return n > 0 ? n : 1
}

export const rmbToUsdCeil = (rmb: unknown, rate: unknown): number => {
  const n = toNum(rmb)
  if (!n) return 0
  return ceil(n / normalizeRate(rate))
}

export const formatMoney = (value: unknown, decimals: number = 2, separator: string = ','): string => {
  if (value === null || value === undefined || value === '') return '0.00'
  const num = Number(value)
  if (isNaN(num)) return '0.00'

  const fixedNum = num.toFixed(decimals)
  const [intPart, decPart] = fixedNum.split('.')

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)

  return decimals > 0 ? `${formattedInt}.${decPart}` : formattedInt
}