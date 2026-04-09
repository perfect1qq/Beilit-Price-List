import request from '@/utils/request'

export const memoApi = {
  /**
   * 备忘录列表。
   * @param {object} params - page, pageSize, keyword, filter；tz：IANA 时区（建议传浏览器 Intl）；createdOn：仅历史用 YYYY-MM-DD
   */
  async list(params = {}, config = {}) {
    const res = await request.get('/api/memos', { params, ...config })
    return res.data
  },
  /** 历史列表（早于「今日」创建），等价于 list({ ...params, scope: 'history' })。 */
  async listHistory(params = {}, config = {}) {
    const res = await request.get('/api/memos/history', { params, ...config })
    return res.data
  },
  async get(id) {
    const res = await request.get(`/api/memos/${id}`)
    return res.data
  },
  async create(payload) {
    const res = await request.post('/api/memos', payload)
    return res.data
  },
  async update(id, payload) {
    const res = await request.put(`/api/memos/${id}`, payload)
    return res.data
  },
  async remove(id) {
    const res = await request.delete(`/api/memos/${id}`)
    return res.data
  },
  async history(id) {
    const res = await request.get(`/api/memos/${id}/history`)
    return res.data
  }
}
