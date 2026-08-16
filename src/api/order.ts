import request from '@/utils/request'
import { unwrap } from '@/utils/unwrap'

export interface OrderItem {
  id?: number | string
  name: string
  spec: string
  qty: string
  material?: string
  color?: string
  other?: string
}

export interface AccessoryItem {
  id?: number | string
  name: string
  qty: string
}

export interface OrderData {
  id: number
  name: string
  customerName: string
  phone?: string | null
  fax?: string | null
  contactPerson?: string | null
  deliveryAddress?: string | null
  orderDate?: string | null
  deliveryDays?: string | null
  items: string
  accessories?: string | null
  attachments?: string | null
  rawText?: string | null
  remark?: string | null
  ownerId: number
  ownerName: string
  createdAt: string
  updatedAt: string
}

export interface OrderListResult {
  list: OrderData[]
  total: number
  page: number
  pageSize: number
}

interface OrderListParams {
  keyword?: string
  page?: number
  pageSize?: number
}

const list = (params?: OrderListParams) =>
  request.get<OrderListResult>('/api/orders', { params })

const getDetail = (id: number | string) =>
  request.get<{ order: OrderData }>(`/api/orders/${id}`)

const create = (data: Partial<OrderData>) =>
  request.post<{ order: OrderData }>('/api/orders', data)

const update = (id: number | string, data: Partial<OrderData>) =>
  request.put<{ order: OrderData }>(`/api/orders/${id}`, data)

const remove = (id: number | string) =>
  request.delete<null>(`/api/orders/${id}`)

const orderApi = {
  list: unwrap(list),
  getDetail: unwrap(getDetail),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove)
}

export default orderApi
