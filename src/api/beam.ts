import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, BeamQuotationData } from '@/types'

interface BeamListResult {
  list: BeamQuotationData[]
  total: number
  page: number
  pageSize: number
  [key: string]: unknown
}

const list = (params?: PaginationParams) =>
  request.get<BeamListResult>('/api/beam-quotations', { params })

const create = (data: Partial<BeamQuotationData>) =>
  request.post<{ record: BeamQuotationData }>('/api/beam-quotations', data)

const update = (id: number | string, data: Partial<BeamQuotationData>) =>
  request.put<{ record: BeamQuotationData }>(`/api/beam-quotations/${id}`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/beam-quotations/${id}`)

const checkName = (name: string) =>
  request.get<{ exists: boolean }>('/api/beam-quotations/check-name', { params: { name } })

const beamApi = {
  list: unwrap(list),
  checkName: unwrap(checkName),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove)
}

export { beamApi }
export default beamApi