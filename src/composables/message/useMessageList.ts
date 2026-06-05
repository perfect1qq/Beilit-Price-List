import { computed, ref, shallowRef } from 'vue'
import messageApi from '@/api/message'
import type { MessageData } from '@/types'
import { debounce } from '@/utils/debounce'
import { showError } from '@/utils/message'
import { useCancelableLoader } from '@/composables/useCancelableLoader'
import { usePermissions } from '@/composables/usePermissions'

export function useMessageList() {
  const { isAdmin, isGuest } = usePermissions()

  const messages = shallowRef<MessageData[]>([])
  const { loading, loadError, run: runListLoad, isLatest } = useCancelableLoader()
  const VIRTUAL_TABLE_THRESHOLD = 80
  const useVirtualTable = computed(() => messages.value.length >= VIRTUAL_TABLE_THRESHOLD)

  const keyword = ref('')
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const pageTitle = computed(() => {
    if (isGuest.value) return '留言板（只读）'
    return isAdmin.value ? '留言管理' : '我的留言'
  })
  const pageSubtitle = computed(() => {
    if (isGuest.value) return '游客仅可查看留言内容，无法进行任何操作。'
    if (isAdmin.value) return '管理员可查看全部线索、统一指派业务员，并按需删除无效线索。'
    return '当前账号只会看到被分配给自己的线索。'
  })

  const loadMessages = async (targetPage?: number) => {
    if (!targetPage) targetPage = page.value || 1
    const runResult = await runListLoad(async ({ signal, seq }) => {
      const res = await messageApi.list({
        page: targetPage,
        pageSize: pageSize.value,
        keyword: keyword.value.trim()
      }, { signal })
      if (!isLatest(seq)) return
      messages.value = res.list || []
      total.value = res.total || 0
      page.value = res.page || targetPage
      pageSize.value = res.pageSize || pageSize.value
    })
    if (!runResult.ok && !runResult.canceled) {
      showError(loadError.value || '获取留言列表失败')
    }
  }

  const triggerSearch = debounce(() => {
    page.value = 1
    loadMessages(page.value)
  }, 300)

  const handleSearch = () => {
    triggerSearch()
  }

  return {
    isAdmin,
    isGuest,
    messages,
    loading,
    loadError,
    useVirtualTable,
    keyword,
    page,
    pageSize,
    total,
    pageTitle,
    pageSubtitle,
    loadMessages,
    handleSearch,
    triggerSearch,
  }
}
