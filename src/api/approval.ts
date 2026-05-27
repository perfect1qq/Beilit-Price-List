import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, QuotationData, ApprovalListParams, ApprovalListResult, ApprovalDetailData } from '@/types'

const submitApproval = (id: number | string) =>
  request.post<{ quotation: QuotationData }>(`/api/quotations/${id}/submit`)

const recallApproval = (id: number | string) =>
  request.post<{ quotation: QuotationData }>(`/api/quotations/${id}/recall`)

const approve = (id: number | string) =>
  request.post<{ quotation: QuotationData }>(`/api/quotations/${id}/approve`)

const reject = (id: number | string, comment: string) =>
  request.post<{ quotation: QuotationData }>(`/api/quotations/${id}/reject`, { comment })

const list = (params?: ApprovalListParams) =>
  request.get<ApprovalListResult>('/api/approvals', { params })

const get = (id: number | string) =>
  request.get<ApprovalDetailData>(`/api/approvals/${id}`)

const listHistory = (params?: PaginationParams) =>
  request.get<ApprovalListResult>('/api/approvals/history', { params })

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
