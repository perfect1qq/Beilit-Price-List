type Preloader = () => Promise<unknown>

const p0Preloaders: Preloader[] = [
  () => import('@/layout/index.vue'),
  () => import('@/views/HomeView.vue')
]

const p1Preloaders: Preloader[] = [
  () => import('@/views/QuotationList.vue'),
  () => import('@/views/NotepadView.vue')
]

const safeBatchLoad = (loaders: Preloader[]): void => {
  loaders.forEach((load) => {
    load().catch(() => {})
  })
}

export const warmupCriticalViews = (): void => {
  setTimeout(() => safeBatchLoad(p0Preloaders), 50)
  setTimeout(() => safeBatchLoad(p1Preloaders), 500)
}