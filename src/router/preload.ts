type Preloader = () => Promise<unknown>

const p0Preloaders: Preloader[] = [
  () => import('@/views/HomeView.vue'),
  () => import('@/views/QuotationList.vue')
]

const safeBatchLoad = (loaders: Preloader[]): void => {
  loaders.forEach((load) => {
    load().catch(() => {})
  })
}

export const warmupCriticalViews = (): void => {
  setTimeout(() => safeBatchLoad(p0Preloaders), 200)
}