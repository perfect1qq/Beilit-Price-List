import { computed, reactive, type ComputedRef } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

interface TagView {
  fullPath: string
  path: string
  title: string
  name: string
  affix: boolean
}

interface TagsViewReturn {
  tags: ComputedRef<TagView[]>
  activeFullPath: ComputedRef<string>
  addVisitedView: (route: RouteLocationNormalized) => void
  setActiveView: (fullPath: string) => void
  removeVisitedView: (fullPath: string) => { nextPath: string; removed: TagView | null }
  removeOtherViews: (fullPath: string) => void
  removeAllViews: () => void
}

const STORAGE_KEY = 'beilit.tags-view.v1'

const homeTag: TagView = {
  fullPath: '/home',
  path: '/home',
  title: '首页',
  name: 'Home',
  affix: true
}

const state = reactive<{ visitedViews: TagView[]; activeFullPath: string }>({
  visitedViews: loadVisitedViews(),
  activeFullPath: '/home'
})

function loadVisitedViews(): TagView[] {
  if (typeof window === 'undefined') return [homeTag]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [homeTag]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return [homeTag]

    const normalized: TagView[] = parsed
      .filter(Boolean)
      .map((item: Record<string, unknown>) => ({
        fullPath: String(item.fullPath || item.path || '/home'),
        path: String(item.path || item.fullPath || '/home'),
        title: String(item.title || '未命名'),
        name: String(item.name || item.title || '未命名'),
        affix: Boolean(item.affix)
      }))

    if (!normalized.some(item => item.fullPath === '/home')) {
      normalized.unshift(homeTag)
    }
    return normalized
  } catch {
    return [homeTag]
  }
}

function persist(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.visitedViews))
  } catch {

  }
}

function replaceViews(nextViews: TagView[]): void {
  state.visitedViews.splice(0, state.visitedViews.length, ...nextViews)
  persist()
}

function normalizeRoute(route: RouteLocationNormalized): TagView {
  const path = route.path || '/home'
  const fullPath = route.fullPath || path
  const title = (route.meta?.title as string) || (route.name as string) || '未命名'
  return {
    fullPath,
    path,
    title,
    name: (route.name as string) || title,
    affix: path === '/home' || Boolean(route.meta?.affix)
  }
}

function addVisitedView(route: RouteLocationNormalized): void {
  const view = normalizeRoute(route)
  const exists = state.visitedViews.find(item => item.fullPath === view.fullPath)
  if (!exists) {
    replaceViews([...state.visitedViews, view])
  }
  state.activeFullPath = view.fullPath
  persist()
}

function setActiveView(fullPath: string): void {
  state.activeFullPath = fullPath
}

function removeVisitedView(fullPath: string): { nextPath: string; removed: TagView | null } {
  const index = state.visitedViews.findIndex(item => item.fullPath === fullPath)
  if (index === -1) {
    return { nextPath: '/home', removed: null }
  }

  const target = state.visitedViews[index]
  if (target?.affix) {
    return { nextPath: target.fullPath, removed: target }
  }

  const nextViews = state.visitedViews.filter(item => item.fullPath !== fullPath)
  const nextActive = state.activeFullPath === fullPath
    ? (nextViews[index - 1] || nextViews[index] || nextViews.find(item => item.affix) || homeTag)
    : nextViews.find(item => item.fullPath === state.activeFullPath) || nextViews.find(item => item.affix) || homeTag

  replaceViews(nextViews.length ? nextViews : [homeTag])
  state.activeFullPath = nextActive.fullPath

  return { nextPath: nextActive.fullPath, removed: target }
}

function removeOtherViews(fullPath: string): void {
  const current = state.visitedViews.find(item => item.fullPath === fullPath) || homeTag
  replaceViews(state.visitedViews.filter(item => item.affix || item.fullPath === current.fullPath))
  state.activeFullPath = current.fullPath
}

function removeAllViews(): void {
  replaceViews([homeTag])
  state.activeFullPath = '/home'
}

export function useTagsView(): TagsViewReturn {
  return {
    tags: computed(() => state.visitedViews),
    activeFullPath: computed(() => state.activeFullPath),
    addVisitedView,
    setActiveView,
    removeVisitedView,
    removeOtherViews,
    removeAllViews
  }
}
