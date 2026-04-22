/**
 * @module api/user
 * @description 用户管理相关 API 接口封装
 * 
 * 提供用户相关的所有接口：
 * - 登录/注册/登出
 * - 用户列表 CRUD
 * - 角色管理（admin/user/guest）
 * - 密码修改与重置
 * - 个人信息修改
 */

import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

/** 用户登录 */
const login = (data) => request.post('/api/login', data)

/** 新用户注册 */
const register = (data) => request.post('/api/register', data)

/** 获取当前登录用户信息 */
const getProfile = () => request.get('/api/profile')

/** 修改当前用户密码 */
const changePassword = (data) => request.post('/api/user/change-password', data)

/** 管理员重置指定用户密码 */
const resetPassword = (userId, newPassword) =>
  request.post(`/api/users/${userId}/reset-password`, { password: newPassword })

/** 获取用户列表（管理员） */
const listUsers = () => request.get('/api/users')

/** 修改用户角色 */
const updateUserRole = (userId, role) =>
  request.put(`/api/users/${userId}/role`, { role })

/** 修改用户显示名称 */
const updateUserName = (userId, name) =>
  request.put(`/api/users/${userId}/name`, { name })

/** 删除用户 */
const deleteUser = (userId) =>
  request.delete(`/api/users/${userId}`)

/** 登出（前端清除状态即可） */
const logout = () => Promise.resolve()

/** 用户 API 对象（对外导出） */
const userApi = {
  login: unwrap(login),
  register: unwrap(register),
  logout,
  getCurrentUser: unwrap(getProfile),
  changePassword: unwrap(changePassword),
  resetPassword: unwrap(resetPassword),
  list: unwrap(listUsers),
  remove: unwrap(deleteUser),
  updateRole: unwrap(updateUserRole),
  updateName: unwrap(updateUserName)
}

export { logout, userApi }
export default userApi
