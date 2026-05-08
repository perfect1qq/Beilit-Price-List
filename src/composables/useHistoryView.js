/**
 * @module composables/useHistoryView
 * @description 通用历史记录视图管理 composable
 *
 * 提供历史记录页面的通用状态管理：
 * - 列表/详情视图切换
 * - 搜索 + 分页
 * - 删除确认 + 乐观更新
 * - 操作锁防重复点击
 */

import { ref, shallowRef } from 'vue'
import { ElMessageBox } from 'element-plus'
import { createDebounce } from '@/utils/debounce'
import { to } from '@/utils/async'
import { showError, showSuccess } from '@/utils/message'
import { useInstantListActions } from '@/composables/useInstantListActions'

export function useHistoryView({ api, fetchList, onEnterDetail }) {
  const viewState = ref('list')
  const historyList = shallowRef([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const searchKeyword = ref('')

  const { isActionLoading, withActionLock, replaceById, removeById } = useInstantListActions(historyList)

  const loadList = async (targetPage) => {
    if (!targetPage) targetPage = page.value || 1
    if (loading.value) return
    loading.value = true

    const loader = fetchList || (async (p) => {
      const [err, res] = await to(api.list({ page: p, pageSize: pageSize.value, keyword: searchKeyword.value.trim() }))
      if (err) throw err
      return res
    })

    try {
      const res = await loader(targetPage)
      const rawList = res?.list || res?.records || res?.items || res || []
      const list = Array.isArray(rawList) ? rawList : []

      if (res && (Object.prototype.hasOwnProperty.call(res, 'total') || Object.prototype.hasOwnProperty.call(res, 'page'))) {
        historyList.value = list
        total.value = Number(res?.total ?? list.length ?? 0)
        page.value = Number(res?.page || targetPage)
        pageSize.value = Number(res?.pageSize || pageSize.value)
      } else {
        const start = (targetPage - 1) * pageSize.value
        historyList.value = list.slice(start, start + pageSize.value)
        total.value = list.length
      }
    } catch (err) {
      showError(err, '加载失败')
    } finally {
      loading.value = false
    }
  }

  const handleCurrentChange = (val) => {
    page.value = val
    loadList(page.value)
  }

  const handleSizeChange = (val) => {
    pageSize.value = val
    page.value = 1
    loadList(1)
  }

  const triggerSearch = createDebounce(async () => {
    page.value = 1
    await loadList(1)
  }, 300)

  const onKeywordInput = () => triggerSearch()

  const handleSearch = () => loadList(1)

  const enterDetail = (row, mode) => {
    if (onEnterDetail) {
      onEnterDetail(row, mode)
    }
    viewState.value = mode
  }

  const backToList = async () => {
    viewState.value = 'list'
    await loadList(page.value)
  }

  const handleDelete = async (row, nameKey = 'name') => {
    const name = row[nameKey] || row.name || '未命名'
    const [confirmErr] = await to(ElMessageBox.confirm(`确定删除"${name}"？`, '提示', { type: 'warning' }))
    if (confirmErr) return

    const snapshot = [...(historyList.value || [])]
    removeById(row.id)
    const [err] = await to(withActionLock(row.id, async () => {
      await api.remove(row.id)
    }))
    if (err) {
      historyList.value = snapshot
      showError(err, '删除失败')
      return
    }
    showSuccess('删除成功')
    await loadList(page.value)
  }

  return {
    viewState,
    historyList,
    loading,
    page,
    pageSize,
    total,
    searchKeyword,
    isActionLoading,
    withActionLock,
    replaceById,
    removeById,
    loadList,
    handleCurrentChange,
    handleSizeChange,
    onKeywordInput,
    handleSearch,
    enterDetail,
    backToList,
    handleDelete,
  }
}
