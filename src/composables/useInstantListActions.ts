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

import { ref, type Ref } from 'vue'

interface Identifiable {
  id: number | string
}

export const useInstantListActions = <T extends Identifiable>(listRef: Ref<T[]>) => {
  const actionLoadingMap = ref<Record<string, boolean>>({})

  const isActionLoading = (id: number | string): boolean => Boolean(actionLoadingMap.value[id])

  const withActionLock = async <R>(id: number | string, task: () => Promise<R>): Promise<R | false> => {
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

  const replaceById = (id: number | string, updater: Partial<T> | ((item: T) => T)): void => {
    listRef.value = (listRef.value || []).map((item) => {
      if (item.id !== id) return item
      return typeof updater === 'function' ? updater(item) : { ...item, ...(updater || {}) }
    })
  }

  const removeById = (id: number | string): void => {
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
