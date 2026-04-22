import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

const submitApproval = (id) => request.post(`/api/quotations/${id}/submit`)
const approve = (id) => request.post(`/api/quotations/${id}/approve`)
const reject = (id, reason) =>request.post(`/api/quotations/${id}/reject`, { reason })
const list = (params) => request.get('/api/approvals', { params })
const get = (id) => request.get(`/api/approvals/${id}`)
const listHistory = (params) => request.get('/api/approvals/history', { params })

const approvalApi = {
  submitApproval: unwrap(submitApproval),
  approve: unwrap(approve),
  reject: unwrap(reject),
  list: unwrap(list),
  get: unwrap(get),
  listHistory: unwrap(listHistory)
}

export { approvalApi }
export default approvalApi
