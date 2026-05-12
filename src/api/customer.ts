import request from '@/utils/request'
import { unwrap } from '@/utils/unwrap'
import type { PaginationParams, CustomerData, FollowUpData } from '@/types'

const list = (params?: PaginationParams) => request.get('/api/customers', { params })

const getDetail = (id: number | string) => request.get(`/api/customers/${id}`)

const create = (data: CustomerData) => request.post('/api/customers', data)

const update = (id: number | string, data: CustomerData) => request.put(`/api/customers/${id}`, data)

const remove = (id: number | string) => request.delete(`/api/customers/${id}`)

const addFollowUp = (customerId: number | string, data: FollowUpData) =>
  request.post(`/api/customers/${customerId}/follow-ups`, data)

const deleteFollowUp = (id: number | string) =>
  request.delete(`/api/customers/follow-ups/${id}`)

const customerApi = {
  list: unwrap(list),
  getDetail: unwrap(getDetail),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove),
  addFollowUp: unwrap(addFollowUp),
  deleteFollowUp: unwrap(deleteFollowUp)
}

export default customerApi