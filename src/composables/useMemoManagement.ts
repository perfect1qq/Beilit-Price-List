import { computed, nextTick, reactive, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { debounce } from '@/utils/debounce'
import memoApi from '@/api/memo'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { useCancelableLoader } from '@/composables/useCancelableLoader'
import { useListQueryState } from '@/composables/useListQueryState'
import { usePermissions } from '@/composables/usePermissions'
import type { MemoData, MemoCreatePayload, MemoHistoryItem, MemoListResult } from '@/types'

interface DateGroup {
  key: string
  date: string
  title: string
  count: number
  items: MemoData[]
}

const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDateLabel = (dateStr: string): string => {
  const date = new Date(`${dateStr}T00:00:00`)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${dateStr} ${weekdays[date.getDay()]}`
}

const groupByDate = (items: MemoData[]): DateGroup[] => {
  const groups = new Map<string, MemoData[]>()

  for (const item of items) {
    const dateStr = item.createdAt ? toLocalDateStr(new Date(item.createdAt)) : '未知日期'
    if (!groups.has(dateStr)) {
      groups.set(dateStr, [])
    }
    groups.get(dateStr)!.push(item)
  }

  const result: DateGroup[] = []
  for (const [dateStr, groupItems] of groups) {
    result.push({
      key: dateStr,
      date: dateStr,
      title: formatDateLabel(dateStr),
      count: groupItems.length,
      items: groupItems.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
        return (b.updatedAt || '').localeCompare(a.updatedAt || '')
      })
    })
  }

  result.sort((a, b) => b.date.localeCompare(a.date))
  return result
}

export const useMemoManagement = () => {
  const { isGuest } = usePermissions()
  const list = shallowRef<MemoData[]>([])
  const hasMore = ref(false)
  const { loading, run: runListLoad, isLatest } = useCancelableLoader()
  const saving = ref(false)
  const { keyword, page, pageSize, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 50, keyword: '' })
  const activeFilter = ref('all')
  const stats = reactive({ total: 0, todoTotal: 0, doneTotal: 0, pinnedTotal: 0 })

  const route = useRoute()
  const highlightId = ref<number | undefined>(undefined)

  const editorVisible = ref(false)
  const editorMode = ref<'create' | 'edit'>('create')
  const editingId = ref<number | null>(null)
  const form = reactive<MemoCreatePayload>({ title: '', content: '', label: '', color: 'blue', pinned: false, completed: false, remindAt: undefined })
  const originalForm = reactive<MemoCreatePayload>({ title: '', content: '', label: '', color: 'blue', pinned: false, completed: false, remindAt: undefined })
  const historyVisible = ref(false)
  const historyTitle = ref('日志')
  const historyList = shallowRef<MemoHistoryItem[]>([])

  const loadMoreTriggerRef = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  const isBoardMode = computed(() => activeFilter.value === 'all')
  const todoList = computed(() => list.value.filter((i: MemoData) => !i.completed))
  const doneList = computed(() => list.value.filter((i: MemoData) => i.completed))
  const groupedTodoList = computed(() => groupByDate(todoList.value))
  const groupedDoneList = computed(() => groupByDate(doneList.value))
  const activeDatePanels = ref<string[]>([])
  const activeDoneDatePanels = ref<string[]>([])
  const emptyDescription = computed(() => '暂无待办任务，给自己定个目标吧')

  const loadList = async (targetPage = page.value, append = false) => {
    await runListLoad(async ({ seq }) => {
      const params: Record<string, unknown> = {
        page: targetPage,
        pageSize: pageSize.value,
        keyword: keyword.value.trim(),
        filter: activeFilter.value,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const res: MemoListResult = await memoApi.list(params)

      if (!isLatest(seq)) return

      const rows = res.list || []
      list.value = append ? [...list.value, ...rows] : rows
      hasMore.value = list.value.length < (Number(res.total) || 0)

      Object.assign(stats, {
        total: res.total || 0,
        todoTotal: res.todoTotal || 0,
        doneTotal: res.doneTotal || 0,
        pinnedTotal: res.pinnedTotal || 0
      })
    })
  }

  const loadNextPage = async () => {
    if (!hasMore.value || loading.value) return
    page.value += 1
    await loadList(page.value, true)
  }

  const initInfiniteObserver = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }

    const target = loadMoreTriggerRef.value
    if (!target) return

    observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          loadNextPage()
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 240px 0px',
        threshold: 0.1
      }
    )

    observer.observe(target)
  }

  const openCreate = () => {
    editorMode.value = 'create'
    Object.assign(form, { title: '', content: '', label: '', color: 'blue', pinned: false, completed: false, remindAt: undefined })
    editorVisible.value = true
  }

  const openEdit = (item: MemoData) => {
    editorMode.value = 'edit'
    editingId.value = item.id ?? null
    Object.assign(form, { ...item })
    Object.assign(originalForm, { ...item })
    editorVisible.value = true
  }

  const saveMemo = async (validateFn: (() => Promise<any> | any) | undefined) => {
    const [validateErr] = await to(validateFn?.() ?? Promise.resolve(undefined))
    if (validateErr) return

    if (editorMode.value === 'edit') {
      const isChanged = JSON.stringify(form) !== JSON.stringify(originalForm)
      if (!isChanged) {
        showWarning('没有做任何修改')
        return
      }
    }

    saving.value = true
    if (editorMode.value === 'create') {
      const [err] = await to(memoApi.create(form))
      if (err) {
        saving.value = false
        return
      }
      showSuccess('新增成功')
      editorVisible.value = false
      page.value = 1
      await loadList(1)
    } else {
      const [err, res] = await to(memoApi.update(editingId.value as number, form))
      if (err) {
        saving.value = false
        return
      }
      showSuccess('修改完成')
      editorVisible.value = false
      const idx = list.value.findIndex((m: MemoData) => m.id === editingId.value)
      if (idx !== -1 && res) {
        const updated = { ...list.value[idx], ...res }
        list.value = [...list.value.slice(0, idx), updated, ...list.value.slice(idx + 1)]
      }
    }
    saving.value = false
  }

  const toggleCompleted = async (item: MemoData) => {
    const nextCompleted = !item.completed
    const [err] = await to(memoApi.update(item.id as number, { ...item, completed: nextCompleted }))
    if (err) {
      showError('网络繁忙，请重试')
      return
    }
    showSuccess(nextCompleted ? '任务已完成' : '已取消完成标记')
    const idx = list.value.findIndex((m: MemoData) => m.id === item.id)
    if (idx !== -1) {
      const updated = { ...list.value[idx], completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : null }
      list.value = [...list.value.slice(0, idx), updated, ...list.value.slice(idx + 1)]
    }
    if (nextCompleted) {
      stats.doneTotal += 1
      stats.todoTotal -= 1
    } else {
      stats.doneTotal -= 1
      stats.todoTotal += 1
    }
  }

  const togglePinned = async (item: MemoData) => {
    const nextPinned = !item.pinned
    const [err] = await to(memoApi.update(item.id as number, { ...item, pinned: nextPinned }))
    if (err) {
      showError('操作失败')
      return
    }
    showSuccess(nextPinned ? '已置顶' : '已取消置顶')
    const idx = list.value.findIndex((m: MemoData) => m.id === item.id)
    if (idx !== -1) {
      const updated = { ...list.value[idx], pinned: nextPinned }
      list.value = [...list.value.slice(0, idx), updated, ...list.value.slice(idx + 1)]
    }
    if (nextPinned) {
      stats.pinnedTotal += 1
    } else {
      stats.pinnedTotal -= 1
    }
  }

  const removeMemo = async (item: MemoData) => {
    const [confirmErr] = await to(ElMessageBox.confirm('任务一旦删除将无法找回，确认继续吗？', '删除确认'))
    if (confirmErr) return

    const [err] = await to(memoApi.remove(item.id as number))
    if (err) return
    showSuccess('删除成功')
    page.value = 1
    await loadList(1)
  }

  const openHistory = async (item: MemoData) => {
    historyTitle.value = `${item.title} 的修订轨迹`
    historyVisible.value = true
    const res = await memoApi.history(item.id as number)
    historyList.value = res?.history?.list || []
  }

  const triggerSearch = debounce(() => {
    resetToFirstPage()
    page.value = 1
    loadList(1)
  }, 300)

  const onKeywordInput = () => triggerSearch()

  const handleFilterChange = () => {
    resetToFirstPage()
    page.value = 1
    loadList(1)
  }

  const init = async () => {
    highlightId.value = route.query.highlight ? Number(typeof route.query.highlight === 'string' ? route.query.highlight : route.query.highlight[0]) : undefined
    await loadList(1)
    initInfiniteObserver()
    if (highlightId.value) {
      nextTick(() => {
        const el = document.querySelector(`[data-memo-id="${highlightId.value}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('highlight-flash')
        }
      })
    }
  }

  const cleanup = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    isGuest,
    list,
    hasMore,
    loading,
    saving,
    keyword,
    page,
    pageSize,
    activeFilter,
    stats,
    highlightId,
    editorVisible,
    editorMode,
    editingId,
    form,
    originalForm,
    historyVisible,
    historyTitle,
    historyList,
    loadMoreTriggerRef,
    isBoardMode,
    todoList,
    doneList,
    groupedTodoList,
    groupedDoneList,
    activeDatePanels,
    activeDoneDatePanels,
    emptyDescription,
    loadList,
    loadNextPage,
    initInfiniteObserver,
    openCreate,
    openEdit,
    saveMemo,
    toggleCompleted,
    togglePinned,
    removeMemo,
    openHistory,
    onKeywordInput,
    handleFilterChange,
    init,
    cleanup,
  }
}
