/**
 * @module composables/useListQueryState
 * @description 列表查询状态组合式函数
 * 
 * 抽离列表页面通用的查询状态管理：
 * - page: 当前页码
 * - pageSize: 每页条数
 * - keyword: 搜索关键词
 * - resetToFirstPage: 重置到第一页（搜索时使用）
 * 
 * 与 usePagination 的区别：
 * - usePagination 侧重分页组件的事件绑定
 * - useListQueryState 侧重查询参数的状态管理
 * 
 * @example
 * const { page, pageSize, keyword, resetToFirstPage } = useListQueryState({
 *   page: 1,
 *   pageSize: 10,
 *   keyword: ''
 * })
 */

import { ref, type Ref } from 'vue'

interface ListQueryDefaults {
  page?: number
  pageSize?: number
  keyword?: string
}

interface ListQueryStateReturn {
  page: Ref<number>
  pageSize: Ref<number>
  keyword: Ref<string>
  resetToFirstPage: () => void
}

export const useListQueryState = (defaults: ListQueryDefaults = {}): ListQueryStateReturn => {
  const page = ref(Number(defaults.page || 1))
  const pageSize = ref(Number(defaults.pageSize || 10))
  const keyword = ref(String(defaults.keyword || ''))

  const resetToFirstPage = (): void => {
    page.value = 1
  }

  return {
    page,
    pageSize,
    keyword,
    resetToFirstPage
  }
}
