import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue'
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

type MemoFilter = 'all' | 'todo' | 'done' | 'pinned'

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
  const { loading, run: runListLoad, isLatest } = useCancelableLoader()
  const saving = ref(false)
  const { keyword, page, pageSize, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 10, keyword: '' })
  const activeFilter = ref<MemoFilter>('all')
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

  const isBoardMode = computed(() => activeFilter.value === 'all')
  const todoList = computed(() => list.value.filter((i: MemoData) => !i.completed))
  const doneList = computed(() => list.value.filter((i: MemoData) => i.completed))

  const allDateGroups = computed(() => groupByDate(list.value))
  const allTodoGroups = computed(() => groupByDate(todoList.value))
  const allDoneGroups = computed(() => groupByDate(doneList.value))

  const total = computed(() => isBoardMode.value ? allDoneGroups.value.length : allDateGroups.value.length)

  const pagedGroups = computed(() => {
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    return allDateGroups.value.slice(start, end)
  })

  const pagedDoneGroups = computed(() => {
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    return allDoneGroups.value.slice(start, end)
  })

  const todoVisibleCount = ref(10)
  const visibleTodoGroups = computed(() => allTodoGroups.value.slice(0, todoVisibleCount.value))
  const todoHasMore = computed(() => todoVisibleCount.value < allTodoGroups.value.length)

  const todoLoadMoreTriggerRef = ref<HTMLElement | null>(null)
  let todoObserver: IntersectionObserver | null = null

  const loadMoreTodoGroups = () => {
    if (!todoHasMore.value) return
    todoVisibleCount.value += 10
  }

  watch(todoLoadMoreTriggerRef, (el) => {
    if (todoObserver) {
      todoObserver.disconnect()
      todoObserver = null
    }
    if (el) {
      todoObserver = new IntersectionObserver(
        entries => {
          const [entry] = entries
          if (entry?.isIntersecting) {
            loadMoreTodoGroups()
          }
        },
        { rootMargin: '0px 0px 240px 0px', threshold: 0.1 }
      )
      todoObserver.observe(el)
    }
  })

  watch(list, () => {
    todoVisibleCount.value = 10
  })

  const activeDatePanels = ref<string[]>([])
  const activeDoneDatePanels = ref<string[]>([])
  const activeListDatePanels = ref<string[]>([])
  const emptyDescription = computed(() => '暂无待办任务，给自己定个目标吧')

  const loadList = async () => {
    await runListLoad(async ({ seq }) => {
      const params: Record<string, unknown> = {
        page: 1,
        pageSize: 100000,
        keyword: keyword.value.trim(),
        filter: activeFilter.value,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const res: MemoListResult = await memoApi.list(params)

      if (!isLatest(seq)) return

      list.value = res.list || []

      if (activeFilter.value === 'all') {
        Object.assign(stats, {
          total: res.total || 0,
          todoTotal: res.todoTotal || 0,
          doneTotal: res.doneTotal || 0,
          pinnedTotal: res.pinnedTotal || 0
        })
      }
    })
  }

  const handlePageChange = (newPage: number) => {
    page.value = newPage
    activeDatePanels.value = []
    activeDoneDatePanels.value = []
    activeListDatePanels.value = []
  }

  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    activeDatePanels.value = []
    activeDoneDatePanels.value = []
    activeListDatePanels.value = []
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
      stats.total += 1
      if (form.completed) {
        stats.doneTotal += 1
      } else {
        stats.todoTotal += 1
      }
      if (form.pinned) {
        stats.pinnedTotal += 1
      }
      page.value = 1
      await loadList()
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
    stats.total = Math.max(0, stats.total - 1)
    if (item.completed) {
      stats.doneTotal = Math.max(0, stats.doneTotal - 1)
    } else {
      stats.todoTotal = Math.max(0, stats.todoTotal - 1)
    }
    if (item.pinned) {
      stats.pinnedTotal = Math.max(0, stats.pinnedTotal - 1)
    }
    page.value = 1
    await loadList()
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
    loadList()
  }, 300)

  const onKeywordInput = () => triggerSearch()

  const setFilter = (filter: string) => {
    if (activeFilter.value === filter) return
    activeFilter.value = filter as MemoFilter
    resetToFirstPage()
    page.value = 1
    loadList()
  }

  const init = async () => {
    highlightId.value = route.query.highlight ? Number(typeof route.query.highlight === 'string' ? route.query.highlight : route.query.highlight[0]) : undefined
    await loadList()
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
    if (todoObserver) {
      todoObserver.disconnect()
      todoObserver = null
    }
  }

  return {
    isGuest,
    list,
    total,
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
    isBoardMode,
    todoList,
    doneList,
    visibleTodoGroups,
    todoHasMore,
    todoLoadMoreTriggerRef,
    pagedDoneGroups,
    pagedGroups,
    activeDatePanels,
    activeDoneDatePanels,
    activeListDatePanels,
    emptyDescription,
    loadList,
    handlePageChange,
    handleSizeChange,
    setFilter,
    openCreate,
    openEdit,
    saveMemo,
    toggleCompleted,
    togglePinned,
    removeMemo,
    openHistory,
    onKeywordInput,
    init,
    cleanup,
  }
}
