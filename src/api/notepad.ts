import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, NotepadData } from '@/types'

const list = (params?: PaginationParams & { keyword?: string; folder?: string }) =>
  request.get('/api/notepads', { params })

const listFolders = () => request.get('/api/notepads/folders')

const getById = (id: number | string) => request.get(`/api/notepads/${id}`)

const create = (data: NotepadData) => request.post('/api/notepads', data)

const update = (id: number | string, data: Partial<NotepadData>) =>
  request.put(`/api/notepads/${id}`, data)

const togglePin = (id: number | string) => request.put(`/api/notepads/${id}/pin`)

const remove = (id: number | string) => request.delete(`/api/notepads/${id}`)

const history = (id: number | string, params?: PaginationParams) =>
  request.get(`/api/notepads/${id}/history`, { params })

const batchDelete = (ids: number[]) =>
  request.post('/api/notepads/batch-delete', { ids })

const notepadApi = {
  list: unwrap(list),
  listFolders: unwrap(listFolders),
  getById: unwrap(getById),
  create: unwrap(create),
  update: unwrap(update),
  togglePin: unwrap(togglePin),
  remove: unwrap(remove),
  history: unwrap(history),
  batchDelete: unwrap(batchDelete)
}

export { notepadApi }
export default notepadApi
