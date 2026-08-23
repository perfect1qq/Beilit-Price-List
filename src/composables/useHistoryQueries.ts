/**
 * 报价单 / 合同 / 订单 模块的 vue-query 封装
 *
 * queryKey 设计（树形，便于按前缀批量失效）：
 *   ['quotations']              → 所有报价单相关查询
 *   ['quotations', 'list', { keyword, page, pageSize }]  → 报价单列表
 *   ['quotations', 'detail', id]           → 单条报价单详情
 *
 *   ['contracts']               → 合同根
 *   ['contracts', 'list', { keyword, page, pageSize }]
 *
 *   ['orders']                  → 订单根
 *   ['orders', 'list', { keyword, page, pageSize }]
 *
 * 跨模块联动：任何 mutation 成功后，除了失效自身前缀，还会失效
 * ['customers']，让客户卡片的 hasQuotation / hasContract /
 * hasPlacementOrder 等字段自动更新。
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import quotationApi from '@/api/quotation'
import contractApi from '@/api/contract'
import orderApi from '@/api/order'
import type {
  QuotationData,
  QuotationCreatePayload,
  QuotationListResult,
  ContractData,
  ContractListResult,
} from '@/types'
import type { OrderData } from '@/api/order'

// ============ 通用列表查询参数 ============
export interface ListFilters {
  keyword: string
  page: number
  pageSize: number
}

const resolveListParams = (f: ListFilters) => ({
  keyword: f.keyword?.trim() || undefined,
  page: f.page,
  pageSize: f.pageSize,
})

// ============ 报价单 ============

/**
 * 报价单历史列表查询
 * 报价单历史页需要一次拉取所有数据做年份/公司分组，
 * 这里仍用分页接口，由调用方决定是否循环拉取。
 * 为兼容现有 useQuotationHistory 的 fetchAllRecords 行为，
 * 此查询直接返回单页结果，循环逻辑保留在调用处。
 */
export const useQuotationListQuery = (filters: MaybeRefOrGetter<ListFilters>) => {
  return useQuery({
    queryKey: ['quotations', 'list', filters],
    queryFn: async () => {
      const f = toValue(filters)
      const res = await quotationApi.list(resolveListParams(f))
      return {
        list: (res?.list || []) as QuotationData[],
        total: Number(res?.total ?? 0),
        page: Number(res?.page ?? f.page),
        pageSize: Number(res?.pageSize ?? f.pageSize),
      }
    },
    placeholderData: keepPreviousData,
  })
}

/**
 * 报价单详情查询
 */
export const useQuotationDetailQuery = (id: MaybeRefOrGetter<number | string | null>) => {
  return useQuery({
    queryKey: ['quotations', 'detail', id],
    enabled: () => toValue(id) != null,
    queryFn: async () => {
      const res = await quotationApi.get(toValue(id)!)
      return res
    },
  })
}

/**
 * 新增报价单
 */
export const useCreateQuotationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: QuotationCreatePayload) => quotationApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotations'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 更新报价单
 */
export const useUpdateQuotationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: QuotationCreatePayload }) =>
      quotationApi.update(id, data),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['quotations', 'detail', id] })
      void queryClient.invalidateQueries({ queryKey: ['quotations'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * 删除报价单
 */
export const useDeleteQuotationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => quotationApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotations'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ============ 合同 ============

export const useContractListQuery = (filters: MaybeRefOrGetter<ListFilters>) => {
  return useQuery({
    queryKey: ['contracts', 'list', filters],
    queryFn: async () => {
      const f = toValue(filters)
      const res = await contractApi.list(resolveListParams(f))
      return {
        list: (res?.list || []) as ContractData[],
        total: Number(res?.total ?? 0),
        page: Number(res?.page ?? f.page),
        pageSize: Number(res?.pageSize ?? f.pageSize),
      }
    },
    placeholderData: keepPreviousData,
  })
}

export const useDeleteContractMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contractApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ============ 订单 ============

export const useOrderListQuery = (filters: MaybeRefOrGetter<ListFilters>) => {
  return useQuery({
    queryKey: ['orders', 'list', filters],
    queryFn: async () => {
      const f = toValue(filters)
      const res = await orderApi.list(resolveListParams(f))
      return {
        list: (res?.list || []) as OrderData[],
        total: Number(res?.total ?? 0),
        page: Number(res?.page ?? f.page),
        pageSize: Number(res?.pageSize ?? f.pageSize),
      }
    },
    placeholderData: keepPreviousData,
  })
}

export const useOrderDetailQuery = (id: MaybeRefOrGetter<number | string | null>) => {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    enabled: () => toValue(id) != null,
    queryFn: async () => {
      const res = await orderApi.getDetail(toValue(id)!)
      return res.order
    },
  })
}

export const useDeleteOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => orderApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ============ 导出后端原始类型供视图层用 ============
export type { QuotationData, ContractData, OrderData, QuotationListResult, ContractListResult }
