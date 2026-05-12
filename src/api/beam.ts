import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { PaginationParams, BeamQuotationData } from '@/types'

const list = (params?: PaginationParams) => request.get('/api/beam-quotations', { params })
const create = (data: BeamQuotationData) => request.post('/api/beam-quotations', data)
const update = (id: number | string, data: BeamQuotationData) => request.put(`/api/beam-quotations/${id}`, data)
const remove = (id: number | string) => request.delete(`/api/beam-quotations/${id}`)
const checkName = (name: string) => request.get('/api/beam-quotations/check-name', { params: { name } })

const beamApi = {
  list: unwrap(list),
  checkName: unwrap(checkName),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove)
}

export { beamApi }
export default beamApi