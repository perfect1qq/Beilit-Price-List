import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams } from '@/types'

interface ApprovalListParams extends PaginationParams {
  status?: string
}

const submitApproval = (id: number | string) => request.post(`/api/quotations/${id}/submit`)

const recallApproval = (id: number | string) => request.post(`/api/quotations/${id}/recall`)

const approve = (id: number | string) => request.post(`/api/quotations/${id}/approve`)

const reject = (id: number | string, comment: string) => request.post(`/api/quotations/${id}/reject`, { comment })

const list = (params?: ApprovalListParams) => request.get('/api/approvals', { params })

const get = (id: number | string) => request.get(`/api/approvals/${id}`)

const listHistory = (params?: PaginationParams) => request.get('/api/approvals/history', { params })

const approvalApi = {
  submitApproval: unwrap(submitApproval),
  recallApproval: unwrap(recallApproval),
  approve: unwrap(approve),
  reject: unwrap(reject),
  list: unwrap(list),
  get: unwrap(get),
  listHistory: unwrap(listHistory)
}

export { approvalApi }
export default approvalApi