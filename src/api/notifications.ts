import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { RequestConfig } from '@/types'

const quietPollingConfig: RequestConfig = {
  silent: true,
  authRedirect: false,
  skipCancel: true
}

const getUnreadCount = () =>
  request.get('/api/notifications/unread-count', quietPollingConfig)

const list = () => request.get('/api/notifications', quietPollingConfig)

const markAsRead = (id: number | string) => request.put(`/api/notifications/${id}/read`)

const markAllAsRead = () => request.post('/api/notifications/read-all')

const remove = (id: number | string) => request.delete(`/api/notifications/${id}`)

const notificationApi = {
  getUnreadCount: unwrap(getUnreadCount),
  list: unwrap(list),
  markAsRead: unwrap(markAsRead),
  markAllAsRead: unwrap(markAllAsRead),
  remove: unwrap(remove)
}

export { notificationApi }
export default notificationApi
