import { ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { to } from '@/utils/async'

/**
 * 顶栏通知中心逻辑（轮询、已读、跳转）封装。
 */
export const useNavbarNotifications = ({ request, router, userRole }) => {
  const unreadApprovalCount = ref(0)
  const noticeList = ref([])
  const isBellRinging = ref(false)
  const isInitialLoad = ref(true)

  const triggerBellRing = () => {
    if (isBellRinging.value) return
    isBellRinging.value = true
    setTimeout(() => { isBellRinging.value = false }, 1000)
  }

  const fetchUnreadCount = async () => {
    const [countErr, resCount] = await to(request.get('/api/notifications/unread-count'))
    if (countErr) return

    const newCount = resCount.data?.count ?? 0
    const oldCount = unreadApprovalCount.value

    const [listErr, resList] = await to(request.get('/api/notifications'))
    if (listErr) return
    noticeList.value = (resList.data.list || []).slice(0, 10)

    if (newCount > oldCount) {
      triggerBellRing()
      const latest = noticeList.value?.[0]
      if (latest && !isInitialLoad.value) {
        ElNotification({
          title: '系统消息待处理',
          message: latest.content,
          type: 'warning',
          position: 'top-right',
          duration: 4500,
          offset: 60,
          onClick: () => handleNoticeClick(latest)
        })
      }
    }
    unreadApprovalCount.value = newCount
    isInitialLoad.value = false
  }

  const handleNoticeClick = async (notice) => {
    if (!notice?.id) return
    const [err] = await to(request.put(`/api/notifications/${notice.id}/read`))
    if (err) return
    await fetchUnreadCount()
    const targetPath = notice.type === 'quotation_submitted'
      ? `/approval/${notice.relatedId}?mode=edit`
      : notice.type === 'memo_reminder'
        ? `/memo-management?highlight=${notice.relatedId}`
        : '/quotation'
    router.push(targetPath)
  }

  const markAllAsRead = async (e) => {
    if (e) e.stopPropagation()
    const [err] = await to(request.post('/api/notifications/read-all'))
    if (err) {
      ElMessage.error('操作失败')
      return
    }
    await fetchUnreadCount()
    ElMessage.success('已全部标记为已读')
  }

  const goNoticePage = () => {
    if (userRole.value === 'admin') router.push('/approval')
    else router.push('/quotation')
  }

  return {
    unreadApprovalCount,
    noticeList,
    isBellRinging,
    fetchUnreadCount,
    handleNoticeClick,
    markAllAsRead,
    goNoticePage
  }
}
