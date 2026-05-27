import { defineStore } from 'pinia'
import authApi from '@/api/auth'
import { ROLES } from '@/types'
import type {
  LoginCredentials,
  MenuItem,
  RegisterPayload,
  SessionPayload,
  UserInfo,
} from '@/types'

interface UserState {
  user: UserInfo | null
  permissions: string[]
  menu: MenuItem[]
  hydrated: boolean
  loading: boolean
  authError: string | null
}

let restorePromise: Promise<UserInfo | null> | null = null

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    permissions: [],
    menu: [],
    hydrated: false,
    loading: false,
    authError: null,
  }),

  getters: {
    isLoggedIn: (state: UserState): boolean => Boolean(state.user?.id),

    username: (state: UserState): string => state.user?.username || '',

    role: (state: UserState): string => state.user?.role || '',

    displayName: (state: UserState): string =>
      state.user?.name || state.user?.username || '',

    isAdmin: (state: UserState): boolean => state.user?.role === ROLES.ADMIN,

    isGuest: (state: UserState): boolean => state.user?.role === ROLES.GUEST,

    hasPermission:
      (state: UserState) =>
      (permission: string): boolean => {
        if (!permission) return true
        return state.permissions.includes(permission)
      },
  },

  actions: {
    setSession(payload: Partial<SessionPayload> = {}): void {
      this.user = payload.user || null
      this.permissions = Array.isArray(payload.permissions)
        ? payload.permissions
        : []
      this.menu = Array.isArray(payload.menu) ? payload.menu : []
      this.hydrated = true
      this.authError = null
    },

    clearSession(): void {
      this.user = null
      this.permissions = []
      this.menu = []
      this.hydrated = true
      this.authError = null
    },

    async login(credentials: LoginCredentials): Promise<UserInfo> {
      this.loading = true
      try {
        const session = await authApi.login(credentials)
        this.setSession(session)
        if (!this.user) {
          throw new Error('Login response missing user')
        }
        return this.user
      } catch (error: unknown) {
        this.clearSession()
        const err = error as {
          response?: { data?: { message?: string } }
          message?: string
        }
        this.authError =
          err?.response?.data?.message || err?.message || '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(payload: RegisterPayload): Promise<{ user: UserInfo }> {
      return authApi.register(payload)
    },

    async restoreSession(force: boolean = false): Promise<UserInfo | null> {
      if (!force && this.hydrated) {
        return this.user
      }

      if (!force && restorePromise) {
        return restorePromise
      }

      restorePromise = authApi
        .getProfile()
        .then((session: SessionPayload) => {
          this.setSession(session)
          return this.user
        })
        .catch((error: unknown) => {
          this.clearSession()
          const err = error as { response?: { status?: number } }
          if (err?.response?.status === 401) return null
          throw error
        })
        .finally(() => {
          restorePromise = null
        })

      return restorePromise
    },

    async refreshProfile(): Promise<UserInfo | null> {
      try {
        const session = await authApi.getProfile({ disableCacheBust: false })
        this.setSession(session)
        return this.user
      } catch (error) {
        this.clearSession()
        throw error
      }
    },

    async logout(): Promise<void> {
      try {
        await authApi.logout()
      } finally {
        this.clearSession()
      }
    },

    updateAvatar(avatar: string): void {
      if (this.user) {
        this.user.avatar = avatar
      }
    },

    updateName(name: string): void {
      if (this.user) {
        this.user.name = name
      }
    },
  },
})
