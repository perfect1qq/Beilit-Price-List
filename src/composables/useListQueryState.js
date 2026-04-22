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

import { ref } from 'vue'

/**
 * 列表查询状态 composable
 * 
 * @param {Object} [defaults={}] - 默认值配置
 * @param {number} [defaults.page=1] - 默认页码
 * @param {number} [defaults.pageSize=10] - 默认每页条数
 * @param {string} [defaults.keyword=''] - 默认搜索关键词
 * @returns {Object} 查询状态和方法
 * @returns {import('vue').Ref<number>} returns.page - 当前页码
 * @returns {import('vue').Ref<number>} returns.pageSize - 每页条数
 * @returns {import('vue').Ref<string>} returns.keyword - 搜索关键词
 * @returns {Function} returns.resetToFirstPage - 重置到第一页
 */
export const useListQueryState = (defaults = {}) => {
  /** 当前页码 */
  const page = ref(Number(defaults.page || 1))

  /** 每页显示条数 */
  const pageSize = ref(Number(defaults.pageSize || 10))

  /** 搜索关键词 */
  const keyword = ref(String(defaults.keyword || ''))

  /**
   * 重置到第一页
   * 通常在搜索条件变化时调用，确保从第一页开始展示新结果
   */
  const resetToFirstPage = () => {
    page.value = 1
  }

  return {
    page,
    pageSize,
    keyword,
    resetToFirstPage
  }
}
