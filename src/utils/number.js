export const toNum = (val) => {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

export const ceil = (num) => Math.ceil(num)

/**
 * 保留两位小数并返回 number，用于内部计算。
 */
export const fixed2 = (num) => Number(Number(num || 0).toFixed(2))

/**
 * 统一汇率分母，避免出现 0 导致除零。
 */
export const normalizeRate = (rate) => {
  const n = toNum(rate)
  return n > 0 ? n : 1
}

/**
 * 以人民币按汇率换算美元并向上取整。
 */
export const rmbToUsdCeil = (rmb, rate) => {
  const n = toNum(rmb)
  if (!n) return 0
  return ceil(n / normalizeRate(rate))
}