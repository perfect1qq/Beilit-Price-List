/**
 * @file composables/useQuotationEditor.ts
 * @description 报价单编辑器交互逻辑（事件处理层）
 *
 * 功能说明：
 * - 封装报价单编辑器的所有用户交互处理函数
 * - 连接 UI 事件与 useQuotationDraft 状态管理
 * - 处理 AI 智能解析、表单验证、提交保存等操作
 *
 * 架构定位：
 * ┌─────────────────────┐     ┌──────────────────────┐
 * │  QuotationList.vue   │────▶│  useQuotationEditor   │
 * │  (视图层)             │     │  (交互逻辑层)          │
 * └─────────────────────┘     └──────────┬───────────┘
 *                                          │ 调用
 *                                          ▼
 *                                ┌──────────────────────┐
 *                                │  useQuotationDraft    │
 *                                │  (状态管理层)          │
 *                                └──────────────────────┘
 *
 * 设计原则：
 * - 本模块不持有任何响应式状态，只接收依赖注入
 * - 所有业务逻辑通过 deps 参数解耦，便于测试和复用
 * - 错误处理统一使用 showError/showWarning
 */

import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { ref } from 'vue'
import type { Ref } from 'vue'

interface QuotationRow {
  name?: string
  spec?: string
  quantity?: string | number
  unitPrice?: string | number
  totalPrice?: string | number
  [key: string]: unknown
}

interface FormModel {
  quotationNo: string
  companyName: string
  [key: string]: unknown
}

interface QuotationEditorDeps {
  isViewMode: Ref<boolean>
  parsing: Ref<boolean>
  isSubmitting: Ref<boolean>
  rawText: Ref<string>
  items: Ref<QuotationRow[]>
  quotationNo: Ref<string>
  companyName: Ref<string>
  formRef: Ref<{ validate: () => Promise<boolean> } | null>
  formModel: FormModel
  editingHistoryId: Ref<number | null>
  originalPayloadStr: Ref<string>
  isManualFinalPrice: Ref<boolean>
  setFinalPriceManual: (value: unknown) => void
  restoreAutoFinalPrice: () => void
  setRows?: (...args: any[]) => void
  getPayload: () => Record<string, unknown>
  saveQuotation: (payload: Record<string, unknown>, editingId?: number | null) => Promise<unknown>
  onSaveSuccess?: (result?: unknown) => void
  parseTextFn: (text: string) => Promise<{ items: QuotationRow[]; columns: unknown[]; warnings?: string[] } | null>
}

interface QuotationEditorReturn {
  handleManualFinalPriceChange: (value: unknown) => void
  handleDiscountChange: () => void
  handleParseText: () => Promise<void>
  validateRows: () => boolean
  handleSubmit: () => Promise<void>
}

const useQuotationEditor = (deps: Partial<QuotationEditorDeps>): Partial<QuotationEditorReturn> => {
  const {
    isViewMode = ref(false),
    parsing = ref(false),
    isSubmitting = ref(false),
    rawText = ref(''),
    items = ref([]),
    quotationNo = ref(''),
    companyName = ref(''),
    formRef = ref(null),
    formModel = { quotationNo: '', companyName: '' },
    editingHistoryId = ref(null),
    originalPayloadStr = ref(''),
    isManualFinalPrice = ref(false),
    setFinalPriceManual,
    restoreAutoFinalPrice,
    setRows = () => {},
    getPayload = () => ({}),
    saveQuotation = async () => {},
    onSaveSuccess,
    parseTextFn = async () => null,
  } = deps

  const handleManualFinalPriceChange = (value: unknown): void => {
    try {
      if (isViewMode?.value) return

      if (typeof setFinalPriceManual === 'function') {
        setFinalPriceManual(value)
      }
    } catch (_error) {
      // 静默处理异常
    }
  }

  const handleDiscountChange = (): void => {
    try {
      if (isViewMode?.value) return

      if (
        isManualFinalPrice?.value &&
        typeof restoreAutoFinalPrice === 'function'
      ) {
        restoreAutoFinalPrice()
      }
    } catch (_error) {
      // 静默处理异常
    }
  }

  const handleParseText = async (): Promise<void> => {
    if (isViewMode.value) return

    const text = String(rawText.value ?? '').trim()
    if (!text) return showWarning('请先粘贴报价内容至编辑框内')

    parsing.value = true

    const [err, result] = await to(parseTextFn(text))
    if (err) {
      showError(err, '解析失败，请检查服务连通性')
      parsing.value = false
      return
    }

    if (!result) {
      parsing.value = false
      return
    }

    setRows(result.items || [], result.columns || [])

    if (result.warnings?.length) {
      showWarning(result.warnings[0])
    } else {
      showSuccess('文本解析完成，已渲染至下方数据表')
    }

    parsing.value = false
  }

  const validateRows = (): boolean => {
    const validRows = items.value.filter((row) => {
      const hasText =
        String(row.name || '').trim() ||
        String(row.spec || '').trim()
      const hasQty = String(row.quantity ?? '').trim() !== ''
      const hasUnit = String(row.unitPrice ?? '').trim() !== ''
      const hasTotal = String(row.totalPrice ?? '').trim() !== ''
      const meaningful = hasText || hasQty || hasUnit || hasTotal

      return meaningful ? (hasQty && hasUnit) || hasTotal : false
    })

    if (!quotationNo.value.trim()) {
      showWarning('请先填写名称')
      return false
    }
    if (!companyName.value.trim()) {
      showWarning('请先填写公司名称归属')
      return false
    }
    if (!validRows.length) {
      showWarning(
        '请先录入或使用 AI 智能粘贴获取报价明细',
      )
      return false
    }
    if (validRows.length !== items.value.length) {
      showWarning(
        '表格存在残缺不完整的数据行，请修正后继续',
      )
      return false
    }

    return true
  }

  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting.value) return

    quotationNo.value = formModel.quotationNo
    companyName.value = formModel.companyName

    const [validateErr] = await to(formRef.value?.validate() ?? Promise.resolve(false))
    if (validateErr) return

    if (!validateRows()) return

    const payload = getPayload()

    if (
      editingHistoryId?.value &&
      JSON.stringify(payload) === originalPayloadStr?.value
    ) {
      return showWarning('没有做任何修改，无法保存无用的沉余记录！')
    }

    // 执行保存
    isSubmitting.value = true
    const [err, result] = await to(
      saveQuotation(payload, editingHistoryId?.value),
    )

    if (err) {
      showError(err, '入库失败，请稍后刷新重试！')
      isSubmitting.value = false
      return
    }

    if (result) {
      showSuccess(editingHistoryId?.value ? '修改成功' : '成功新增报价单')

      // 执行保存成功回调（如重置草稿）
      if (onSaveSuccess) onSaveSuccess(result)
    }

    isSubmitting.value = false
  }

  return {
    handleManualFinalPriceChange,
    handleDiscountChange,
    handleParseText,
    validateRows,
    handleSubmit,
  }
}

export { useQuotationEditor }
