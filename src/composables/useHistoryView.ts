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

import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import { ElMessageBox } from 'element-plus'
import { debounce } from '@/utils/debounce'
import { to } from '@/utils/async'
import { showError, showSuccess } from '@/utils/message'
import { useInstantListActions } from '@/composables/useInstantListActions'

interface ListResult {
  list?: unknown[]
  records?: unknown[]
  items?: unknown[]
  total?: number
  page?: number
  pageSize?: number
  [key: string]: unknown
}

interface HistoryViewOptions {
  api: {
    list: (params: Record<string, unknown>) => Promise<ListResult>
    remove: (id: number | string) => Promise<unknown>
  }
  fetchList?: (page: number) => Promise<ListResult>
  onEnterDetail?: (row: Record<string, unknown>, mode: string) => void
}

interface HistoryViewReturn {
  viewState: Ref<string>
  historyList: ShallowRef<Record<string, unknown>[]>
  loading: Ref<boolean>
  page: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  searchKeyword: Ref<string>
  isActionLoading: (id: number | string) => boolean
  withActionLock: <R>(id: number | string, task: () => Promise<R>) => Promise<R | false>
  replaceById: (id: number | string, updater: unknown) => void
  removeById: (id: number | string) => void
  loadList: (targetPage?: number) => Promise<void>
  handleCurrentChange: (val: number) => void
  handleSizeChange: (val: number) => void
  onKeywordInput: () => void
  handleSearch: () => void
  enterDetail: (row: Record<string, unknown>, mode: string) => void
  backToList: () => Promise<void>
  handleDelete: (row: Record<string, unknown>, nameKey?: string) => Promise<void>
}

export function useHistoryView({ api, fetchList, onEnterDetail }: HistoryViewOptions): HistoryViewReturn {
  const viewState = ref('list')
  const historyList = shallowRef<(Record<string, unknown> & { id: number | string })[]>([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const searchKeyword = ref('')

  const { isActionLoading, withActionLock, replaceById, removeById } = useInstantListActions(historyList)

  const loadList = async (targetPage?: number): Promise<void> => {
    if (!targetPage) targetPage = page.value || 1
    if (loading.value) return
    loading.value = true

    const loader = fetchList || (async (p: number) => {
      const [err, res] = await to(api.list({ page: p, pageSize: pageSize.value, keyword: searchKeyword.value.trim() }))
      if (err) throw err
      return res as ListResult
    })

    try {
      const res = await loader(targetPage)
      const rawList = res?.list || res?.records || res?.items || res || []
      const list = Array.isArray(rawList) ? rawList : []

      if (res && (Object.prototype.hasOwnProperty.call(res, 'total') || Object.prototype.hasOwnProperty.call(res, 'page'))) {
        historyList.value = list as (Record<string, unknown> & { id: number | string })[]
        total.value = Number(res?.total ?? list.length ?? 0)
        page.value = Number(res?.page || targetPage)
        pageSize.value = Number(res?.pageSize || pageSize.value)
      } else {
        const start = (targetPage - 1) * pageSize.value
        historyList.value = (list as (Record<string, unknown> & { id: number | string })[]).slice(start, start + pageSize.value)
        total.value = list.length
      }
    } catch (err) {
      showError(err as string, '加载失败')
    } finally {
      loading.value = false
    }
  }

  const handleCurrentChange = (val: number): void => {
    page.value = val
    loadList(page.value)
  }

  const handleSizeChange = (val: number): void => {
    pageSize.value = val
    page.value = 1
    loadList(1)
  }

  const triggerSearch = debounce(async () => {
    page.value = 1
    await loadList(1)
  }, 300)

  const onKeywordInput = (): void => triggerSearch()

  const handleSearch = (): void => { loadList(1) }

  const enterDetail = (row: Record<string, unknown>, mode: string): void => {
    if (onEnterDetail) {
      onEnterDetail(row, mode)
    }
    viewState.value = mode
  }

  const backToList = async (): Promise<void> => {
    viewState.value = 'list'
    await loadList(page.value)
  }

  const handleDelete = async (row: Record<string, unknown>, nameKey = 'name'): Promise<void> => {
    const name = row[nameKey] || row.name || '未命名'
    const [confirmErr] = await to(ElMessageBox.confirm(`确定删除"${name}"？`, '提示', { type: 'warning' }))
    if (confirmErr) return

    const snapshot = [...(historyList.value || [])]
    removeById(row.id as number | string)
    const [err] = await to(withActionLock(row.id as number | string, async () => {
      await api.remove(row.id as number | string)
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
    replaceById: replaceById as (id: number | string, updater: unknown) => void,
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
