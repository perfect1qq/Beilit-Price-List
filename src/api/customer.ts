import request from '@/utils/request'
import { unwrap } from '@/utils/unwrap'
import type { PaginationParams, CustomerCreatePayload, CustomerUpdatePayload, CustomerData, CustomerListResult, CustomerDetailData, FollowUpCreatePayload, FollowUpData } from '@/types'

interface CustomerListParams extends PaginationParams {
  cooperationStatus?: string
  customerType?: string
  paymentStatus?: string
}

const list = (params?: CustomerListParams) =>
  request.get<CustomerListResult>('/api/customers', { params })

const getDetail = (id: number | string) =>
  request.get<{ customer: CustomerDetailData }>(`/api/customers/${id}`)

const create = (data: CustomerCreatePayload) =>
  request.post<{ customer: CustomerData }>('/api/customers', data)

const update = (id: number | string, data: CustomerUpdatePayload) =>
  request.put<{ customer: CustomerData }>(`/api/customers/${id}`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/customers/${id}`)

const addFollowUp = (customerId: number | string, data: FollowUpCreatePayload) =>
  request.post<{ followUp: FollowUpData }>(`/api/customers/${customerId}/follow-ups`, data)

const deleteFollowUp = (id: number | string) =>
  request.delete<null>(`/api/customers/follow-ups/${id}`)

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
