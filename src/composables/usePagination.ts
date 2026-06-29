

import { ref, type Ref } from 'vue'

interface PaginationOptions {
  defaultPage?: number
  defaultPageSize?: number
  onLoad?: (page: number) => void
}

interface PaginationReturn {
  page: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  handleCurrentChange: (val: number) => void
  handleSizeChange: (val: number) => void
  resetToFirstPage: () => void
}

export const usePagination = (options: PaginationOptions = {}): PaginationReturn => {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    onLoad
  } = options

  const page = ref(defaultPage)
  const pageSize = ref(defaultPageSize)
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

  return {
    page,
    pageSize,
    total,
    handleCurrentChange,
    handleSizeChange,
    resetToFirstPage
  }
}
