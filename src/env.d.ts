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
