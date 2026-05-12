import { createApp, type App as VueApp } from 'vue'
import './assets/styles/global.css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/message-box/style/css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { registerAuthRuntimeHandlers } from './utils/authSession'
import { warmupCriticalViews } from './router/preload'
import DialogComponents from '@/components/common'

declare const __APP_VERSION__: string

const APP_VERSION: string = __APP_VERSION__
const VERSION_KEY = 'beilit-app-version'

const storedVersion = localStorage.getItem(VERSION_KEY)
if (storedVersion !== APP_VERSION) {
  localStorage.setItem(VERSION_KEY, APP_VERSION)
  if (storedVersion) {
    window.location.reload()
  }
}

const app: VueApp = createApp(App)

app.use(pinia)
app.use(router)
app.use(DialogComponents)

registerAuthRuntimeHandlers()

app.mount('#app')

warmupCriticalViews()