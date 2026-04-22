/**
 * @module composables/useInstantListActions
 * @description 列表即时操作组合式函数
 * 
 * 提供列表数据的乐观更新能力：
 * - 操作前立即更新 UI（乐观更新）
 * - 异步请求在后台执行
 * - 请求失败时自动回滚到原始状态
 * - 支持操作锁防止重复点击
 * 
 * 适用场景：列表中的删除、审批通过/驳回等即时操作
 * 
 * @example
 * const { isActionLoading, withActionLock, removeById, replaceById } = useInstantListActions(listRef)
 * 
 * // 删除操作（带乐观更新）
 * const handleDelete = async (row) => {
 *   const snapshot = [...listRef.value]
 *   removeById(row.id)  // 先从列表移除
 *   const [err] = await to(withActionLock(row.id, async () => api.delete(row.id)))
 *   if (err) listRef.value = snapshot  // 失败回滚
 * }
 */

import { ref } from 'vue'

/**
 * 列表即时操作 composable
 * 
 * @param {import('vue').Ref<Array>} listRef - 列表数据的响应式引用（由外部传入）
 * @returns {Object} 操作方法集合
 * @returns {import('vue').Ref<Object>} returns.actionLoadingMap - 各 ID 的加载状态映射
 * @returns {Function} returns.isActionLoading - 检查指定 ID 是否正在加载
 * @returns {Function} returns.withActionLock - 带锁的异步操作包装器
 * @returns {Function} returns.replaceById - 按 ID 替换列表中的某条记录
 * @returns {Function} returns.removeById - 按 ID 从列表中移除某条记录
 */
export const useInstantListActions = (listRef) => {
  /** 记录每个 ID 的操作加载状态，用于显示按钮 loading 效果 */
  const actionLoadingMap = ref({})

  /**
   * 检查指定 ID 的操作是否正在进行中
   * 用于绑定按钮的 :loading 属性，防止用户重复点击
   * 
   * @param {number|string} id - 记录 ID
   * @returns {boolean} 是否正在加载
   */
  const isActionLoading = (id) => Boolean(actionLoadingMap.value[id])

  /**
   * 带操作锁的异步任务执行器
   * 
   * 保证同一 ID 的操作同时只能执行一个，
   * 自动管理加载状态，使用 try/finally 确保状态清理。
   * 
   * @param {number|string} id - 记录 ID（作为锁的标识）
   * @param {Function} task - 要执行的异步任务函数
   * @returns {Promise<*>} 任务返回值，若正在加载或无 ID 则返回 false
   */
  const withActionLock = async (id, task) => {
    if (!id || isActionLoading(id)) return false
    
    actionLoadingMap.value = { ...actionLoadingMap.value, [id]: true }
    
    try {
      return await task()
    } finally {
      const next = { ...actionLoadingMap.value }
      delete next[id]
      actionLoadingMap.value = next
    }
  }

  /**
   * 按 ID 替换列表中的某条记录
   * 
   * 用于更新操作成功后刷新单条数据的状态
   * 
   * @param {number|string} id - 目标记录 ID
   * @param {Object|Function} updater - 新数据对象或更新函数（接收旧数据返回新数据）
   */
  const replaceById = (id, updater) => {
    listRef.value = (listRef.value || []).map((item) => {
      if (item.id !== id) return item
      return typeof updater === 'function' ? updater(item) : { ...item, ...(updater || {}) }
    })
  }

  /**
   * 按 ID 从列表中移除某条记录
   * 
   * 用于删除操作的乐观更新，先从 UI 移除再执行删除请求
   * 
   * @param {number|string} id - 要移除的记录 ID
   */
  const removeById = (id) => {
    listRef.value = (listRef.value || []).filter(item => item.id !== id)
  }

  return {
    actionLoadingMap,
    isActionLoading,
    withActionLock,
    replaceById,
    removeById
  }
}
