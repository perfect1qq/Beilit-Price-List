import request from '@/utils/request'

export const approvalApi = {
  async list(params = {}) {
    const res = await request.get('/api/approvals', { params })
    return res.data
  },
  async listHistory(params = {}) {
    const res = await request.get('/api/approvals/history', { params })
    return res.data
  },
  async get(id) {
    const res = await request.get(`/api/approvals/${id}`)
    return res.data
  }
}
