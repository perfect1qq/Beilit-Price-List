/**
 * @file composables/useQuotationDraft.ts
 * @description 报价单草稿状态管理（核心业务逻辑）
 *
 * 功能说明：
 * - 管理报价单的完整编辑状态（表头、明细行、折扣、成交价）
 * - 实现两种计价模式：
 *   1. **自动模式**：成交价 = 小计 × (1 - 折扣%)
 *   2. **手动模式**：用户直接输入成交价，反向计算折扣
 * - 明细行的增删改及自动计算（数量 × 单价 = 小计）
 * - 支持从历史记录加载并进入编辑/查看模式
 * - 提供深比对快照用于检测是否有修改
 *
 * 数据流架构：
 * ┌─────────────────────────────────────────────────────────────┐
 * │  useQuotationDraft (本模块)                                 │
 * │  ┌──────────────┬────────────────────────────────────────┐  │
 * │  │ 表头状态      │ name, companyName, remark             │  │
 * │  ├──────────────┼────────────────────────────────────────┤  │
 * │  │ 价格计算链    │ items → subtotal → autoFinalPrice     │  │
 * │  │              │                    ↓                  │  │
 * │  │              │          finalPrice (自动/手动)        │  │
 * │  ├──────────────┼────────────────────────────────────────┤  │
 * │  │ 明细行管理    │ addRow / removeRow / updateRowTotal   │  │
 * │  ├──────────────┼────────────────────────────────────────┤  │
 * │  │ 模式控制      │ edit(编辑) / view(查看)               │  │
 * │  ├──────────────┼────────────────────────────────────────┤  │
 * │  │ 历史快照      │ originalPayloadStr (深比对用)         │  │
 * │  └──────────────┴────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 使用方式：
 * const {
 *   name, companyName, remark,
 *   discount, finalPrice, isManualFinalPrice,
 *   items, subtotal, autoFinalPrice, discountAmount,
 *   addRow, removeRow, updateRowTotal,
 *   setFinalPriceManual, restoreAutoFinalPrice,
 *   loadRecord, getPayload, resetDraft
 * } = useQuotationDraft()
 */

import { computed, ref, watch, type Ref, type ComputedRef } from 'vue'
import type { QuotationCreatePayload, QuotationData } from '@/types'

export interface QuotationRow {
  name: string
  spec: string
  quantity: string | number
  unitPrice: string | number
  totalPrice: string | number
  [key: string]: unknown
}

interface QuotationDraftReturn {
  FIELD_ORDER: string[]
  name: Ref<string>
  companyName: Ref<string>
  remark: Ref<string>
  discount: Ref<number>
  finalPrice: Ref<number>
  isManualFinalPrice: Ref<boolean>
  rawText: Ref<string>
  items: Ref<QuotationRow[]>
  visibleColumns: Ref<string[]>
  editingHistoryId: Ref<number | null>
  mode: Ref<string>
  subtotal: ComputedRef<number>
  autoFinalPrice: ComputedRef<number>
  discountAmount: ComputedRef<number>
  isViewMode: ComputedRef<boolean>
  isEditing: ComputedRef<boolean>
  originalPayloadStr: Ref<string>
  addRow: () => void
  removeRow: (index: number) => void
  clearRows: () => void
  updateRowTotal: (row: QuotationRow) => void
  setCompanyName: (value: unknown) => void
  setFinalPriceManual: (value: unknown) => void
  restoreAutoFinalPrice: () => void
  loadRecord: (record: Record<string, unknown> | QuotationData, viewMode?: string) => void
  setMode: (newMode: string) => void
  getPayload: () => QuotationCreatePayload
  resetDraft: () => void
  setRows: (newItems: QuotationRow[], columns?: string[]) => void
}

const FIELD_ORDER = ['name', 'spec', 'quantity', 'unitPrice', 'totalPrice']

const createEmptyRow = (): QuotationRow => ({
  name: '',
  spec: '',
  quantity: '',
  unitPrice: '',
  totalPrice: '',
})

const roundMoney = (value: unknown): number => Number((Number(value || 0)).toFixed(2))

const parseNumber = (value: unknown): number | null => {
  const text = String(value ?? '').trim()
  if (!text) return null

  const match = text.match(/[-+]?\d+(?:\.\d+)?/)
  if (!match) return null

  const num = Number(match[0])
  return Number.isFinite(num) ? num : null
}

const normalizeRow = (row: Record<string, unknown> = {}): QuotationRow => {
  const quantity = parseNumber(row.quantity)
  const unitPrice = parseNumber(row.unitPrice)
  const totalPrice = parseNumber(row.totalPrice)

  const computedTotal =
    quantity !== null && unitPrice !== null
      ? roundMoney(quantity * unitPrice)
      : null

  const finalTotal =
    totalPrice !== null ? roundMoney(totalPrice) : computedTotal ?? ''

  return {
    name: String(row.name ?? '').trim(),
    spec: String(row.spec ?? '').trim(),
    quantity: quantity === null ? String(row.quantity ?? '').trim() : quantity,
    unitPrice:
      unitPrice === null
        ? String(row.unitPrice ?? '').trim()
        : roundMoney(unitPrice),
    totalPrice: finalTotal,
  }
}

export function useQuotationDraft(): QuotationDraftReturn {
  const name = ref('')

  const companyName = ref('')

  const remark = ref('')

  const discount = ref(0)

  const finalPrice = ref(0)

  const isManualFinalPrice = ref(false)

  const rawText = ref('')

  const items = ref<QuotationRow[]>([createEmptyRow()])

  const visibleColumns = ref([...FIELD_ORDER])

  const editingHistoryId = ref<number | null>(null)

  const mode = ref('edit')

  const subtotal = computed(() =>
    roundMoney(
      items.value.reduce((sum, row) => sum + Number(row.totalPrice || 0), 0),
    ),
  )

  const autoFinalPrice = computed(() =>
    roundMoney(subtotal.value * (1 - Number(discount.value || 0) / 100)),
  )

  const discountAmount = computed(() =>
    roundMoney(subtotal.value - finalPrice.value),
  )

  const isViewMode = computed(() => mode.value === 'view')

  const isEditing = computed(() => Boolean(editingHistoryId.value))

  const syncAutoPrice = (): void => {
    if (!isManualFinalPrice.value) {
      finalPrice.value = autoFinalPrice.value
    }
  }

  watch([subtotal, discount], syncAutoPrice, { immediate: true })

  const resetDraft = (): void => {
    name.value = ''
    companyName.value = ''
    remark.value = ''
    discount.value = 0
    finalPrice.value = 0
    isManualFinalPrice.value = false
    rawText.value = ''
    items.value = [createEmptyRow()]
    visibleColumns.value = [...FIELD_ORDER]
    editingHistoryId.value = null
    mode.value = 'edit'
  }

  /**
   * 批量设置明细行数据
   *
   * 用于 AI 智能解析后填充结果，
   * 或从历史记录加载时恢复数据
   *
   * @param {Array} [rows=[]] - 行数据数组
   * @param {string[]} [columns=FIELD_ORDER] - 显示的列名
   */
  const setRows = (rows: QuotationRow[] = [], columns: string[] = FIELD_ORDER): void => {
    items.value = rows.length
      ? rows.map(normalizeRow)
      : [createEmptyRow()]

    visibleColumns.value =
      columns && columns.length ? [...columns] : [...FIELD_ORDER]

    syncAutoPrice()
  }

  const addRow = (): void => {
    if (isViewMode.value) return
    items.value.push(createEmptyRow())
  }

  const removeRow = (index: number): void => {
    if (isViewMode.value) return
    items.value.splice(index, 1)
    if (!items.value.length) items.value.push(createEmptyRow())
    syncAutoPrice()
  }

  const clearRows = (): void => {
    if (isViewMode.value) return
    items.value = [createEmptyRow()]
    syncAutoPrice()
  }

  const updateRowTotal = (row: QuotationRow): void => {
    if (isViewMode.value) return

    const quantity = parseNumber(row.quantity)
    const unitPrice = parseNumber(row.unitPrice)

    if (quantity !== null && unitPrice !== null) {
      row.totalPrice = roundMoney(quantity * unitPrice)
      syncAutoPrice()
    }
  }

  const setCompanyName = (value: unknown): void => {
    companyName.value = String(value ?? '').trim()
  }

  const setFinalPriceManual = (value: unknown): void => {
    isManualFinalPrice.value = true

    const parsed = parseNumber(value)
    finalPrice.value =
      parsed === null ? Number(value || 0) : roundMoney(parsed)

    if (subtotal.value > 0) {
      discount.value = roundMoney(
        ((1 - finalPrice.value / subtotal.value) * 100),
      )
    } else {
      discount.value = 0
    }
  }

  const restoreAutoFinalPrice = (): void => {
    isManualFinalPrice.value = false
    finalPrice.value = autoFinalPrice.value
  }

  const originalPayloadStr = ref('')

  const loadRecord = (record: Record<string, unknown> | QuotationData, newMode = 'edit'): void => {
    name.value = String(record.name || '').trim()
    companyName.value = String(record.companyName || '').trim()
    remark.value = (record.remark || '') as string
    discount.value = Number(record.discount || 0)
    finalPrice.value = Number(record.finalPrice || 0)
    isManualFinalPrice.value = Boolean(record.isManual)
    rawText.value = ''
    editingHistoryId.value = (record.id ?? null) as number | null
    mode.value = newMode

    let itemsParsed: unknown = record.items || []
    if (typeof itemsParsed === 'string') {
      try {
        itemsParsed = JSON.parse(itemsParsed)
      } catch (_e) {
        itemsParsed = []
      }
    }

    setRows(Array.isArray(itemsParsed) ? itemsParsed as QuotationRow[] : [], FIELD_ORDER)

    if (!isManualFinalPrice.value) {
      finalPrice.value = autoFinalPrice.value
    }

    originalPayloadStr.value = JSON.stringify(getPayload())
  }

  const setMode = (newMode: string): void => {
    mode.value = newMode
  }

  const getPayload = (): QuotationCreatePayload => ({
    name: name.value,
    companyName: companyName.value,
    remark: remark.value,
    discount: Number(discount.value || 0),
    finalPrice: Number(finalPrice.value || 0),
    isManual: Boolean(isManualFinalPrice.value),
    items: items.value.map(normalizeRow),
  })

  return {
    FIELD_ORDER,
    name,
    companyName,
    remark,
    discount,
    finalPrice,
    isManualFinalPrice,
    rawText,
    items,
    visibleColumns,
    editingHistoryId,
    mode,
    subtotal,
    autoFinalPrice,
    discountAmount,
    isViewMode,
    isEditing,

    // 操作方法
    resetDraft,
    setRows,
    addRow,
    removeRow,
    clearRows,
    updateRowTotal,
    setCompanyName,
    setFinalPriceManual,
    restoreAutoFinalPrice,

    // 历史记录方法
    loadRecord,
    setMode,
    getPayload,
    originalPayloadStr,
  }
}
