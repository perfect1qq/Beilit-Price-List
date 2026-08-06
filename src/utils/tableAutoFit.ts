/**
 * @file tableAutoFit.ts
 * @description 表格列宽根据当前可视页数据及表头自动自适应计算工具
 */

/**
 * 估算字符串渲染后的像素宽度
 * @param text 待算文本
 * @param fontSize 字体大小 (默认 14px)
 */
export const calcTextWidth = (text: unknown, fontSize = 14): number => {
  if (text == null) return 0
  const str = typeof text === 'object' ? JSON.stringify(text) : String(text)
  let width = 0
  for (const char of str) {
    // ASCII 半角字符及数字英文约占 0.65 个字宽，全角及汉字占 1.15 个字宽，预留充足渲染空间
    if (char.charCodeAt(0) <= 127) {
      width += fontSize * 0.65
    } else {
      width += fontSize * 1.15
    }
  }
  return Math.ceil(width)
}

/**
 * 根据表格数据和表头，计算最相配的列宽（像素）
 * @param list 表格行数据数组
 * @param getter 属性字段名，或自定义提取函数
 * @param headerLabel 表头名称
 * @param options 限制配置：min 最小保底宽, max 最大上限宽, extra 内边距与图标缓冲宽(默认48px)
 */
export const getColumnWidth = <T = Record<string, unknown>>(
  list: T[],
  getter: keyof T | ((row: T) => unknown),
  headerLabel: string,
  options: { min?: number; max?: number; extra?: number } = {}
): number => {
  const { min = 70, max = 560, extra = 16 } = options
  let maxW = calcTextWidth(headerLabel) + extra

  if (Array.isArray(list) && list.length > 0) {
    for (const row of list) {
      if (!row) continue
      const val = typeof getter === 'function' ? getter(row) : (row as Record<string, unknown>)[getter as string]
      const w = calcTextWidth(val) + extra
      if (w > maxW) {
        maxW = w
      }
    }
  }

  return Math.max(min, Math.min(max, maxW))
}
