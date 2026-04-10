import { ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

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
    try {
      const resCount = await request.get('/api/notifications/unread-count')
      const newCount = resCount.data?.count ?? 0
      const oldCount = unreadApprovalCount.value

      const resList = await request.get('/api/notifications')
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
    } catch {
      // ignore
    }
  }

  const handleNoticeClick = async (notice) => {
    if (!notice?.id) return
    try {
      await request.put(`/api/notifications/${notice.id}/read`)
      await fetchUnreadCount()
      const targetPath = notice.type === 'quotation_submitted'
        ? `/approval/${notice.relatedId}?mode=edit`
        : '/quotation'
      router.push(targetPath)
    } catch (err) {
      console.error('处理通知失败', err)
    }
  }

  const markAllAsRead = async (e) => {
    if (e) e.stopPropagation()
    try {
      await request.post('/api/notifications/read-all')
      await fetchUnreadCount()
      ElMessage.success('已全部标记为已读')
    } catch {
      ElMessage.error('操作失败')
    }
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
