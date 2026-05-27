import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, MessageCreatePayload, MessageRemarkPayload, MessageData, MessageListResult } from '@/types'

const list = (params?: PaginationParams, config?: Record<string, unknown>) =>
  request.get<MessageListResult>('/api/messages/list', { params, ...(config || {}) })

const create = (data: MessageCreatePayload) =>
  request.post<MessageData>('/api/messages/submit', data)

const update = (id: number | string, data: MessageRemarkPayload) =>
  request.put<MessageData>(`/api/messages/${id}/remark`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/messages/${id}`)

const assign = (id: number | string, userId: number) =>
  request.put<MessageData>(`/api/messages/assign/${id}`, { assignedTo: userId })

const hideFromAssignee = (id: number | string) =>
  request.put<null>(`/api/messages/${id}/hide-from-assignee`)

const messageApi = {
  list: unwrap(list),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove),
  assign: unwrap(assign),
  hideFromAssignee: unwrap(hideFromAssignee)
}

export { messageApi }
export default messageApi
