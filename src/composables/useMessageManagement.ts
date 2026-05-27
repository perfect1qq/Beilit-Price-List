import { computed, h, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue'
import { ElButton, ElMessageBox, ElTag } from 'element-plus'
import messageApi from '@/api/message'
import userApi from '@/api/user'
import type { MessageData } from '@/types'
import { debounce } from '@/utils/debounce'
import { to } from '@/utils/async'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/date'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { useCancelableLoader } from '@/composables/useCancelableLoader'
import { useInstantListActions } from '@/composables/useInstantListActions'
import { usePermissions } from '@/composables/usePermissions'

interface StaffUser {
  id: number
  username: string
  name: string
  role: string
}

export function useMessageManagement() {
  const userStore = useUserStore()
  const { isAdmin, isGuest } = usePermissions()

  const pageTitle = computed(() => {
    if (isGuest.value) return '留言板（只读）'
    return isAdmin.value ? '留言管理' : '我的留言'
  })
  const pageSubtitle = computed(() => {
    if (isGuest.value) return '游客仅可查看留言内容，无法进行任何操作。'
    if (isAdmin.value) return '管理员可查看全部线索、统一指派业务员，并按需删除无效线索。'
    return '当前账号只会看到被分配给自己的线索。'
  })

  const messages = shallowRef<MessageData[]>([])
  const { loading, loadError, run: runListLoad, isLatest } = useCancelableLoader()
  const VIRTUAL_TABLE_THRESHOLD = 80
  const useVirtualTable = computed(() => messages.value.length >= VIRTUAL_TABLE_THRESHOLD)

  const viewVisible = ref(false)
  const viewRow = ref<MessageData | null>(null)
  const viewTitle = computed(() => (viewRow.value ? `留言详情 #${viewRow.value.id}` : '留言详情'))

  const staffList = shallowRef<StaffUser[]>([])
  const assignVisible = ref(false)
  const assignLoading = ref(false)
  const assignForm = reactive({ messageId: null as number | string | null, userId: null as number | string | null })
  const { isActionLoading, withActionLock, replaceById, removeById } = useInstantListActions(messages)

  const keyword = ref('')
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const refreshCurrentUser = () => {
    userStore.refreshProfile()
  }

  const loadMessages = async (targetPage?: number) => {
    if (!targetPage) targetPage = page.value || 1
    const runResult = await runListLoad(async ({ signal, seq }) => {
      const res = await messageApi.list({
        page: targetPage,
        pageSize: pageSize.value,
        keyword: keyword.value.trim()
      }, { signal })
      if (!isLatest(seq)) return
      messages.value = res.list || []
      total.value = res.total || 0
      page.value = res.page || targetPage
      pageSize.value = res.pageSize || pageSize.value
    })
    if (!runResult.ok && !runResult.canceled) {
      showError(loadError.value || '获取留言列表失败')
    }
  }

  const resetToFirstPage = () => {
    page.value = 1
  }

  const loadStaff = async () => {
    if (!isAdmin.value) return
    const [, res] = await to(userApi.list())
    staffList.value = (res?.users || []).filter((u: StaffUser) => u.role !== 'admin')
  }

  const triggerSearch = debounce(() => {
    resetToFirstPage()
    loadMessages(page.value)
  }, 300)

  const handleSearch = () => {
    triggerSearch()
  }

  const openView = (row: MessageData) => {
    viewRow.value = row
    viewVisible.value = true
  }

  const openAssign = (row: MessageData) => {
    assignForm.messageId = row.id
    assignForm.userId = row.assignedTo || null
    assignVisible.value = true
  }

  const statusText = (row: MessageData) => (row?.status === 'assigned' ? '已指派' : '待处理')
  const statusType = (row: MessageData) => (row?.status === 'assigned' ? 'success' : 'warning')

  const confirmAssign = async () => {
    if (!assignForm.userId) return showWarning('请选择业务员')
    const currentId = assignForm.messageId as number | string
    const before = (messages.value || []).find((m) => m.id === currentId)
    const selectedUser = staffList.value.find((u) => u.id === assignForm.userId) || null
    if (!before) return

    replaceById(currentId, {
      assignedTo: Number(assignForm.userId) || null,
      status: 'assigned',
      assignee: selectedUser ? { id: selectedUser.id, username: selectedUser.username, name: selectedUser.name } : before?.assignee
    })

    assignLoading.value = true
    const [err] = await to(withActionLock(currentId, async () => {
      await messageApi.assign(currentId, Number(assignForm.userId))
    }))
    if (err) {
      replaceById(currentId, before)
      showError(err, '指派失败')
      assignLoading.value = false
      return
    }
    showSuccess('指派成功')
    assignVisible.value = false
    await loadMessages(page.value)
    assignLoading.value = false
  }

  const doHideFromList = async (row: MessageData) => {
    const [confirmErr] = await to(ElMessageBox.confirm(
      '确定从「我的指派」中删除这条留言吗？删除后您将不再看到它，超级管理员仍可在后台查看完整数据。',
      '提示',
      { type: 'warning' }
    ))
    if (confirmErr) return

    removeById(row.id)
    total.value = Math.max(0, Number(total.value || 0) - 1)
    const [err] = await to(withActionLock(row.id, async () => {
      await messageApi.hideFromAssignee(row.id)
    }))
    if (err) {
      await loadMessages(page.value)
      showError(err, '操作失败')
      return
    }
    showSuccess('已从我的列表移除')
    await loadMessages(page.value)
  }

  const doDelete = async (row: MessageData) => {
    const [confirmErr] = await to(ElMessageBox.confirm('确定删除这条留言吗？', '提示', { type: 'warning' }))
    if (confirmErr) return

    removeById(row.id)
    total.value = Math.max(0, Number(total.value || 0) - 1)
    const [err] = await to(withActionLock(row.id, async () => {
      await messageApi.remove(row.id)
    }))
    if (err) {
      await loadMessages(page.value)
      showError(err, '删除失败')
      return
    }
    showSuccess('已删除')
    await loadMessages(page.value)
  }

  const virtualColumns = computed(() => {
    const baseColumns = [
      {
        key: 'createdAt',
        dataKey: 'createdAt',
        title: '提交时间',
        width: 170,
        align: 'center',
        cellRenderer: ({ rowData }: { rowData: MessageData }) => formatTime(rowData?.createdAt)
      },
      {
        key: 'contactInfo',
        dataKey: 'contactInfo',
        title: '联系方式',
        width: 230
      },
      {
        key: 'content',
        dataKey: 'content',
        title: '留言内容',
        width: 380
      },
      {
        key: 'status',
        dataKey: 'status',
        title: '状态',
        width: 150,
        align: 'center',
        cellRenderer: ({ rowData }: { rowData: MessageData }) => {
          const tags = [
            h(
              ElTag,
              { size: 'small', type: statusType(rowData) },
              () => statusText(rowData)
            )
          ]
          if (isAdmin.value && rowData?.hiddenByAssignee) {
            tags.push(h(ElTag, { size: 'small', type: 'info', class: 'status-extra' }, () => '已隐藏'))
          }
          return h('div', { class: 'status-cell' }, tags)
        }
      },
      {
        key: 'assignee',
        dataKey: 'assignee',
        title: '跟进人',
        width: 130,
        align: 'center',
        cellRenderer: ({ rowData }: { rowData: MessageData }) => ((rowData?.assignee?.name || '').trim() || rowData?.assignee?.username) || '—'
      }
    ]

    baseColumns.push({
      key: 'actions',
      dataKey: 'actions',
      title: '操作',
      width: isAdmin.value ? 260 : 200,
      align: 'center',
      cellRenderer: ({ rowData }: { rowData: MessageData }) =>
        h('div', { class: 'virtual-actions' }, [
          h(
            ElButton,
            {
              type: 'primary',
              link: true,
              size: 'small',
              onClick: () => openView(rowData)
            },
            () => '查看'
          ),
          ...(isAdmin.value
            ? [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  loading: isActionLoading(rowData?.id),
                  onClick: () => openAssign(rowData)
                },
                () => '指派'
              ),
              h(
                ElButton,
                {
                  type: 'danger',
                  link: true,
                  size: 'small',
                  loading: isActionLoading(rowData?.id),
                  onClick: () => doDelete(rowData)
                },
                () => '删除'
              )
            ]
            : [
              h(
                ElButton,
                {
                  type: 'danger',
                  link: true,
                  size: 'small',
                  loading: isActionLoading(rowData?.id),
                  onClick: () => doHideFromList(rowData)
                },
                () => '删除'
              )
            ])
        ])
    })

    return baseColumns
  })

  const formatTime = (dateStr?: string) => formatDateTime(dateStr || '')

  const init = () => {
    refreshCurrentUser()
    Promise.all([loadMessages(1), loadStaff()])
    window.addEventListener('storage', refreshCurrentUser)
  }

  const cleanup = () => {
    triggerSearch.cancel?.()
    window.removeEventListener('storage', refreshCurrentUser)
  }

  onMounted(() => init())
  onUnmounted(() => cleanup())

  return {
    isAdmin,
    isGuest,
    pageTitle,
    pageSubtitle,
    messages,
    loading,
    loadError,
    useVirtualTable,
    viewVisible,
    viewRow,
    viewTitle,
    staffList,
    assignVisible,
    assignLoading,
    assignForm,
    isActionLoading,
    keyword,
    page,
    pageSize,
    total,
    virtualColumns,
    formatTime,
    loadMessages,
    handleSearch,
    openView,
    openAssign,
    confirmAssign,
    doHideFromList,
    doDelete,
  }
}
