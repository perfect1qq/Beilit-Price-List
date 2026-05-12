import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, MessageData } from '@/types'

const list = (params?: PaginationParams, config?: Record<string, unknown>) => request.get('/api/messages/list', { params, ...(config || {}) })

const create = (data: MessageData) => request.post('/api/messages/submit', data)

const update = (id: number | string, data: MessageData) => request.put(`/api/messages/${id}/remark`, data)

const remove = (id: number | string) => request.delete(`/api/messages/${id}`)

const assign = (id: number | string, userId: number) =>
  request.put(`/api/messages/assign/${id}`, { assignedTo: userId })

const hideFromAssignee = (id: number | string) =>
  request.put(`/api/messages/${id}/hide-from-assignee`)

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
