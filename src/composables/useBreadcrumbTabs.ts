

import { computed, reactive, watch, type ComputedRef } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalized } from 'vue-router'
import { resolveRouteDisplayTitle, readCurrentUser } from '@/utils/navigation'
import { ROLES } from '@/types'

type RouterQuery = Record<string, string | string[] | undefined>

interface TabView {
  path: string
  fullPath: string
  title: string
  name: string
  query: RouterQuery
  hash: string
}

interface BreadcrumbTabsReturn {
  visitedViews: ComputedRef<TabView[]>
  currentView: ComputedRef<TabView>
  activeFullPath: ComputedRef<string>
  addView: (routeLike: RouteLocationNormalized) => TabView
  goView: (view: TabView) => Promise<void>
  closeView: (view: TabView) => Promise<void>
  closeOthers: (view?: TabView) => Promise<void>
  closeLeft: (view?: TabView) => void
  closeRight: (view?: TabView) => void
  closeAll: () => Promise<void>
  resetAll: () => void
}


const STORAGE_PREFIX = 'beilit.visited-views'


const SESSION_KEY = 'beilit.tab-session-id'


const HOME_VIEW: TabView = Object.freeze({
  path: '/home',
  fullPath: '/home',
  title: '首页',
  name: 'Home',
  query: {},
  hash: ''
})

const state = reactive<{ visitedViews: TabView[]; activeFullPath: string; userKey: string }>({
  visitedViews: [HOME_VIEW],
  activeFullPath: '/home',
  userKey: 'anonymous'
})


let initialized = false



const resolveUserKey = (): string => {
  const user = readCurrentUser()
  if (user.role === ROLES.GUEST) return 'anonymous'
  return String(user.id ?? user.username ?? 'anonymous')
}

const getStorageKey = (userKey: string = resolveUserKey()): string => `${STORAGE_PREFIX}:${userKey}`

const safeClone = (value: unknown): RouterQuery => {
  try {
    return JSON.parse(JSON.stringify(value || {}))
  } catch {
    return {}
  }
}

const normalizeView = (routeLike: RouteLocationNormalized | Record<string, unknown>): TabView => {
  const route = routeLike || {}
  const path = (route.path as string) || HOME_VIEW.path
  return {
    path,
    fullPath: (route.fullPath as string) || path,
    title: resolveRouteDisplayTitle(route as RouteLocationNormalized),
    name: route.name ? String(route.name) : '',
    query: safeClone((route as RouteLocationNormalized).query),
    hash: (route.hash as string) || ''
  }
}

const dedupeAndFixHome = (list: TabView[]): TabView[] => {
  const result: TabView[] = [HOME_VIEW]
  const seen = new Set([HOME_VIEW.fullPath, HOME_VIEW.path])

  for (const item of list || []) {
    if (!item || !item.path || item.path === '/login' || item.path === '/register') continue
    const view: TabView = {
      path: item.path,
      fullPath: item.fullPath || item.path,
      title: item.title || ((item as unknown as Record<string, unknown>).label as string) || '未命名页面',
      name: item.name || '',
      query: safeClone(item.query),
      hash: item.hash || ''
    }
    if (seen.has(view.fullPath) || seen.has(view.path)) continue
    seen.add(view.fullPath)
    seen.add(view.path)
    result.push(view)
  }

  return result
}

const isNewTabSession = (): boolean => {
  if (typeof window === 'undefined') return false
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (!existing) {
    const sessionId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    window.sessionStorage.setItem(SESSION_KEY, sessionId)
    return true
  }
  return false
}

const clearStaleTabs = (userKey: string): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(getStorageKey(userKey))
  } catch {
    void 0
  }
}

const loadViews = (userKey: string): TabView[] => {
  if (typeof window === 'undefined') return [HOME_VIEW]

  if (isNewTabSession()) {
    clearStaleTabs(userKey)
    return [HOME_VIEW]
  }

  try {
    const saved = window.localStorage.getItem(getStorageKey(userKey))
    if (!saved) return [HOME_VIEW]
    const parsed = JSON.parse(saved)
    return dedupeAndFixHome(Array.isArray(parsed) ? parsed : [])
  } catch {
    return [HOME_VIEW]
  }
}

const persistViews = (): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getStorageKey(state.userKey), JSON.stringify(state.visitedViews))
  } catch {
    void 0
  }
}

const syncUserContext = (route: RouteLocationNormalized): void => {
  const currentKey = resolveUserKey()
  if (state.userKey === currentKey && initialized) return

  state.userKey = currentKey
  state.visitedViews = loadViews(currentKey)
  state.activeFullPath = route?.fullPath || HOME_VIEW.fullPath
  initialized = true
}

const ensureCurrentExists = (route: RouteLocationNormalized): TabView => {
  const current = normalizeView(route)
  const index = state.visitedViews.findIndex(item => item.fullPath === current.fullPath || (item.path === current.path && item.path !== '/home'))
  if (index === -1) {
    state.visitedViews.push(current)
  } else {
    state.visitedViews[index] = { ...state.visitedViews[index], ...current }
  }
  persistViews()
  return current
}

const getCurrent = (route: RouteLocationNormalized): TabView =>
  state.visitedViews.find(item => item.fullPath === route.fullPath) || normalizeView(route)



export const resetBreadcrumbTabs = (): void => {
  state.visitedViews = [HOME_VIEW]
  state.activeFullPath = HOME_VIEW.fullPath
  state.userKey = 'anonymous'
  initialized = false
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(getStorageKey())
    } catch {
      void 0
    }
  }
}

export const useBreadcrumbTabs = (): BreadcrumbTabsReturn => {
  const route = useRoute()
  const router = useRouter()

  syncUserContext(route)

  const visitedViews = computed(() => state.visitedViews)

  const currentView = computed(() => getCurrent(route))

  const activeFullPath = computed(() => route.fullPath)

  const addView = (routeLike: RouteLocationNormalized): TabView => {
    syncUserContext(routeLike)
    if (!routeLike || routeLike.path === '/login' || routeLike.path === '/register') return HOME_VIEW
    return ensureCurrentExists(routeLike)
  }

  const goView = async (view: TabView): Promise<void> => {
    if (!view) return
    const target = {
      path: view.path,
      query: view.query || undefined,
      hash: view.hash || undefined
    }
    if (route.fullPath === view.fullPath) return
    await router.push(target)
  }

  const closeView = async (view: TabView): Promise<void> => {
    if (!view || view.path === HOME_VIEW.path) return

    const index = state.visitedViews.findIndex(item => item.fullPath === view.fullPath)
    if (index === -1) return

    const isCurrent = route.fullPath === view.fullPath
    state.visitedViews.splice(index, 1)
    persistViews()

    if (isCurrent) {
      const nextView = state.visitedViews[index] || state.visitedViews[index - 1] || HOME_VIEW
      await router.push({
        path: nextView.path,
        query: nextView.query || undefined,
        hash: nextView.hash || undefined
      })
    }
  }

  const closeOthers = async (view?: TabView): Promise<void> => {
    const target = view || currentView.value
    if (!target) return

    state.visitedViews = state.visitedViews.filter(item => item.path === HOME_VIEW.path || item.fullPath === target.fullPath)
    persistViews()

    if (route.fullPath !== target.fullPath) {
      await router.push({
        path: target.path,
        query: target.query || undefined,
        hash: target.hash || undefined
      })
    }
  }

  const closeLeft = (view?: TabView): void => {
    const target = view || currentView.value
    if (!target) return

    const targetIndex = state.visitedViews.findIndex(item => item.fullPath === target.fullPath)
    if (targetIndex <= 1) return

    state.visitedViews = [
      HOME_VIEW,
      ...state.visitedViews.filter((_item, index) => index === targetIndex || index > targetIndex)
    ]
    persistViews()
  }

  const closeRight = (view?: TabView): void => {
    const target = view || currentView.value
    if (!target) return

    const targetIndex = state.visitedViews.findIndex(item => item.fullPath === target.fullPath)
    if (targetIndex === -1) return

    state.visitedViews = state.visitedViews.filter((_item, index) => index === 0 || index <= targetIndex)
    persistViews()
  }

  const closeAll = async (): Promise<void> => {
    state.visitedViews = [HOME_VIEW]
    persistViews()
    if (route.path !== HOME_VIEW.path) {
      await router.push(HOME_VIEW.path)
    }
  }

  const resetAll = (): void => {
    state.visitedViews = [HOME_VIEW]
    state.activeFullPath = HOME_VIEW.fullPath
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(getStorageKey(state.userKey))
      } catch {
        void 0
      }
    }
  }

  watch(
    () => route.fullPath,
    () => {
      syncUserContext(route)
      addView(route)
    },
    { immediate: true }
  )

  return {
    visitedViews,
    currentView,
    activeFullPath,
    addView,
    goView,
    closeView,
    closeOthers,
    closeLeft,
    closeRight,
    closeAll,
    resetAll
  }
}
