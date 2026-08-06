import request from '@/utils/request'
import { unwrap } from '@/utils/unwrap'
import type { ContractData, ContractHistoryListResult, ContractListResult } from '@/types'

const list = (params: Record<string, unknown> = {}) =>
  request.get<ContractListResult>('/api/contracts', { params })

const get = (id: number) =>
  request.get<{ contract: ContractData }>(`/api/contracts/${id}`)

const create = (data: Partial<ContractData>) =>
  request.post<{ contract: ContractData }>('/api/contracts', data)

const update = (id: number, data: Partial<ContractData>) =>
  request.put<{ contract: ContractData }>(`/api/contracts/${id}`, data)

const remove = (id: number) =>
  request.delete(`/api/contracts/${id}`)

const batchDelete = (ids: number[]) =>
  request.post('/api/contracts/batch-delete', { ids })

const getHistory = (id: number, params: Record<string, unknown> = {}) =>
  request.get<{ history: ContractHistoryListResult }>(`/api/contracts/${id}/history`, { params })

const contractApi = {
  list: unwrap(list),
  get: unwrap(get),
  create: unwrap(create),
  update: unwrap(update),
  delete: unwrap(remove),
  batchDelete: unwrap(batchDelete),
  getHistory: unwrap(getHistory),
}

export default contractApi
