type Preloader = () => Promise<unknown>

const p0Preloaders: Preloader[] = [
  () => import('@/layout/index.vue'),
  () => import('@/views/HomeView.vue')
]

const p1Preloaders: Preloader[] = [
  () => import('@/views/QuotationList.vue'),
  () => import('@/views/NotepadView.vue')
]

const reportPreloadError = (group: string, index: number, error: unknown): void => {
  console.warn('[router-preload] view preload failed', {
    group,
    index,
    error: error instanceof Error ? error.message : String(error)
  })
}

const safeBatchLoad = (loaders: Preloader[], group: string): void => {
  loaders.forEach((load, index) => {
    load().catch((error: unknown) => reportPreloadError(group, index, error))
  })
}

export const warmupCriticalViews = (): void => {
  setTimeout(() => safeBatchLoad(p0Preloaders, 'p0'), 50)
  setTimeout(() => safeBatchLoad(p1Preloaders, 'p1'), 500)
}
