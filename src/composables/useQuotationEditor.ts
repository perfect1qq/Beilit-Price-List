

import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { quotationApi } from '@/api/quotation'
import { useFormSubmit } from '@/composables/useFormSubmit'
import type { QuotationCreatePayload, QuotationItem } from '@/types'
import type { QuotationRow } from '@/composables/useQuotationDraft'

interface FormModel {
  name: string
  companyName: string
  [key: string]: unknown
}

interface QuotationEditorDeps {
  isViewMode: Ref<boolean>
  parsing: Ref<boolean>
  rawText: Ref<string>
  items: Ref<QuotationRow[]>
  name: Ref<string>
  companyName: Ref<string>
  formRef: Ref<{ validate: () => Promise<boolean> } | null>
  formModel: FormModel
  editingHistoryId: Ref<number | null>
  originalPayloadStr: Ref<string>
  isManualFinalPrice: Ref<boolean>
  setFinalPriceManual: (value: unknown) => void
  restoreAutoFinalPrice: () => void
  setRows?: (newItems: QuotationRow[], columns?: string[]) => void
  getPayload: () => QuotationCreatePayload
  saveQuotation: (payload: QuotationCreatePayload, editingId?: number | null) => Promise<unknown>
  onSaveSuccess?: (result?: unknown) => void
  parseTextFn: (text: string) => Promise<{ items: QuotationItem[]; columns: unknown[]; warnings?: string[] } | null>
}

interface QuotationEditorReturn {
  isSubmitting: Ref<boolean>
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
    rawText = ref(''),
    items = ref([]),
    name = ref(''),
    companyName = ref(''),
    formRef = ref(null),
    formModel = { name: '', companyName: '' },
    editingHistoryId = ref(null),
    originalPayloadStr = ref(''),
    isManualFinalPrice = ref(false),
    setFinalPriceManual,
    restoreAutoFinalPrice,
    setRows = () => {},
    getPayload = () => ({}) as QuotationCreatePayload,
    saveQuotation = async () => {},
    onSaveSuccess,
    parseTextFn = async () => null,
  } = deps

  // 统一使用 useFormSubmit 管理提交 loading：防重 + 防抖 + 自动复位
  const { submitLoading: isSubmitting, withSubmitLock } = useFormSubmit({ lockDuration: 300 })

  const handleManualFinalPriceChange = (value: unknown): void => {
    try {
      if (isViewMode?.value) return

      if (typeof setFinalPriceManual === 'function') {
        setFinalPriceManual(value)
      }
    } catch (_error) {
      void _error
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
      void _error
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

    const mappedRows: QuotationRow[] = (result.items || []).map((item) => ({
      name: String(item.name ?? ''),
      spec: String(item.spec ?? ''),
      quantity: (item.quantity ?? '') as string | number,
      unitPrice: (item.unitPrice ?? '') as string | number,
      totalPrice: (item.totalPrice ?? '') as string | number,
    }))
    setRows(mappedRows, (result.columns || []) as string[])

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

    if (!name.value.trim()) {
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
    // withSubmitLock 内部已处理防重 + 防抖 + 自动复位，无需手动管理 isSubmitting
    await withSubmitLock(async () => {
      name.value = formModel.name
      companyName.value = formModel.companyName

      const [validateErr] = await to(formRef.value?.validate() ?? Promise.resolve(false))
      if (validateErr) return

      if (!validateRows()) return

      const currentName = String(name.value || '').trim()
      const currentCompany = String(companyName.value || '').trim()
      if (currentName && currentCompany) {
        const [suggestErr, suggestRes] = await to(
          quotationApi.suggestName(currentName, currentCompany, editingHistoryId?.value ?? undefined)
        )
        if (!suggestErr && suggestRes?.suggestedName && suggestRes.suggestedName !== currentName) {
          ElMessage.warning(`名称「${currentName}」在该公司下已存在，已自动修改为「${suggestRes.suggestedName}」`)
          name.value = suggestRes.suggestedName
          formModel.name = suggestRes.suggestedName
        }
      }

      const payload = getPayload()

      if (
        editingHistoryId?.value &&
        JSON.stringify(payload) === originalPayloadStr?.value
      ) {
        return showWarning('没有做任何修改，无法保存无用的沉余记录！')
      }

      const [err, result] = await to(
        saveQuotation(payload, editingHistoryId?.value),
      )

      if (err) {
        showError(err, '入库失败，请稍后刷新重试！')
        return
      }

      if (result) {
        showSuccess(editingHistoryId?.value ? '修改成功' : '成功新增报价单')


        if (onSaveSuccess) onSaveSuccess(result)
      }
    })
  }

  return {
    isSubmitting,
    handleManualFinalPriceChange,
    handleDiscountChange,
    handleParseText,
    validateRows,
    handleSubmit,
  }
}

export { useQuotationEditor }
