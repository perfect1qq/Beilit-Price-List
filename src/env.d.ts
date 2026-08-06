/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

import 'axios'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    authRedirect?: boolean
    skipCancel?: boolean
    silent?: boolean
    disableCacheBust?: boolean
    _isRefreshRequest?: boolean
    __retryCount?: number
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ALLOW_PUBLIC_REGISTER: string
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
