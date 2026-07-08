import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { LoginCredentials, RegisterPayload, RequestConfig, SessionPayload, UserInfo } from '@/types'

const login = (data: LoginCredentials, config: RequestConfig = {}) =>
  request.post<SessionPayload>('/api/login', data, {
    authRedirect: false,
    skipCancel: true,
    ...config,
  })

const register = (data: RegisterPayload, config: RequestConfig = {}) =>
  request.post<{ user: UserInfo }>('/api/register', data, {
    authRedirect: false,
    skipCancel: true,
    ...config,
  })

const getProfile = (config: RequestConfig = {}) =>
  request.get<SessionPayload>('/api/profile', {
    disableCacheBust: true,
    skipCancel: true,
    silent: true,
    authRedirect: false,
    ...config,
  })

const logout = (config: RequestConfig = {}) =>
  request.post('/api/logout', null, {
    authRedirect: false,
    skipCancel: true,
    silent: true,
    ...config,
  })

const uploadAvatar = (formData: FormData) =>
  request.post<{ avatar: string }>('/api/avatar', formData, {
    authRedirect: false,
    skipCancel: true,
  } as RequestConfig)

const deleteAvatar = () =>
  request.delete('/api/avatar', {
    authRedirect: false,
    skipCancel: true,
  } as RequestConfig)

const refresh = () =>
  request.post<SessionPayload>('/api/refresh', null, {
    authRedirect: false,
    skipCancel: true,
    silent: true,
    _isRefreshRequest: true,
  } as RequestConfig)

const authApi = {
  login: unwrap(login),
  register: unwrap(register),
  getProfile: unwrap(getProfile),
  logout: unwrap(logout),
  uploadAvatar: unwrap(uploadAvatar),
  deleteAvatar: unwrap(deleteAvatar),
  refresh: unwrap(refresh),
}

export default authApi
