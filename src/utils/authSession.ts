import router from '../router'
import { to } from '@/utils/async'
import { setAuthExpiredHandler } from './authRuntime'
import { useUserStore } from '@/stores/user'
import { pinia } from '@/stores'

const clearTabCache = (): void => {
  const prefixes = [
    'beilit.visited-views:',
    'ruoyi-like-visited-views',
    'beilit.tab-session-id',
    'beilit.tags-view',
  ]

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

const clearSessionStorage = (): void => {
  sessionStorage.clear()
}

const clearPiniaStore = (): void => {
  useUserStore(pinia).clearSession()
}

const clearTabsMemoryState = async (): Promise<void> => {
  try {
    const { useTagsView } = await import('@/composables/useTagsView')
    const tagsView = useTagsView()
    tagsView.removeAllViews()
  } catch {
    void 0
  }

  try {
    const { useBreadcrumbTabs } = await import(
      '@/composables/useBreadcrumbTabs'
    )
    const tabs = useBreadcrumbTabs()
    if (tabs.resetAll) tabs.resetAll()
  } catch {
    void 0
  }
}

export const clearAuthAndRedirect = async (): Promise<void> => {
  clearTabCache()
  clearSessionStorage()
  clearPiniaStore()
  await clearTabsMemoryState()

  router.replace('/login').catch(() => {})
}

export const handleAuthExpired = (): Promise<void> => clearAuthAndRedirect()

export const registerAuthRuntimeHandlers = (): void => {
  setAuthExpiredHandler(handleAuthExpired)
}

export const logoutByUser = async (): Promise<void> => {
  await to(useUserStore(pinia).logout())
  await clearAuthAndRedirect()
}

export default {
  clearAuthAndRedirect,
  handleAuthExpired,
  logoutByUser,
  registerAuthRuntimeHandlers,
}