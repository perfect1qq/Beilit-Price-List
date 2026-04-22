/**
 * @module composables/usePagination
 * @description 分页状态管理组合式函数
 * 
 * 提供通用的分页状态（page、pageSize、total）和分页事件处理。
 * 适用于所有需要分页功能的列表页面。
 * 
 * @example
 * const { page, pageSize, total, handleCurrentChange, handleSizeChange, resetToFirstPage } = usePagination({
 *   defaultPage: 1,
 *   defaultPageSize: 10,
 *   onLoad: (page) => loadList(page)
 * })
 */

import { ref } from 'vue'

/**
 * 分页状态管理 composable
 * 
 * @param {Object} [options={}] - 配置选项
 * @param {number} [options.defaultPage=1] - 初始页码
 * @param {number} [options.defaultPageSize=10] - 初始每页条数
 * @param {Function} [options.onLoad] - 页码变化时的回调函数，接收新页码作为参数
 * @returns {Object} 分页状态和方法
 * @returns {import('vue').Ref<number>} returns.page - 当前页码
 * @returns {import('vue').Ref<number>} returns.pageSize - 每页条数
 * @returns {import('vue').Ref<number>} returns.total - 数据总数（需外部赋值）
 * @returns {Function} returns.handleCurrentChange - 页码切换处理函数（el-pagination 使用）
 * @returns {Function} returns.handleSizeChange - 每页条数变化处理函数（el-pagination 使用）
 * @returns {Function} returns.resetToFirstPage - 重置到第一页
 */
export const usePagination = (options = {}) => {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    onLoad
  } = options

  /** 当前页码（从 1 开始） */
  const page = ref(defaultPage)

  /** 每页显示条数 */
  const pageSize = ref(defaultPageSize)

  /** 数据总数（由外部查询结果赋值） */
  const total = ref(0)

  /**
   * 处理页码切换事件
   * 由 el-pagination 的 @current-change 触发
   * @param {number} val - 新的页码
   */
  const handleCurrentChange = (val) => {
    page.value = val
    if (onLoad) onLoad(page.value)
  }

  /**
   * 处理每页条数变化事件
   * 切换条数时自动回到第一页
   * 由 el-pagination 的 @size-change 触发
   * @param {number} val - 新的每页条数
   */
  const handleSizeChange = (val) => {
    pageSize.value = val
    page.value = 1
    if (onLoad) onLoad(page.value)
  }

  /**
   * 重置分页状态到第一页
   * 通常在搜索条件变化时调用
   */
  const resetToFirstPage = () => {
    page.value = 1
  }

  return {
    page,
    pageSize,
    total,
    handleCurrentChange,
    handleSizeChange,
    resetToFirstPage
  }
}
