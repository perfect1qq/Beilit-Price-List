/**
 * @module api/memo
 * @description 备忘录相关 API 接口封装
 * 
 * 提供备忘录的 CRUD 操作：
 * - 列表查询（支持分页）
 * - 创建、更新、删除
 * - 历史记录查看
 */

import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

/** 获取备忘录列表 */
const list = (params) => request.get('/api/memos', { params })

/** 获取备忘录历史记录列表 */
const listHistory = (params, opts) => request.get('/api/memos/history', { params, ...(opts || {}) })

/** 创建新备忘录 */
const create = (data) => request.post('/api/memos', data)

/** 更新备忘录 */
const update = (id, data) => request.put(`/api/memos/${id}`, data)

/** 删除备忘录 */
const remove = (id) => request.delete(`/api/memos/${id}`)

/** 获取单条备忘录的修改历史 */
const history = (id) => request.get(`/api/memos/${id}/history`)

/** 备忘录 API 对象（对外导出） */
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
