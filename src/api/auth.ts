import request from '../utils/request'
import type { LoginCredentials, RegisterPayload, RequestConfig } from '@/types'

const login = (data: LoginCredentials, config: RequestConfig = {}) =>
  request.post('/api/login', data, {
    authRedirect: false,
    skipCancel: true,
    ...config,
  })

const register = (data: RegisterPayload, config: RequestConfig = {}) =>
  request.post('/api/register', data, {
    authRedirect: false,
    skipCancel: true,
    ...config,
  })

const getProfile = (config: RequestConfig = {}) =>
  request.get('/api/profile', {
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
  request.post('/api/avatar', formData, {
    authRedirect: false,
    skipCancel: true,
  } as RequestConfig)

const deleteAvatar = () =>
  request.delete('/api/avatar', {
    authRedirect: false,
    skipCancel: true,
  } as RequestConfig)

const refreshToken = () =>
  request.post('/api/refresh', null, {
    authRedirect: false,
    skipCancel: true,
    silent: true,
  } as RequestConfig)

export default {
  login,
  register,
  getProfile,
  logout,
  uploadAvatar,
  deleteAvatar,
  refreshToken,
}