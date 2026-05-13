import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, QuotationData } from '@/types'

const list = (params?: PaginationParams) => request.get('/api/quotations', { params })

const create = (data: QuotationData) => request.post('/api/quotations', data)

const update = (id: number | string, data: QuotationData) =>
  request.put(`/api/quotations/${id}`, data)

const remove = (id: number | string) => request.delete(`/api/quotations/${id}`)

const get = (id: number | string) => request.get(`/api/quotations/${id}`)

const getStatistics = () =>
  request.get('/api/quotations/stats')

const parseText = (text: string) =>
  request.post('/api/tools/quotation-parse', { text })

const approve = (id: number | string, comment?: string) =>
  request.post(`/api/quotations/${id}/approve`, { comment })

const reject = (id: number | string, comment?: string) =>
  request.post(`/api/quotations/${id}/reject`, { comment })

const copy = (id: number | string) =>
  request.post(`/api/quotations/${id}/copy`)

const checkCompanyName = (companyName: string, excludeId?: number | string) =>
  request.get('/api/quotations/check-company', { params: { companyName, excludeId } })

const checkName = (name: string, excludeId?: number | string) =>
  request.get('/api/quotations/check-name', { params: { name, excludeId } })

const suggestName = (name: string, companyName?: string, excludeId?: number | string) =>
  request.get('/api/quotations/suggest-name', { params: { name, companyName, excludeId } })

const parseStatistics = (rawText: string) =>
  request.post('/api/tools/calculate', {
    text: rawText,
    type: 'statistics',
  })

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
  copy: unwrap(copy),
  parse: unwrap(parseStatistics),
  checkCompanyName: unwrap(checkCompanyName),
  checkName: unwrap(checkName),
  suggestName: unwrap(suggestName),
}

const quotationStatisticsApi = {
  getStatistics: unwrap(getStatistics),
  parse: unwrap(parseStatistics),
}

export { quotationApi, quotationStatisticsApi }
export default quotationApi