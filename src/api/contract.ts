import request from '@/utils/request'
import type { PaginatedResult } from '@/types'

export interface ContractData {
  id: number
  companyName: string
  title: string
  content: string
  attachments: string
  ownerId: number
  ownerName: string
  createdAt: string
  updatedAt: string
}

export interface ContractHistoryData {
  id: number
  contractId: number
  companyName: string
  action: string
  title: string
  content: string
  attachments: string
  operatorId: number
  operatorName: string
  createdAt: string
}

const contractApi = {
  list(params: Record<string, unknown> = {}) {
    return request.get<PaginatedResult<ContractData>>('/api/contracts', { params }).then(res => res.data)
  },

  get(id: number) {
    return request.get<{ contract: ContractData }>(`/api/contracts/${id}`).then(res => res.data)
  },

  create(data: Partial<ContractData>) {
    return request.post<{ contract: ContractData }>('/api/contracts', data).then(res => res.data)
  },

  update(id: number, data: Partial<ContractData>) {
    return request.put<{ contract: ContractData }>(`/api/contracts/${id}`, data).then(res => res.data)
  },

  delete(id: number) {
    return request.delete(`/api/contracts/${id}`).then(res => res.data)
  },

  batchDelete(ids: number[]) {
    return request.post('/api/contracts/batch-delete', { ids }).then(res => res.data)
  },

  getHistory(id: number, params: Record<string, unknown> = {}) {
    return request.get<{ history: PaginatedResult<ContractHistoryData> }>(`/api/contracts/${id}/history`, { params }).then(res => res.data)
  }
}

export default contractApi
