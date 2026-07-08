import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import approvalApi from '@/api/approval'
import quotationApi from '@/api/quotation'
import { useQuotationDraft } from '@/composables/useQuotationDraft'
import type { QuotationRow } from '@/composables/useQuotationDraft'
import { useQuotationEditor } from '@/composables/useQuotationEditor'
import type { QuotationData, QuotationCreatePayload, QuotationLogData } from '@/types'

export const useApprovalDetail = () => {
  const route = useRoute()
  const router = useRouter()

  const isHistoryRoute = computed(() => String(route.path || '').startsWith('/approval/history/'))
  const editMode = ref(route.query.mode === 'edit' && !isHistoryRoute.value)
  const logs = ref<Array<{ id: number | string; createdAt: string; action: string; operatorName: string; comment?: string }>>([])
  const actionLoading = ref(false)

  const meta = reactive({
    id: null as number | string | null,
    name: '',
    companyName: '',
    ownerName: '',
    status: 'pending' as string
  })

  const {
    companyName,
    remark,
    discount,
    finalPrice,
    items,
    subtotal,
    discountAmount,
    isManualFinalPrice,
    updateRowTotal,
    setFinalPriceManual,
    restoreAutoFinalPrice,
    loadRecord,
    getPayload,
    originalPayloadStr
  } = useQuotationDraft()

  const safeDiscount = computed<number>(() => Number(discount.value || 0) || 0)
  const safeFinalPrice = computed<number>(() => Number(finalPrice.value || 0) || 0)
  const hasUnsavedChanges = computed<boolean>(() => JSON.stringify(getPayload()) !== originalPayloadStr.value)
  const canApprove = computed<boolean>(() => meta.status === 'pending' && !editMode.value && !hasUnsavedChanges.value)
  const approveButtonText = computed<string>(() => (canApprove.value ? '准予通过' : '请先保存修改'))
  const isViewMode = computed(() => !editMode.value || isHistoryRoute.value)

  const tagType = (status: string) => ({
    draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', deleted: 'info',
    submit: 'primary', approve: 'success', reject: 'danger', recall: 'warning'
  }[status] || 'info')

  const statusLabel = (status: string) => ({
    draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', deleted: '已删除',
    submit: '提交审批', approve: '审批通过', reject: '审批驳回'
  }[status] || status)

  const toNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    const num = Number(value)
    return Number.isFinite(num) ? num : undefined
  }

  const {
    handleManualFinalPriceChange,
    handleDiscountChange
  } = useQuotationEditor({
    isViewMode,
    items,
    isManualFinalPrice,
    setFinalPriceManual,
    restoreAutoFinalPrice
  })

  const toInputNumber = (value: unknown): number => {
    const num = Number(value ?? 0)
    return Number.isFinite(num) ? num : 0
  }

  const handleDiscountInput = (value: number | undefined): void => {
    discount.value = toInputNumber(value)
    handleDiscountChange?.()
  }

  const handleFinalPriceInput = (value: number | undefined): void => {
    const nextValue = toInputNumber(value)
    finalPrice.value = nextValue
    handleManualFinalPriceChange?.(nextValue)
  }

  const handleUnitPriceChange = (row: QuotationRow, value: number | undefined): void => {
    row.unitPrice = value ?? 0
    updateRowTotal(row)
  }

  const goBackToList = () => {
    router.push(isHistoryRoute.value ? '/approval/history' : '/approval')
  }

  const loadDetail = async () => {
    const [err, res] = await to(approvalApi.get(String(route.params.id)))
    if (err || !res) {
      showError(err, '加载详情失败')
      return
    }
    const q: Partial<QuotationData> = res.approval || {}
    meta.id = q.id ?? null
    meta.name = q.name ?? ''
    meta.companyName = q.companyName ?? ''
    meta.ownerName = q.ownerName ?? ''
    meta.status = q.status ?? 'pending'
    logs.value = (res.logs || []).map((l: QuotationLogData) => ({
      id: l.id,
      quotationId: l.quotationId,
      action: l.action,
      comment: l.comment ?? undefined,
      operatorId: l.operatorId,
      operatorName: l.operatorName,
      createdAt: l.createdAt,
    }))
    if (isHistoryRoute.value) {
      editMode.value = false
    }
    loadRecord(q, editMode.value && !isHistoryRoute.value ? 'edit' : 'view')
  }

  const save = async () => {
    if (actionLoading.value) return
    if (!companyName.value.trim()) return showWarning('公司名称不能为空')
    const payload = getPayload()
    actionLoading.value = true
    const [err] = await to(quotationApi.update(meta.id as number | string, payload as QuotationCreatePayload))
    if (err) {
      showError(err, '保存失败')
      actionLoading.value = false
      return
    }
    showSuccess('报价单修改成功')
    editMode.value = false
    await loadDetail()
    actionLoading.value = false
  }

  const approve = async () => {
    if (actionLoading.value) return
    if (!canApprove.value) {
      showWarning('请先保存当前修改，再进行准予通过')
      return
    }
    const prevStatus = meta.status
    actionLoading.value = true
    meta.status = 'approved'
    const [err] = await to(quotationApi.approve(meta.id as number | string, '审批通过 (已完成保存后同意)'))
    if (err) {
      meta.status = prevStatus
      showError(err, '操作失败')
      actionLoading.value = false
      return
    }
    showSuccess('审批已通过')
    goBackToList()
  }

  const reject = async () => {
    if (actionLoading.value) return
    const prevStatus = meta.status
    const [promptErr, promptRes] = await to(ElMessageBox.prompt('请输入驳回原因', '审批驳回', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }))
    if (promptErr) return

    actionLoading.value = true
    meta.status = 'rejected'
    const [apiErr] = await to(quotationApi.reject(meta.id as number | string, promptRes?.value || '拒绝'))
    if (apiErr) {
      meta.status = prevStatus
      actionLoading.value = false
      return
    }
    showSuccess('已驳回')
    goBackToList()
  }

  watch(
    () => [route.params.id, route.path, route.query.mode],
    () => {
      editMode.value = !isHistoryRoute.value && route.query.mode === 'edit'
      loadDetail()
    },
    { immediate: true }
  )

  return {
    isHistoryRoute,
    editMode,
    logs,
    actionLoading,
    meta,
    companyName,
    remark,
    discount,
    finalPrice,
    items,
    subtotal,
    discountAmount,
    isManualFinalPrice,
    safeDiscount,
    safeFinalPrice,
    canApprove,
    approveButtonText,
    tagType,
    statusLabel,
    toNumber,
    handleDiscountInput,
    handleFinalPriceInput,
    handleUnitPriceChange,
    updateRowTotal,
    restoreAutoFinalPrice,
    goBackToList,
    loadDetail,
    save,
    approve,
    reject,
  }
}
