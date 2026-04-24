/**
 * @module api/quotation
 * @description 报价单相关 API 接口封装
 * 
 * 提供报价单的完整 CRUD 操作和业务接口：
 * - 列表查询、创建、更新、删除、详情
 * - 审批流程（通过/驳回）
 * - AI 智能解析文本
 * - 统计数据获取
 * 
 * 所有接口通过 unwrap() 包装，自动提取 response.data
 */

import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

/** 获取报价单列表 */
const list = () => request.get('/api/quotations')

/** 创建新报价单 */
const create = (data) => request.post('/api/quotations', data)

/** 更新报价单 */
const update = (id, data) => request.put(`/api/quotations/${id}`, data)

/** 删除报价单 */
const remove = (id) => request.delete(`/api/quotations/${id}`)

/** 获取报价单详情 */
const get = (id) => request.get(`/api/quotations/${id}`)

/** 获取统计数据 */
const getStatistics = () => request.get('/api/quotations')

/** AI 智能解析粘贴文本为结构化数据 */
const parseText = (text) => request.post('/api/tools/quotation-parse', { text })

/** 审批通过 */
const approve = (id, comment) => request.post(`/api/quotations/${id}/approve`, { comment })

/** 审批驳回 */
const reject = (id, comment) => request.post(`/api/quotations/${id}/reject`, { comment })

/** 解析统计文本 */
const parseStatistics = (rawText) =>
  request.post('/api/tools/calculate', { text: rawText, type: 'statistics' })

/** 报价单 API 对象（对外导出） */
const quotationApi = {
  list: unwrap(list),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove),
  get: unwrap(get),
  getStatistics: unwrap(getStatistics),
  parseText: unwrap(parseText),
  approve: unwrap(approve),
  reject: unwrap(reject),
  parse: unwrap(parseStatistics)
}

/** 统计专用 API（简化版） */
const quotationStatisticsApi = {
  getStatistics: unwrap(getStatistics),
  parse: unwrap(parseStatistics)
}

export { quotationApi, quotationStatisticsApi }
export default quotationApi
