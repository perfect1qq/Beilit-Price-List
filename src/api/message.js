/**
 * @module api/message
 * @description 留言/消息相关 API 接口封装
 * 
 * 提供留言管理和通知功能：
 * - 留言 CRUD 操作
 * - 留言指派（管理员分配给业务员）
 * - 业务员隐藏留言
 * - 通知未读数/列表/已读标记
 * 
 * 权限说明：
 * - 管理员：可查看全部、指派、删除
 * - 业务员：只能看到被指派的留言
 * - 游客：只读
 */

import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

/** 获取留言列表（支持分页和搜索） */
const list = (params) => request.get('/api/messages/list', { params })

/** 提交新留言（官网访客使用） */
const create = (data) => request.post('/api/messages/submit', data)

/** 更新留言备注 */
const update = (id, data) => request.put(`/api/messages/${id}/remark`, data)

/** 删除留言 */
const remove = (id) => request.delete(`/api/messages/${id}`)

/** 指派留言给业务员 */
const assign = (id, userId) =>
  request.put(`/api/messages/assign/${id}`, { assignedTo: userId })

/** 业务员从「我的指派」中隐藏该留言 */
const hideFromAssignee = (id) =>
  request.put(`/api/messages/${id}/hide-from-assignee`)

/** 获取通知未读数量 */
const getUnreadCount = () => request.get('/api/notifications/unread-count')

/** 获取通知列表 */
const listNotifications = () => request.get('/api/notifications')

/** 标记单条通知为已读 */
const markAsRead = (id) => request.put(`/api/notifications/${id}/read`)

/** 标记所有通知为已读 */
const markAllAsRead = () => request.post('/api/notifications/read-all')

/** 消息 API 对象（对外导出） */
const messageApi = {
  list: unwrap(list),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove),
  assign: unwrap(assign),
  hideFromAssignee: unwrap(hideFromAssignee),
  getUnreadCount: unwrap(getUnreadCount),
  listNotifications: unwrap(listNotifications),
  markAsRead: unwrap(markAsRead),
  markAllAsRead: unwrap(markAllAsRead)
}

export { messageApi }
export default messageApi
