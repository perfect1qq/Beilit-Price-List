import { useUserStore } from '@/stores/user'
import { pinia } from '@/stores'
import { ROLES } from '@/types'
import type { UserInfo, GuestUser } from '@/types'
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

export const readCurrentUser = (): UserInfo | GuestUser => {
  const store = useUserStore(pinia)
  return store.user || { role: ROLES.GUEST }
}

type TitleResolver = (route?: RouteLocationNormalized | RouteRecordRaw) => string

const ROUTE_TITLE_MAP: Record<string, TitleResolver> = {
  '/message': () => {
    const user = readCurrentUser()
    return user.role === ROLES.ADMIN ? '留言管理' : '我的留言'
  },
  '/home': () => '首页',
  '/quotation': () => '报价单',
  '/beam-quotation': () => '横梁载重单',
  '/approval': () => '审批管理',
  '/memo-management': () => '备忘录',
  '/medium-shelf-weight': () => '中型货架重量表',
  '/usd-conversion': () => '美金换算',
  '/user-management': () => '用户管理',
}

export const resolveRouteDisplayTitle = (route: RouteLocationNormalized | string): string => {
  const path = typeof route === 'string' ? route : (route?.path || '')

  if (ROUTE_TITLE_MAP[path]) {
    return ROUTE_TITLE_MAP[path](typeof route === 'string' ? undefined : route)
  }

  if (typeof route !== 'string' && route?.meta?.title) {
    return route.meta.title as string
  }

  const match = Object.keys(ROUTE_TITLE_MAP).find((key) =>
    path.startsWith(key),
  )
  return match ? ROUTE_TITLE_MAP[match](typeof route === 'string' ? undefined : route) : path.split('/').pop() || '页面'
}
