/**
 * @module api/http
 * @description Axios 基础实例配置
 * 
 * 提供全局统一的 axios 实例，
 * 用于创建其他 API 模块的请求实例。
 */

import axios from 'axios'

/** API 基础 URL 配置 */
const normalizeBaseURL = () => {
  const envBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  return envBase || 'http://localhost:3000'
}

const http = axios.create({
  baseURL: normalizeBaseURL(),
  timeout: 300000
})

export default http
