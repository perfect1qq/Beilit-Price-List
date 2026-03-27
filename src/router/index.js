import { createRouter, createWebHashHistory } from 'vue-router'
import QuotationList from '../views/QuotationList.vue'
import BeamQuotationList from '../views/BeamQuotationList.vue'
import QuotationStatistics from '../views/QuotationStatistics.vue'


const routes = [
  {
    path: '/',
    redirect: '/quotation'
  },
  {
    path: '/quotation',
    name: 'Quotation',
    component: QuotationList,
    meta: { title: '报价单' }
  },
  {
    path: '/beam-quotation',
    name: 'BeamQuotation',
    component: BeamQuotationList,
    meta: { title: '横梁报价单' }
  },
   {
    path: '/Quotation-statistics',
    name: 'QuotationStatistics',
    component: QuotationStatistics,
    meta: { requiresAuth: true,permission: '报价单统计' }
  },
]

const router = createRouter({
// 2. 使用 Hash 模式
  // import.meta.env.BASE_URL 会自动获取你在 vite.config.js 中配置的 base ('/vue-project/')
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router