import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, NotepadCreatePayload, NotepadUpdatePayload, NotepadData, NotepadListResult, NotepadHistoryListResult } from '@/types'

interface NotepadListParams extends PaginationParams {
  keyword?: string
  folder?: string
}

const list = (params?: NotepadListParams) =>
  request.get<NotepadListResult>('/api/notepads', { params })

const listFolders = () =>
  request.get<{ folders: string[] }>('/api/notepads/folders')

const create = (data: NotepadCreatePayload) =>
  request.post<{ note: NotepadData }>('/api/notepads', data)

const update = (id: number | string, data: NotepadUpdatePayload) =>
  request.put<{ note: NotepadData }>(`/api/notepads/${id}`, data)

const togglePin = (id: number | string) =>
  request.put<{ note: NotepadData }>(`/api/notepads/${id}/pin`)

const remove = (id: number | string) =>
  request.delete<null>(`/api/notepads/${id}`)

const history = (id: number | string, params?: PaginationParams) =>
  request.get<{ history: NotepadHistoryListResult }>(`/api/notepads/${id}/history`, { params })

const batchDelete = (ids: number[]) =>
  request.post<{ success: boolean; deletedCount: number }>('/api/notepads/batch-delete', { ids })

const notepadApi = {
  list: unwrap(list),
  listFolders: unwrap(listFolders),
  create: unwrap(create),
  update: unwrap(update),
  togglePin: unwrap(togglePin),
  remove: unwrap(remove),
  history: unwrap(history),
  batchDelete: unwrap(batchDelete)
}

export { notepadApi }
export default notepadApi
