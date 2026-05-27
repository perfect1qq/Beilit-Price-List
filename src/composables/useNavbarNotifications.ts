/**
 * @module composables/useNavbarNotifications
 * @description 顶栏通知中心组合式函数
 *
 * 功能说明：
 * - 管理顶栏铃铛图标的通知状态
 * - 轮询获取未读消息数量
 * - 新消息到达时触发铃铛动画和系统通知
 * - 支持单条消息已读标记和全部已读
 * - 根据消息类型智能跳转到对应页面
 *
 * 通知类型与跳转规则：
 * ┌─────────────────────┬──────────────────────────────────────────┐
 * │  type                │  跳转目标                                 │
 * ├─────────────────────┼──────────────────────────────────────────┤
 * │  quotation_submitted │  /approval/:id?mode=edit (审批页面)      │
 * │  memo_reminder       │  /memo-management?highlight=:id (备忘录)  │
 * │  其他                 │  /quotation (报价单列表)                  │
 * └─────────────────────┴──────────────────────────────────────────┘
 *
 * 数据流：
 * ┌──────────────┐    轮询     ┌──────────────────┐
 * │  后端 API     │ ◀───────── │  fetchUnreadCount  │
 * │              │            │                    │
 * │  /api/        │ ─────────▶ │  unreadApprovalCount│
 * │  notifications│   返回数据  │  noticeList         │
 * └──────────────┘            └────────┬───────────┘
 *                                     │ 新消息时
 *                                     ▼
 *                            ┌──────────────────┐
 *                            │  triggerBellRing   │
 *                            │  ElNotification    │
 *                            └──────────────────┘
 *
 * @example
 * // 在 Navbar 组件中使用
 * const { unreadApprovalCount, isBellRinging, fetchUnreadCount } =
 *   useNavbarNotifications({ request, router, isAdmin })
 *
 * // 定时轮询（建议间隔 30-60 秒）
 * setInterval(fetchUnreadCount, 30000)
 */

import { ref, shallowRef, triggerRef, type Ref, type ComputedRef } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { to } from '@/utils/async'
import { notificationApi } from '@/api/notifications'
import type { NotificationData } from '@/types'
import type { Router } from 'vue-router'

interface NavbarNotificationsDeps {
  request: unknown
  router: Router
  isAdmin: ComputedRef<boolean>
}

interface NavbarNotificationsReturn {
  unreadApprovalCount: Ref<number>
  noticeList: Ref<NotificationData[]>
  deletingIds: Ref<Set<number>>
  isBellRinging: Ref<boolean>
  fetchUnreadCount: () => Promise<void>
  handleNoticeClick: (notice: NotificationData) => Promise<void>
  markAllAsRead: (e?: Event) => Promise<void>
  deleteNotification: (notice: NotificationData, e?: Event) => Promise<void>
  goNoticePage: () => void
}

export const useNavbarNotifications = ({ request: _request, router, isAdmin }: NavbarNotificationsDeps): NavbarNotificationsReturn => {
  const unreadApprovalCount = ref(0)

  const noticeList = shallowRef<NotificationData[]>([])

  const deletingIds = ref(new Set<number>())

  const isBellRinging = ref(false)

  const isInitialLoad = ref(true)
  let isFetching = false

  const triggerBellRing = (): void => {
    if (isBellRinging.value) return
    isBellRinging.value = true
    setTimeout(() => { isBellRinging.value = false }, 1000)
  }

  const fetchUnreadCount = async (): Promise<void> => {
    if (isFetching) return
    isFetching = true

    try {
      const [[countErr, resCount], [listErr, resList]] = await Promise.all([
        to(notificationApi.getUnreadCount()),
        to(notificationApi.list())
      ])
      if (countErr || listErr) return

      const newCount = (resCount as { count?: number }).count ?? 0
      const oldCount = unreadApprovalCount.value

      noticeList.value = (resList?.list || []).slice(0, 10)

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
    } finally {
      isFetching = false
    }
  }

  const handleNoticeClick = async (notice: NotificationData): Promise<void> => {
    if (!notice?.id) return
    const [err] = await to(notificationApi.markAsRead(notice.id))
    if (err) return
    await fetchUnreadCount()
    const targetPath = notice.type === 'quotation_submitted'
      ? `/approval/${notice.relatedId}?mode=edit`
      : notice.type === 'memo_reminder'
        ? `/memo-management?highlight=${notice.relatedId}`
        : '/quotation'
    router.push(targetPath)
  }

  const markAllAsRead = async (e?: Event): Promise<void> => {
    if (e) e.stopPropagation()
    const [err] = await to(notificationApi.markAllAsRead())
    if (err) {
      ElMessage.error('操作失败')
      return
    }
    await fetchUnreadCount()
    ElMessage.success('已全部标记为已读')
  }

  const goNoticePage = (): void => {
    if (isAdmin.value) router.push('/approval')
    else router.push('/quotation')
  }

  const deleteNotification = async (notice: NotificationData, e?: Event): Promise<void> => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (!notice?.id) return
    deletingIds.value.add(notice.id)
    triggerRef(deletingIds)
    const [err] = await to(notificationApi.remove(notice.id))
    deletingIds.value.delete(notice.id)
    triggerRef(deletingIds)
    if (err) return
    noticeList.value = noticeList.value.filter(item => item.id !== notice.id)
    await fetchUnreadCount()
  }

  return {
    unreadApprovalCount,
    noticeList,
    deletingIds,
    isBellRinging,
    fetchUnreadCount,
    handleNoticeClick,
    markAllAsRead,
    deleteNotification,
    goNoticePage
  }
}
