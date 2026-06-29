

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
