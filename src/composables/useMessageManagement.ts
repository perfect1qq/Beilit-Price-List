import { onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/date'
import { useMessageList } from './message/useMessageList'
import { useMessageActions } from './message/useMessageActions'
import { useMessageColumns } from './message/useMessageColumns'

export function useMessageManagement() {
  const userStore = useUserStore()

  const {
    isAdmin,
    isGuest,
    messages,
    loading,
    loadError,
    useVirtualTable,
    keyword,
    page,
    pageSize,
    total,
    pageTitle,
    pageSubtitle,
    loadMessages,
    handleSearch,
    triggerSearch,
  } = useMessageList()

  const {
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
  } = useMessageActions(messages, { loadMessages, page, total })

  const { virtualColumns } = useMessageColumns({
    openView,
    openAssign,
    doDelete,
    doHideFromList,
    isActionLoading,
    statusText,
    statusType,
  })

  const formatTime = (dateStr?: string) => formatDateTime(dateStr || '')

  const refreshCurrentUser = () => {
    userStore.refreshProfile()
  }

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
