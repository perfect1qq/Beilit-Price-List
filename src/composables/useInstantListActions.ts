

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
