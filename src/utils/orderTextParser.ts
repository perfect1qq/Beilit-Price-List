import type { OrderItem, AccessoryItem } from '@/api/order'

/** 订单文本解析结果 */
export interface OrderParseResult {
  header: {
    customerName: string
    phone: string
    deliveryAddress: string
    fax: string
    contactPerson: string
    orderDate: string
    deliveryDays: string
    remark: string
  }
  items: OrderItem[]
  accessories: AccessoryItem[]
}

interface HeaderKey {
  name: keyof OrderParseResult['header']
  labels: string[]
}

/**
 * 将粘贴的订单纯文本解析为表头/明细/配件结构
 * 用于 OrderPlacement 自动/手动填充表单
 */
export const parseOrderText = (text: string): OrderParseResult => {
  const lines = text.split('\n').map(l => l.trim())

  const header: OrderParseResult['header'] = {
    customerName: '',
    phone: '',
    deliveryAddress: '',
    fax: '',
    contactPerson: '',
    orderDate: '',
    deliveryDays: '',
    remark: ''
  }
  const items: OrderItem[] = []
  const accessories: AccessoryItem[] = []

  let mode: 'header' | 'items' | 'accessories' | 'footer' = 'header'

  const keys: HeaderKey[] = [
    { name: 'customerName', labels: ['客户'] },
    { name: 'phone', labels: ['电话'] },
    { name: 'deliveryAddress', labels: ['送货地址', '送货'] },
    { name: 'fax', labels: ['传真'] },
    { name: 'contactPerson', labels: ['联系人'] },
    { name: 'orderDate', labels: ['日期'] },
    { name: 'remark', labels: ['备注'] }
  ]

  for (const line of lines) {
    if (!line) continue

    // 匹配分割边界
    if (line.includes('序号') && line.includes('名称') && (line.includes('规格') || line.includes('用料'))) {
      mode = 'items'
      continue
    }

    // 判断是否进入配件区域：
    // 1. 明确的“配件：”或“配件”标题
    // 2. 独立成行的“脚板 = xx”（不能是带序号的表格行，如 "2 立柱2 ... 反焊脚板"）
    const isNumberedItemLine = /^\d+[\s\t]+/.test(line)
    if (
      line.startsWith('配件：') ||
      line.startsWith('配件:') ||
      /^配件[\s\t]*[:：]?$/.test(line) ||
      (!isNumberedItemLine && /^脚板\s*=/.test(line))
    ) {
      mode = 'accessories'
      if (line.startsWith('配件：') || line.startsWith('配件:') || /^配件[\s\t]*[:：]?$/.test(line)) {
        continue
      }
    }

    if (line.startsWith('备注') || line.includes('工期：') || line.includes('工期:')) {
      mode = 'footer'
    }

    if (mode === 'header') {
      const segments = line.split(/\t| {2,}/).map(s => s.trim()).filter(Boolean)

      for (const segment of segments) {
        let matched = false
        for (const key of keys) {
          for (const label of key.labels) {
            if (segment.startsWith(label)) {
              const val = segment.slice(label.length).replace(/^[:：\s]*/, '').trim()
              if (val) {
                header[key.name] = val
              } else {
                const currentIdx = segments.indexOf(segment)
                if (currentIdx !== -1 && currentIdx + 1 < segments.length) {
                  const nextSeg = segments[currentIdx + 1]
                  const isAnotherLabel = keys.some(k => k.labels.some(l => nextSeg.startsWith(l)))
                  if (!isAnotherLabel) {
                    header[key.name] = nextSeg
                  }
                }
              }
              matched = true
              break
            }
          }
          if (matched) break
        }
      }
    } else if (mode === 'items') {
      const match = line.match(/^(\d+)[\s\t]+(.*)/)
      if (match) {
        const content = match[2].trim()
        const cols = content.split(/\t| {2,}/).map(c => c.trim())

        const name = cols[0] || ''
        const specRaw = cols[1] || ''
        const material = cols[2] || ''
        const color = cols[3] || ''
        const other = cols[4] || ''

        let spec = specRaw
        let qty = ''
        const specMatch = specRaw.match(/(.*?)\s*=\s*(.*)/)
        if (specMatch) {
          spec = specMatch[1].trim()
          qty = specMatch[2].trim()
        }

        items.push({
          id: Date.now() + Math.random(),
          name,
          spec,
          qty,
          material,
          color,
          other
        })
      }
    } else if (mode === 'accessories') {
      const matchAcc = line.match(/(.*?)\s*=\s*(.*)/)
      if (matchAcc) {
        accessories.push({
          id: Date.now() + Math.random(),
          name: matchAcc[1].trim(),
          qty: matchAcc[2].trim()
        })
      } else {
        if (!line.includes('工期') && !line.startsWith('备注')) {
          accessories.push({
            id: Date.now() + Math.random(),
            name: line.trim(),
            qty: ''
          })
        }
      }
    }

    if (line.startsWith('备注')) {
      const val = line.replace(/^备注[\s\t:：]*/, '').trim()
      if (val) {
        header.remark = header.remark ? `${header.remark}\n${val}` : val
      }
    }

    if (line.includes('工期')) {
      const matchDays = line.match(/工期[\s\t:：]*([^\t\n\s]+)/)
      if (matchDays) {
        header.deliveryDays = matchDays[1]
      }
    }
  }

  return { header, items, accessories }
}

export default parseOrderText
