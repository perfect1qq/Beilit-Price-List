import { ref, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createDebounce } from '@/utils/debounce'
import { useInstantListActions } from '@/composables/useInstantListActions'
import { useListQueryState } from '@/composables/useListQueryState'

const clone = (value) => (value === null || value === undefined ? value : JSON.parse(JSON.stringify(value)))

const formatDateOnly = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).split(' ')[0] || ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const normalizeRecord = (record = {}) => ({
  ...record,
  id: record.id,
  companyName: record.companyName || record.name || record.title || '',
  name: record.name || record.companyName || record.title || '',
  createDate: record.createDate || formatDateOnly(record.createTime || record.createdAt),
  createTime: record.createTime || record.createdAt || '',
  updateTime: record.updateTime || record.updatedAt || ''
})

const hasPaginationMeta = (result) => Boolean(result && (Object.prototype.hasOwnProperty.call(result, 'total') || Object.prototype.hasOwnProperty.call(result, 'page') || Object.prototype.hasOwnProperty.call(result, 'pageSize')))

export function useQuotationHistory({ api, loadToEditor }) {
  const historyList = shallowRef([])
  const { isActionLoading, withActionLock, removeById } = useInstantListActions(historyList)
  const { page, pageSize, keyword: searchKeyword, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 10, keyword: '' })
  const total = ref(0)
  const loading = ref(false)

  const loadHistoryList = async (targetPage = page.value) => {
    loading.value = true
    try {
      const result = await api.list({ page: targetPage, pageSize: pageSize.value, keyword: searchKeyword.value.trim() })
      const rawList = result?.quotations || result?.records || result?.list || result?.items || result || []
      const normalizedList = Array.isArray(rawList) ? rawList.map(normalizeRecord) : []

      if (hasPaginationMeta(result)) {
        historyList.value = normalizedList
        total.value = Number(result?.total ?? normalizedList.length ?? 0)
      } else {
        const start = (targetPage - 1) * pageSize.value
        historyList.value = normalizedList.slice(start, start + pageSize.value)
        total.value = normalizedList.length
      }

      page.value = Number(result?.page || targetPage)
      pageSize.value = Number(result?.pageSize || pageSize.value)
      return historyList.value
    } finally {
      loading.value = false
    }
  }

  const triggerSearch = createDebounce(async () => {
    try {
      resetToFirstPage()
      await loadHistoryList(1)
    } catch (error) {
      ElMessage.error(error?.response?.data?.message || error?.message || '历史记录加载失败')
    }
  }, 300)

  const onKeywordInput = () => {
    triggerSearch()
  }

  const handleCurrentChange = async (val) => {
    try {
      await loadHistoryList(val)
    } catch (error) {
      ElMessage.error(error?.response?.data?.message || error?.message || '历史记录加载失败')
    }
  }

  const handleSizeChange = async (val) => {
    try {
      pageSize.value = val
      resetToFirstPage()
      await loadHistoryList(1)
    } catch (error) {
      ElMessage.error(error?.response?.data?.message || error?.message || '历史记录加载失败')
    }
  }

  const saveQuotation = async (payload, editingId = null) => {
    const body = clone(payload)
    if (editingId) {
      const result = await withActionLock(editingId, async () => api.update(editingId, body))
      const record = normalizeRecord(result?.quotation || result?.record || result)
      const index = historyList.value.findIndex(item => item.id === record.id)
      if (index !== -1) historyList.value[index] = record
      else await loadHistoryList(page.value)
      ElMessage.success('报价单已更新')
      return record
    }

    const result = await api.create(body)
    const record = normalizeRecord(result?.quotation || result?.record || result)
    if (record) historyList.value.unshift(record)
    else await loadHistoryList(1)
    total.value += 1
    ElMessage.success('报价单已保存')
    return record
  }

  const deleteHistory = async (record) => {
    try {
      await ElMessageBox.confirm(`确定要删除公司「${record.companyName || record.name || '-'}」的这条报价单吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return false
    }

    const snapshot = [...historyList.value]
    removeById(record.id)
    try {
      await withActionLock(record.id, async () => {
        await api.remove(record.id)
      })
      await loadHistoryList(page.value)
      ElMessage.success('删除成功')
      return true
    } catch (error) {
      historyList.value = snapshot
      ElMessage.error(error?.message || error?.response?.data?.message || '删除失败')
      return false
    }
  }

  const viewHistory = (record) => {
    loadToEditor(record, 'view')
  }

  const editHistory = (record) => {
    loadToEditor(record, 'edit')
  }

  return {
    historyList,
    searchKeyword,
    page,
    pageSize,
    total,
    loading,
    isActionLoading,
    loadHistoryList,
    onKeywordInput,
    handleCurrentChange,
    handleSizeChange,
    saveQuotation,
    deleteHistory,
    viewHistory,
    editHistory
  }
}
