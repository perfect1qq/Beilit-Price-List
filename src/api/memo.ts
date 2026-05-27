import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, MemoCreatePayload, MemoUpdatePayload, MemoData, MemoListResult, MemoHistoryListResult } from '@/types'

interface MemoListParams extends PaginationParams {
  filter?: string
  view?: string
  scope?: string
  createdOn?: string
  tz?: string
}

const list = (params?: MemoListParams) =>
  request.get<MemoListResult>('/api/memos', { params })

const listHistory = (params?: MemoListParams, opts?: Record<string, unknown>) =>
  request.get<MemoListResult>('/api/memos/history', { params, ...(opts || {}) })

const create = (data: MemoCreatePayload) =>
  request.post<{ memo: MemoData }>('/api/memos', data)

const update = (id: number | string, data: MemoUpdatePayload) =>
  request.put<{ memo: MemoData }>(`/api/memos/${id}`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/memos/${id}`)

const history = (id: number | string) =>
  request.get<{ history: MemoHistoryListResult }>(`/api/memos/${id}/history`)

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
