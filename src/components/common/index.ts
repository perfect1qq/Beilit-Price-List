import type { App } from 'vue'
import AsyncDialog from './AsyncDialog.vue'
import FormDialog from './FormDialog.vue'
import AutoFitColumn from './AutoFitColumn.vue'
import PagePagination from './PagePagination.vue'
import SearchBar from './SearchBar.vue'
import CardHeader from './CardHeader.vue'
import CardList from './CardList.vue'
import AppButton from './AppButton.vue'
import ActionButtons from './ActionButtons.vue'
import FormButtons from './FormButtons.vue'
import AttachmentList from './AttachmentList.vue'

export { AsyncDialog, FormDialog, AutoFitColumn, PagePagination, SearchBar, CardHeader, CardList, AppButton, ActionButtons, FormButtons, AttachmentList }

export default {
  install(app: App): void {
    app.component('AsyncDialog', AsyncDialog)
    app.component('FormDialog', FormDialog)
    app.component('AutoFitColumn', AutoFitColumn)
    app.component('PagePagination', PagePagination)
    app.component('SearchBar', SearchBar)
    app.component('CardHeader', CardHeader)
    app.component('CardList', CardList)
    app.component('AppButton', AppButton)
    app.component('ActionButtons', ActionButtons)
    app.component('FormButtons', FormButtons)
    app.component('AttachmentList', AttachmentList)
  }
}
