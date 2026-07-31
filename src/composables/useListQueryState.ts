

import { ref, type Ref } from 'vue'

interface ListQueryDefaults {
  page?: number
  pageSize?: number
  keyword?: string
  /** 是否提供 total 字段（默认 false） */
  withTotal?: boolean
  /** 分页变化时的加载回调 */
  onLoad?: (page: number) => void
}

interface ListQueryStateReturn {
  page: Ref<number>
  pageSize: Ref<number>
  keyword: Ref<string>
  total: Ref<number>
  handleCurrentChange: (val: number) => void
  handleSizeChange: (val: number) => void
  resetToFirstPage: () => void
}

/**
 * 列表查询状态：page / pageSize / keyword / total + 分页变化回调
 *
 * 统一替代原 usePagination 与 useListQueryState。
 * - 仅需状态：const { page, pageSize, keyword } = useListQueryState()
 * - 需分页回调：const { page, pageSize, total, handleCurrentChange } = useListQueryState({ withTotal: true, onLoad: loadList })
 */
export const useListQueryState = (defaults: ListQueryDefaults = {}): ListQueryStateReturn => {
  const {
    page: defaultPage = 1,
    pageSize: defaultPageSize = 10,
    keyword: defaultKeyword = '',
    withTotal = false,
    onLoad
  } = defaults

  const page = ref(Number(defaultPage))
  const pageSize = ref(Number(defaultPageSize))
  const keyword = ref(String(defaultKeyword))
  const total = ref(0)

  const handleCurrentChange = (val: number): void => {
    page.value = val
    if (onLoad) onLoad(page.value)
  }

  const handleSizeChange = (val: number): void => {
    pageSize.value = val
    page.value = 1
    if (onLoad) onLoad(page.value)
  }

  const resetToFirstPage = (): void => {
    page.value = 1
  }

  // withTotal=false 时 total 仍返回（调用方不使用即可），保持 API 统一
  void withTotal

  return {
    page,
    pageSize,
    keyword,
    total,
    handleCurrentChange,
    handleSizeChange,
    resetToFirstPage
  }
}
