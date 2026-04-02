import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/login.vue'
import MainLayout from '../layout/index.vue'
import HomeView from '../views/HomeView.vue'
import QuotationList from '../views/QuotationList.vue'
import BeamQuotationList from '../views/BeamQuotationList.vue'
import BeamQuotationHistory from '../views/BeamQuotationHistory.vue'
import QuotationStatistics from '../views/QuotationStatistics.vue'
import Approval from '../views/approval.vue'
import ApprovalDetail from '../views/approvalDetail.vue'
import MediumShelfWeightTable from '../views/MediumShelfWeightTable.vue'

const HOME_ROUTE = '/home'
const QUOTATION_ROUTE = '/quotation'
const BEAM_QUOTATION_ROUTE = '/beam-quotation'
const APPROVAL_ROUTE = '/approval'
const MEDIUM_SHELF_WEIGHT_ROUTE = '/medium-shelf-weight'
const USD_CONVERSION_ROUTE = '/usd-conversion'
const USER_MANAGEMENT_ROUTE = '/user-management' //用户管理
const QUOTATION_STATISTICS_ROUTE = '/quotation-statistics' //报价单统计

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/register', component: () => import('../views/register.vue'), meta: { public: true } },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: HOME_ROUTE },
      {
        path: 'home',
        component: HomeView,
        meta: {
          title: '首页',
          breadcrumb: [
            { title: '首页', to: HOME_ROUTE }
          ]
        }
      },
      {
        path: 'user-management',
        component: () => import('../views/UserManagement.vue'),
        meta: {
          title: '用户管理',
          breadcrumb: [
            { title: '首页', to: USER_MANAGEMENT_ROUTE },
            { title: '用户管理' }
          ]
        }
      },
      {
        path: 'quotation',
        component: QuotationList,
        meta: {
          title: '报价单',
          breadcrumb: [
            { title: '首页', to: QUOTATION_ROUTE },
            { title: '报价单' }
          ]
        }
      },
      {
        path: 'beam-quotation',
        component: BeamQuotationList,
        meta: {
          title: '横梁载重单',
          breadcrumb: [
            { title: '首页', to: BEAM_QUOTATION_ROUTE },
            { title: '横梁载重单' }
          ]
        }
      },
      {
        path: 'beam-quotation/history',
        component: BeamQuotationHistory,
        meta: {
          title: '历史记录',
          breadcrumb: [
            { title: '首页', to: BEAM_QUOTATION_ROUTE },
            { title: '横梁载重单', to: BEAM_QUOTATION_ROUTE },
            { title: '历史记录' }
          ]
        }
      },
      { path: 'beam-quotation-history', redirect: '/beam-quotation/history' },
      {
        path: 'quotation-statistics',
        component: QuotationStatistics,
        meta: {
          title: '报价单统计',
          breadcrumb: [
            { title: '首页', to: QUOTATION_STATISTICS_ROUTE },
            { title: '报价单统计' }
          ]
        }
      },
      { path: 'Quotation-statistics', redirect: '/quotation-statistics' },
      {
        path: 'approval',
        component: Approval,
        meta: {
          title: '审批管理',
          breadcrumb: [
            { title: '首页', to: APPROVAL_ROUTE },
            { title: '审批管理' }
          ]
        }
      },
      {
        path: 'approval/:id',
        component: ApprovalDetail,
        meta: {
          title: '审批详情',
          breadcrumb: [
            { title: '首页', to: APPROVAL_ROUTE },
            { title: '审批管理', to: APPROVAL_ROUTE },
            { title: '审批详情' }
          ]
        }
      },
      {
        path: 'medium-shelf-weight',
        component: MediumShelfWeightTable,
        meta: {
          title: '中型货架重量表',
          breadcrumb: [
            { title: '首页', to: MEDIUM_SHELF_WEIGHT_ROUTE },
            { title: '中型货架重量表' }
          ]
        }
      },
      {
        path: 'usd-conversion',
        component: () => import('../views/UsdConversion.vue'),
        meta: {
          title: '美金换算',
          breadcrumb: [
            { title: '首页', to: USD_CONVERSION_ROUTE },
            { title: '美金换算' }
          ]
        }
      }
    ]
  }
]


const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
// 增加这个 scrollBehavior 配置
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（比如点击浏览器后退按钮），就回到原来的位置
    if (savedPosition) {
      return savedPosition
    } else {
      // 否则每次切换路由，都强制滚回左上角 (0, 0)
      return { top: 0, left: 0 }
    }
  }
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (to.meta.public) {
    if (token && (to.path === '/login' || to.path === '/register')) {
      return '/'
    }
    return true
  }

  if (!token) return '/login'

  if (to.meta.adminOnly && user.role !== 'admin') {
    return '/'
  }

  return true
})

export default router
