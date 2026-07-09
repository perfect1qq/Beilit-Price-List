import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import quotationApi from '@/api/quotation'
import { useQuotationDraft } from '@/composables/useQuotationDraft'
import { useQuotationHistory, type HistoryRecord } from '@/composables/useQuotationHistory'
import { useQuotationEditor } from '@/composables/useQuotationEditor'
import { showError } from '@/utils/message'

export const useQuotationHistoryPage = () => {
  const route = useRoute()
  const parsing = ref(false)
  const isSubmitting = ref(false)
  const rulesDisabled = ref(false)
  const viewState = ref<string>('list')
  const activePanels = ref<string[]>([])
  const activeCompanyPanels = ref<string[]>([])
  const formRef = ref(null)
  const formModel = reactive({
    name: '',
    companyName: ''
  })

  const {
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
    isViewMode,
    subtotal,
    autoFinalPrice,
    discountAmount,
    resetDraft,
    setRows,
    addRow,
    removeRow,
    clearRows,
    updateRowTotal,
    setFinalPriceManual,
    restoreAutoFinalPrice,
    loadRecord,
    getPayload,
    originalPayloadStr
  } = useQuotationDraft()

  const {
    groupedHistoryList,
    searchKeyword,
    loading,
    DEFAULT_PAGE_SIZE,
    yearPages,
    getYearPage,
    setYearPage,
    getPagedCompanies,
    getYearTotalPages,
    handleYearPageChange,
    isActionLoading,
    loadHistoryList,
    onKeywordInput,
    saveQuotation,
    deleteHistory
  } = useQuotationHistory({
    api: quotationApi,
    loadToEditor: (record, mode) => loadRecord(record, mode)
  })

  const {
    handleManualFinalPriceChange,
    handleDiscountChange,
    handleParseText,
    handleSubmit
  } = useQuotationEditor({
    isViewMode,
    parsing,
    isSubmitting,
    rawText,
    items,
    name,
    companyName,
    formRef,
    formModel,
    editingHistoryId,
    originalPayloadStr,
    isManualFinalPrice,
    setFinalPriceManual,
    restoreAutoFinalPrice,
    setRows,
    getPayload,
    saveQuotation,
    parseTextFn: quotationApi.parseText.bind(quotationApi),
    onSaveSuccess: async () => {
      rulesDisabled.value = true
      await backToList()
    }
  })

  const fetchQuotationRecord = async (id: number | string) => {
    const result = await quotationApi.get(id)
    return result?.quotation
  }

  const openDetail = async (record: HistoryRecord, mode = 'view') => {
    if (!record?.id) return
    resetDraft()
    if (mode === 'edit') {
      rulesDisabled.value = false
    }
    const detail = (Array.isArray(record.items) && record.items.length > 0) ? record : await fetchQuotationRecord(record.id)
    loadRecord(detail, mode)
    formModel.name = name.value
    formModel.companyName = companyName.value
    viewState.value = 'detail'
  }

  const backToList = async () => {
    viewState.value = 'list'
    resetDraft()
    await loadHistoryList()
  }

  onMounted(async () => {
    try {
      await loadHistoryList()

      const queryId = route.query.id
      const queryMode = String(route.query.mode || 'view')
      if (queryId) {
        const detail = await fetchQuotationRecord(Number(queryId))
        if (detail) {
          if (queryMode === 'edit') {
            rulesDisabled.value = false
          } else {
            rulesDisabled.value = true
          }
          loadRecord(detail, queryMode)
          formModel.name = name.value
          formModel.companyName = companyName.value
          viewState.value = 'detail'
        }
      }
    } catch (error) {
      showError(error, '历史记录加载失败')
    }
  })

  return {
    parsing,
    isSubmitting,
    rulesDisabled,
    viewState,
    activePanels,
    activeCompanyPanels,
    formRef,
    formModel,
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
    isViewMode,
    subtotal,
    autoFinalPrice,
    discountAmount,
    resetDraft,
    setRows,
    addRow,
    removeRow,
    clearRows,
    updateRowTotal,
    setFinalPriceManual,
    restoreAutoFinalPrice,
    loadRecord,
    getPayload,
    originalPayloadStr,
    groupedHistoryList,
    searchKeyword,
    loading,
    DEFAULT_PAGE_SIZE,
    yearPages,
    getYearPage,
    setYearPage,
    getPagedCompanies,
    getYearTotalPages,
    handleYearPageChange,
    isActionLoading,
    loadHistoryList,
    onKeywordInput,
    saveQuotation,
    deleteHistory,
    handleManualFinalPriceChange,
    handleDiscountChange,
    handleParseText,
    handleSubmit,
    fetchQuotationRecord,
    openDetail,
    backToList,
  }
}
