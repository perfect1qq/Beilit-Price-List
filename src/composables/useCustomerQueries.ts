/**
 * 客户模块 vue-query 封装
 *
 * queryKey 设计（树形结构，便于按前缀批量失效）：
 *   ['customers']                       → 所有客户相关查询的根
 *   ['customers', 'list', filters]      → 客户列表
 *   ['customers', 'stats']              → 客户统计
 *   ['customer', id]                    → 单个客户详情
 *
 * 任何客户数据变更后调用 invalidateQueries(['customers']) 即可让
 * 所有订阅了客户列表/统计的组件自动重新请求，实现跨页面数据联动。
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import customerApi from '@/api/customer'
import { formatDate, addDays } from '@/utils/date'
import type {
  CustomerCreatePayload,
  CustomerUpdatePayload,
  CustomerListItem,
  CustomerOrderCreatePayload,
  CustomerOrderUpdatePayload,
} from '@/types'

// ---- 列表查询参数 ----
export interface CustomerListFilters {
  keyword: string
  cooperationStatus: string
  customerType: string
  paymentStatus: string
  orderStatus: string
  installationStatus: string
  page: number
  pageSize: number
}

// 后端返回的列表项（含 deliveryStartDate，前端再派生 deliveryDate）
interface ApiCustomerListItem extends Omit<CustomerListItem, 'deliveryStartDate' | 'workshopDeliveryStartDate'> {
  deliveryStartDate?: string | null
  workshopDeliveryStartDate?: string | null
  createdAt: string
}

const decorateListItem = (c: ApiCustomerListItem): CustomerListItem => ({
  ...c,
  deliveryStartDate: c.deliveryStartDate ?? null,
  workshopDeliveryStartDate: c.workshopDeliveryStartDate ?? null,
  deliveryDate:
    c.deliveryDays && c.deliveryDays > 0
      ? formatDate(addDays(c.deliveryDays, c.deliveryStartDate || c.createdAt))
      : '',
  workshopDeliveryDate:
    c.workshopDeliveryDays && c.workshopDeliveryDays > 0
      ? formatDate(addDays(c.workshopDeliveryDays, c.workshopDeliveryStartDate || c.createdAt))
      : '',
})

/**
 * 客户列表查询
 * - keepPreviousData: 翻页时保留旧数据，避免闪烁
 * - filters 支持传 ref / reactive / getter，变化时自动重新请求
 */
export const useCustomerListQuery = (filters: MaybeRefOrGetter<CustomerListFilters>) => {
  return useQuery({
    // queryKey 包含 filters 的响应式源，vue-query 会自动追踪变化
    queryKey: ['customers', 'list', filters],
    queryFn: async () => {
      const f = toValue(filters)
      const params: Record<string, unknown> = {
        keyword: f.keyword || undefined,
        page: f.page,
        pageSize: f.pageSize,
      }
      if (f.cooperationStatus?.trim())
        params.cooperationStatus = f.cooperationStatus.trim()
      if (f.customerType?.trim())
        params.customerType = f.customerType.trim()
      if (f.paymentStatus?.trim())
        params.paymentStatus = f.paymentStatus.trim()
      if (f.orderStatus?.trim())
        params.orderStatus = f.orderStatus.trim()
      if (f.installationStatus?.trim())
        params.installationStatus = f.installationStatus.trim()

      const res = await customerApi.list(params)
      return {
        list: (res?.list || []).map(decorateListItem),
        total: Number(res?.total ?? 0),
      }
    },
    placeholderData: keepPreviousData,
  })
}

/**
 * 客户详情查询
 * - enabled: id 为空时不请求
 */
export const useCustomerDetailQuery = (
  id: MaybeRefOrGetter<number | null>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) => {
  const enabled = computed(() => {
    if (options?.enabled) return Boolean(toValue(options.enabled))
    const v = toValue(id)
    return v != null && v > 0
  })
  return useQuery({
    queryKey: ['customer', id],
    enabled,
    queryFn: async () => {
      const res = await customerApi.getDetail(toValue(id)!)
      return res?.customer || null
    },
  })
}

/**
 * 客户统计查询
 */
export const useCustomerStatsQuery = () => {
  return useQuery({
    queryKey: ['customers', 'stats'],
    queryFn: () => customerApi.getStats(),
  })
}

// ============ Mutations ============

/**
 * 更新客户
 * 成功后失效该客户详情 + 整个客户列表/统计
 */
export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerUpdatePayload }) =>
      customerApi.update(id, data),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', id] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 删除客户
 * 成功后失效整个客户列表/统计
 */
export const useDeleteCustomerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customerApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 新增客户
 */
export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomerCreatePayload) => customerApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 添加跟进记录
 * 成功后失效对应客户详情 + 列表（跟进数会变）
 */
export const useAddFollowUpMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: number
      data: { content: string; nextTime?: string }
    }) => customerApi.addFollowUp(customerId, data),
    onSuccess: (_data, { customerId }) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 新增订单/财务账单
 */
export const useAddOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: number
      data: CustomerOrderCreatePayload
    }) => customerApi.addOrder(customerId, data),
    onSuccess: (_data, { customerId }) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 更新订单/回款记录
 */
export const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      orderId: number
      data: CustomerOrderUpdatePayload
      customerId: number
    }) => customerApi.updateOrder(vars.orderId, vars.data),
    onSuccess: (_data, { customerId }) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
