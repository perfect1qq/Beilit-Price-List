import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, MemoData } from '@/types'

const list = (params?: PaginationParams) => request.get('/api/memos', { params })

const listHistory = (params?: PaginationParams, opts?: Record<string, unknown>) => request.get('/api/memos/history', { params, ...(opts || {}) })

const create = (data: MemoData) => request.post('/api/memos', data)

const update = (id: number | string, data: MemoData) => request.put(`/api/memos/${id}`, data)

const remove = (id: number | string) => request.delete(`/api/memos/${id}`)

const history = (id: number | string) => request.get(`/api/memos/${id}/history`)

const memoApi = {
  list: unwrap(list),
  listHistory: unwrap(listHistory),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove),
  history: unwrap(history)
}

export { memoApi }
export default memoApi