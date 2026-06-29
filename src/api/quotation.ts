import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, QuotationCreatePayload, QuotationData, QuotationItem, QuotationListResult, QuotationLogData } from '@/types'

interface QuotationParseResult {
  items: QuotationItem[]
  columns: string[]
  subtotal: number
  warnings?: string[]
}

interface QuotationStatisticsResult {
  parts: { name: string; spec?: string; qty?: number | string; unit?: string; [key: string]: unknown }[]
  errors: string[]
  warnings: string[]
  remarks?: string[]
  [key: string]: unknown
}

const list = (params?: PaginationParams) =>
  request.get<QuotationListResult>('/api/quotations', { params })

const create = (data: QuotationCreatePayload) =>
  request.post<{ quotation: QuotationData }>('/api/quotations', data)

const update = (id: number | string, data: QuotationCreatePayload) =>
  request.put<{ quotation: QuotationData }>(`/api/quotations/${id}`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/quotations/${id}`)

const get = (id: number | string) =>
  request.get<{ quotation: QuotationData; logs: QuotationLogData[] }>(`/api/quotations/${id}`)

const getStatistics = () =>
  request.get<QuotationStatisticsResult>('/api/quotations/stats')

const parseText = (text: string) =>
  request.post<QuotationParseResult>('/api/tools/quotation-parse', { text })

const approve = (id: number | string, comment?: string) =>
  request.post<{ quotation: QuotationData }>(`/api/quotations/${id}/approve`, { comment })

const reject = (id: number | string, comment?: string) =>
  request.post<{ quotation: QuotationData }>(`/api/quotations/${id}/reject`, { comment })

const moveYear = (id: number | string, targetYear: number) =>
  request.put<{ quotation: QuotationData }>(`/api/quotations/${id}/move-year`, { targetYear })

const checkCompanyName = (companyName: string, excludeId?: number | string) =>
  request.get<{ exists: boolean; quotation?: QuotationData }>('/api/quotations/check-company', { params: { companyName, excludeId } })

const checkName = (name: string, excludeId?: number | string) =>
  request.get<{ exists: boolean; quotation?: QuotationData }>('/api/quotations/check-name', { params: { name, excludeId } })

const suggestName = (name: string, companyName?: string, excludeId?: number | string) =>
  request.get<{ suggestedName: string }>('/api/quotations/suggest-name', { params: { name, companyName, excludeId } })

interface ExtraCounts {
  shelfType?: string
  calcMode?: string
  crossBraceCount?: number
  gateBeamClampCount?: number
  connectorCount?: number
  guardrailCount?: number
  guardrailType?: string
  protectorCount?: number
  pickingLayerCount?: number
  embraceColumnCount?: number
}

const parseStatistics = (rawText: string, extra?: ExtraCounts) =>
  request.post<QuotationStatisticsResult>('/api/tools/calculate', { text: rawText, type: 'statistics', ...extra })

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
  moveYear: unwrap(moveYear),
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
