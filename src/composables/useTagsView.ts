import { reactive } from 'vue'

interface TagView {
  fullPath: string
  path: string
  title: string
  name: string
  affix: boolean
}

const STORAGE_KEY = 'beilit.tags-view.v1'

const homeTag: TagView = {
  fullPath: '/home',
  path: '/home',
  title: '首页',
  name: 'Home',
  affix: true
}

const loadVisitedViews = (): TagView[] => {
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

const state = reactive<{ visitedViews: TagView[]; activeFullPath: string }>({
  visitedViews: loadVisitedViews(),
  activeFullPath: '/home'
})

const persist = (): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.visitedViews))
  } catch {
    void 0
  }
}

const removeAllViews = (): void => {
  state.visitedViews.splice(0, state.visitedViews.length, homeTag)
  state.activeFullPath = '/home'
  persist()
}

export const useTagsView = () => {
  return { removeAllViews }
}
