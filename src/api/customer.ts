import request from '@/utils/request'
import { unwrap } from '@/utils/unwrap'
import type { PaginationParams, CustomerCreatePayload, CustomerUpdatePayload, CustomerData, CustomerListResult, CustomerListItem, CustomerDetailData, FollowUpCreatePayload, FollowUpData, CustomerOrderCreatePayload, CustomerOrderUpdatePayload, CustomerOrderData } from '@/types'

// 后端 create/update 返回的 customer 对象额外包含报价单关联字段（基于公司名重算）
type CustomerMutationResult = CustomerData & Pick<CustomerListItem, 'hasQuotation' | 'quotationId' | 'quotationCount'>

interface CustomerListParams extends PaginationParams {
  cooperationStatus?: string
  customerType?: string
  paymentStatus?: string
  orderStatus?: string
  installationStatus?: string
}

interface CustomerStats {
  total: number
  undealt: number
  dealt: number
  pending: number
  settled: number
  ordered: number
  notOrdered: number
  pendingInstall: number
  installed: number
  dealer: number
  terminal: number
}

const list = (params?: CustomerListParams) =>
  request.get<CustomerListResult>('/api/customers', { params })

const getArrearsList = () =>
  request.get<{ list: any[] }>('/api/customers/arrears')

const getStats = () =>
  request.get<CustomerStats>('/api/customers/stats')

const getDetail = (id: number | string) =>
  request.get<{ customer: CustomerDetailData }>(`/api/customers/${id}`)

const create = (data: CustomerCreatePayload) =>
  request.post<{ customer: CustomerMutationResult }>('/api/customers', data)

const update = (id: number | string, data: CustomerUpdatePayload) =>
  request.put<{ customer: CustomerMutationResult }>(`/api/customers/${id}`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/customers/${id}`)

const addFollowUp = (customerId: number | string, data: FollowUpCreatePayload) =>
  request.post<{ followUp: FollowUpData }>(`/api/customers/${customerId}/follow-ups`, data)

const deleteFollowUp = (id: number | string) =>
  request.delete<null>(`/api/customers/follow-ups/${id}`)

const addOrder = (customerId: number | string, data: CustomerOrderCreatePayload) =>
  request.post<{ order: CustomerOrderData }>(`/api/customers/${customerId}/orders`, data)

const updateOrder = (orderId: number | string, data: CustomerOrderUpdatePayload) =>
  request.put<{ order: CustomerOrderData }>(`/api/customers/orders/${orderId}`, data)

const deleteOrder = (orderId: number | string) =>
  request.delete<null>(`/api/customers/orders/${orderId}`)

const addPayment = (orderId: number | string, data: any) =>
  request.post<{ payment: any }>(`/api/customers/orders/${orderId}/payments`, data)

const deletePayment = (id: number | string) =>
  request.delete<null>(`/api/customers/payments/${id}`)

const customerApi = {
  list: unwrap(list),
  getArrearsList: unwrap(getArrearsList),
  getStats: unwrap(getStats),
  getDetail: unwrap(getDetail),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove),
  addFollowUp: unwrap(addFollowUp),
  deleteFollowUp: unwrap(deleteFollowUp),
  addOrder: unwrap(addOrder),
  updateOrder: unwrap(updateOrder),
  deleteOrder: unwrap(deleteOrder),
  addPayment: unwrap(addPayment),
  deletePayment: unwrap(deletePayment)
}

export default customerApi
