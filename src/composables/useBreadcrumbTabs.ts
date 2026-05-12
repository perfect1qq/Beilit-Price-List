/**
 * @module composables/useBreadcrumbTabs
 * @description 面包屑标签页管理组合式函数
 *
 * 功能说明：
 * - 管理多标签页浏览状态（类似浏览器标签页）
 * - 支持标签页的增删、切换、关闭其他/左侧/右侧
 * - 按用户账号隔离存储（不同用户看到各自的标签页）
 * - 标签页数据持久化到 localStorage
 * - 支持新标签页会话检测（避免跨标签页串数据）
 * - 路由变化时自动同步当前激活标签
 *
 * 数据隔离策略：
 * ┌─────────────────────────────────────────────────────┐
 * │  localStorage Key 格式：                            │
 * │  beilit.visited-views:{userId}                      │
 * │                                                     │
 * │  示例：                                             │
 * │  - 用户 A (id=1): beilit.visited-views:1            │
 * │  - 用户 B (id=2): beilit.visited-views:2            │
 * │  - 游客:      beilit.visited-views:anonymous        │
 * └─────────────────────────────────────────────────────┘
 *
 * 会话管理：
 * - 使用 sessionStorage 生成唯一 session ID
 * - 新标签页打开时检测到新 session，清除旧缓存
 * - 避免同一用户在多个浏览器标签页间数据冲突
 *
 * 标签页操作：
 * ┌──────────┬─────────────────────────────────────────┐
 * │  操作     │  说明                                   │
 * ├──────────┼─────────────────────────────────────────┤
 * │  addView │  添加新标签（路由跳转时自动触发）         │
 * │  goView  │  切换到指定标签                          │
 * │  closeView   │  关闭单个标签                        │
 * │  closeOthers │  关闭除当前外的所有标签               │
 * │  closeLeft   │  关闭左侧所有标签                    │
 * │  closeRight  │  关闭右侧所有标签                    │
 * │  closeAll    │  关闭所有标签（保留首页）             │
 * │  resetAll    │  重置并清除缓存                      │
 * └──────────┴─────────────────────────────────────────┘
 *
 * @example
 * // 在布局组件中使用
 * const {
 *   visitedViews,
 *   currentView,
 *   activeFullPath,
 *   addView,
 *   closeView,
 *   closeOthers
 * } = useBreadcrumbTabs()
 *
 * // 渲染标签页列表
 * <el-tabs v-model="activeFullPath">
 *   <el-tab-pane
 *     v-for="view in visitedViews"
 *     :key="view.fullPath"
 *     :label="view.title"
 *     :name="view.fullPath"
 *     closable
 *   />
 * </el-tabs>
 */

import { computed, reactive, watch, type ComputedRef } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalized } from 'vue-router'
import { resolveRouteDisplayTitle, readCurrentUser } from '@/utils/navigation'

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

/** localStorage 键前缀 */
const STORAGE_PREFIX = 'beilit.visited-views'

/** sessionStorage 中存储的 session ID 键名 */
const SESSION_KEY = 'beilit.tab-session-id'

/** 首页视图常量（不可关闭） */
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

/** 是否已完成初始化 */
let initialized = false

/**
 * 解析当前用户的唯一标识
 *
 * 优先级：id > username > 'anonymous'
 * 用于生成用户专属的 localStorage key
 *
 * @returns {string} 用户唯一标识字符串
 */
const resolveUserKey = (): string => {
  const user = readCurrentUser()
  if (user.role === 'guest') return 'anonymous'
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
  const seen = new Set([HOME_VIEW.fullPath])

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
    if (seen.has(view.fullPath)) continue
    seen.add(view.fullPath)
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
    // ignore
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
    // ignore storage errors
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
  const index = state.visitedViews.findIndex(item => item.fullPath === current.fullPath)
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

/**
 * 重置面包屑标签状态（退出登录时调用）
 *
 * 清空所有标签页数据并删除 localStorage 缓存
 * 防止下一个登录用户看到上一个用户的标签页
 */
export function resetBreadcrumbTabs(): void {
  state.visitedViews = [HOME_VIEW]
  state.activeFullPath = HOME_VIEW.fullPath
  state.userKey = 'anonymous'
  initialized = false
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(getStorageKey())
    } catch {
      // ignore
    }
  }
}

export function useBreadcrumbTabs(): BreadcrumbTabsReturn {
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
        // ignore
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
