import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import userApi from '@/api/user'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { useClipboard } from '@/composables/useClipboard'
import type { EditableUserInfo, UserRole } from '@/types'

export function useUserManagement() {
  const loading = ref(false)
  const users = shallowRef<EditableUserInfo[]>([])
  const search = ref('')
  const userStore = useUserStore()
  const currentUser = computed(() => userStore.user || { id: 0, username: '', name: '', role: 'guest' as const })
  const { copy } = useClipboard()

  const inviteCode = ref('')
  const refreshingCode = ref(false)

  const fetchInviteCode = async () => {
    const [err, data] = await to(userApi.getInviteCode())
    if (!err && data?.inviteCode) {
      inviteCode.value = data.inviteCode
    }
  }

  const copyInviteCode = async () => {
    if (!inviteCode.value) return
    await copy(inviteCode.value, '邀请码已复制到剪贴板')
  }

  const handleRefreshCode = async () => {
    refreshingCode.value = true
    const [err, data] = await to(userApi.refreshInviteCode())
    if (err) {
      showError(err, '刷新邀请码失败')
    } else if (data?.inviteCode) {
      inviteCode.value = data.inviteCode
      showSuccess('邀请码已刷新，旧邀请码立即失效')
    }
    refreshingCode.value = false
  }

  const resetDialog = reactive({
    visible: false,
    userId: null as number | null,
    username: '',
    password: ''
  })

  const filteredUsers = computed(() => {
    const kw = search.value.trim().toLowerCase()
    if (!kw) return users.value
    return users.value.filter(u => u.username.toLowerCase().includes(kw))
  })

  const fetchUsers = async () => {
    loading.value = true
    const [err, data] = await to(userApi.list())
    if (err || !data) {
      showError('无法获取用户列表')
      loading.value = false
      return
    }
    users.value = data.users || []
    loading.value = false
  }

  const handleResetClick = (row: EditableUserInfo) => {
    resetDialog.userId = row.id
    resetDialog.username = row.username
    resetDialog.password = ''
    resetDialog.visible = true
  }

  const confirmReset = async (resetDialogRef: { load: (fn: () => Promise<unknown>) => Promise<unknown> } | null) => {
    if (!resetDialog.password) {
      return showWarning('请输入新密码')
    }
    if (resetDialog.password.length < 6) {
      return showWarning('密码长度至少为 6 位')
    }

    try {
      await resetDialogRef?.load(() =>
        userApi.resetPassword(resetDialog.userId as number | string, resetDialog.password)
      )
      showSuccess(`用户 ${resetDialog.username} 的密码已成功重置`)
      resetDialog.visible = false
      resetDialog.password = ''
      resetDialog.userId = null
      resetDialog.username = ''
    } catch (err) {
      showError(err, '重置失败')
    }
  }

  const handleDelete = async (row: EditableUserInfo) => {
    const [confirmErr] = await to(ElMessageBox.confirm(`确定要删除用户 "${row.name || row.username}" 吗？此操作不可恢复！`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }))
    if (confirmErr) return

    const [err] = await to(userApi.remove(row.id))
    if (err) {
      showError(err, '删除用户失败')
      return
    }
    showSuccess('用户已成功删除')
    fetchUsers()
  }

  const handleRoleChange = async (row: EditableUserInfo, newRole: UserRole) => {
    const oldRole = row.role
    const roleLabels: Record<string, string> = { admin: '管理员', user: '业务员', guest: '游客(只读)' }
    const [confirmErr] = await to(ElMessageBox.confirm(`确定要将用户 ${row.username} 的权限修改为 "${roleLabels[newRole] || newRole}" 吗？`, '权限变更确认', {
      type: 'warning',
      confirmButtonText: '确定变更',
      cancelButtonText: '取消'
    }))
    if (confirmErr) {
      row.role = oldRole
      return
    }

    const [err] = await to(userApi.updateRole(row.id, newRole))
    if (err) {
      showError(err, '更新权限失败')
      row.role = oldRole
      fetchUsers()
      return
    }
    row.role = newRole
    showSuccess('用户权限更新成功')
  }

  const startEditName = (row: EditableUserInfo) => {
    row._editingName = true
    row._editNameValue = row.name || ''
  }

  const handleNameBlur = (row: EditableUserInfo) => {
    if (!row._editingName) return
    confirmNameChange(row)
  }

  const confirmNameChange = async (row: EditableUserInfo) => {
    const newName = (row._editNameValue || '').trim()
    if (!newName) {
      row._editingName = false
      return showWarning('姓名不能为空')
    }
    if (newName === row.name) {
      row._editingName = false
      return
    }
    const [err] = await to(userApi.updateName(row.id, newName))
    if (err) {
      showError(err, '修改姓名失败')
      row._editingName = false
      return
    }
    row.name = newName
    row._editingName = false
    if (currentUser.value.id === row.id) {
      userStore.updateName(newName)
    }
    fetchUsers()
    showSuccess('姓名已更新')
  }

  onMounted(() => {
    Promise.all([fetchUsers(), fetchInviteCode()])
  })

  return {
    loading,
    users,
    search,
    currentUser,
    inviteCode,
    refreshingCode,
    resetDialog,
    filteredUsers,
    fetchUsers,
    fetchInviteCode,
    copyInviteCode,
    handleRefreshCode,
    handleResetClick,
    confirmReset,
    handleDelete,
    handleRoleChange,
    startEditName,
    handleNameBlur,
    confirmNameChange,
  }
}
