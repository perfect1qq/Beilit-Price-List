import type { App } from 'vue'
import AsyncDialog from './AsyncDialog.vue'
import FormDialog from './FormDialog.vue'

export { AsyncDialog, FormDialog }

export default {
  install(app: App): void {
    app.component('AsyncDialog', AsyncDialog)
    app.component('FormDialog', FormDialog)
  }
}
