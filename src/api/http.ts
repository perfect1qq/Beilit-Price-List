import axios from 'axios'

const normalizeBaseURL = (): string => {
  const envBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  return envBase.replace(/\/+$/, '')
}

const http = axios.create({
  baseURL: normalizeBaseURL(),
  timeout: 15000,
  withCredentials: true
})

export default http
