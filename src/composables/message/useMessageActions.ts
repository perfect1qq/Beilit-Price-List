import { computed, reactive, ref, shallowRef } from 'vue'
import { ElMessageBox } from 'element-plus'
import messageApi from '@/api/message'
import userApi from '@/api/user'
import type { MessageData } from '@/types'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { useInstantListActions } from '@/composables/useInstantListActions'
import { usePermissions } from '@/composables/usePermissions'
import type { ShallowRef } from 'vue'

interface StaffUser {
  id: number
  username: string
  name: string
  role: string
}

export function useMessageActions(messages: ShallowRef<MessageData[]>, opts: {
  loadMessages: (page?: number) => Promise<void>
  page: { value: number }
  total: { value: number }
}) {
  const { isAdmin } = usePermissions()
  const { isActionLoading, withActionLock, replaceById, removeById } = useInstantListActions(messages)

  const viewVisible = ref(false)
  const viewRow = ref<MessageData | null>(null)
  const viewTitle = computed(() => (viewRow.value ? `留言详情 #${viewRow.value.id}` : '留言详情'))

  const staffList = shallowRef<StaffUser[]>([])
  const assignVisible = ref(false)
  const assignLoading = ref(false)
  const assignForm = reactive({ messageId: null as number | string | null, userId: null as number | string | null })

  const loadStaff = async () => {
    if (!isAdmin.value) return
    const [, res] = await to(userApi.list())
    staffList.value = (res?.users || []).filter((u: StaffUser) => u.role !== 'admin')
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
    await opts.loadMessages(opts.page.value)
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
    opts.total.value = Math.max(0, Number(opts.total.value || 0) - 1)
    const [err] = await to(withActionLock(row.id, async () => {
      await messageApi.hideFromAssignee(row.id)
    }))
    if (err) {
      await opts.loadMessages(opts.page.value)
      showError(err, '操作失败')
      return
    }
    showSuccess('已从我的列表移除')
    await opts.loadMessages(opts.page.value)
  }

  const doDelete = async (row: MessageData) => {
    const [confirmErr] = await to(ElMessageBox.confirm('确定删除这条留言吗？', '提示', { type: 'warning' }))
    if (confirmErr) return

    removeById(row.id)
    opts.total.value = Math.max(0, Number(opts.total.value || 0) - 1)
    const [err] = await to(withActionLock(row.id, async () => {
      await messageApi.remove(row.id)
    }))
    if (err) {
      await opts.loadMessages(opts.page.value)
      showError(err, '删除失败')
      return
    }
    showSuccess('已删除')
    await opts.loadMessages(opts.page.value)
  }

  return {
    isActionLoading,
    viewVisible,
    viewRow,
    viewTitle,
    staffList,
    assignVisible,
    assignLoading,
    assignForm,
    loadStaff,
    openView,
    openAssign,
    confirmAssign,
    doHideFromList,
    doDelete,
    statusText,
    statusType,
  }
}
