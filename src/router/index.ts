import { createRouter, createWebHashHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router'
import { applyAuthGuard } from '@/router/guards/authGuard'

const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const MainLayout = () => import('../layout/index.vue')
const HomeView = () => import('../views/HomeView.vue')
const UserManagement = () => import('../views/UserManagement.vue')

const QuotationLayout = () => import('../views/QuotationLayout.vue')
const QuotationList = () => import('../views/QuotationList.vue')
const QuotationHistory = () => import('../views/QuotationHistory.vue')
const QuotationStatistics = () => import('../views/QuotationStatistics.vue')

const OrderLayout = () => import('../views/OrderLayout.vue')
const OrderPlacement = () => import('../views/OrderPlacement.vue')
const OrderHistory = () => import('../views/OrderHistory.vue')

const BeamQuotationLayout = () => import('../views/BeamQuotationLayout.vue')
const BeamQuotationList = () => import('../views/BeamQuotationList.vue')
const BeamQuotationHistory = () => import('../views/BeamQuotationHistory.vue')

const ApprovalLayout = () => import('../views/ApprovalLayout.vue')
const Approval = () => import('../views/Approval.vue')
const ApprovalDetail = () => import('../views/ApprovalDetail.vue')
const ApprovalHistory = () => import('../views/ApprovalHistory.vue')

const MediumShelfWeightTable = () => import('../views/MediumShelfWeightTable.vue')
const ShelfMaterialWeight = () => import('../views/ShelfMaterialWeight.vue')
const MaterialCalculationLayout = () => import('../views/MaterialCalculationLayout.vue')
const BackMeshMaterial = () => import('../views/BackMeshMaterial.vue')
const MemoManagement = () => import('../views/MemoManagement.vue')
const UsdConversion = () => import('../views/UsdConversion.vue')
const CustomerManagement = () => import('../views/CustomerManagement.vue')
const NotepadView = () => import('../views/NotepadView.vue')
const ContractLayout = () => import('../views/ContractLayout.vue')
const ContractNew = () => import('../views/ContractNew.vue')
const ContractHistory = () => import('../views/ContractHistory.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: Login,
    meta: { public: true, title: '登录' },
  },
  {
    path: '/register',
    component: Register,
    meta: { public: true, title: '注册' },
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/home' },
      {
        path: 'home',
        name: 'Home',
        component: HomeView,
        meta: { title: '首页' },
      },
      {
        path: 'user-management',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理', requiresPermission: 'user:manage' },
      },
      {
        path: 'quotation',
        component: QuotationLayout,
        meta: { title: '报价单' },
        children: [
          {
            path: '',
            name: 'Quotation',
            component: QuotationList,
            meta: { title: '报价单', requiresPermission: 'quotation:write' },
          },
          {
            path: 'history',
            name: 'QuotationHistory',
            component: QuotationHistory,
            meta: { title: '报价单历史', requiresPermission: 'quotation:write' },
          },
        ],
      },
      {
        path: 'order',
        component: OrderLayout,
        meta: { title: '下单' },
        children: [
          {
            path: '',
            name: 'OrderPlacement',
            component: OrderPlacement,
            meta: { title: '新增下单', requiresPermission: 'order:write' },
          },
          {
            path: 'history',
            name: 'OrderHistory',
            component: OrderHistory,
            meta: { title: '订单历史', requiresPermission: 'order:write' },
          },
        ],
      },
      {
        path: 'beam-quotation',
        component: BeamQuotationLayout,
        meta: { title: '横梁载重单' },
        children: [
          {
            path: '',
            name: 'BeamQuotationList',
            component: BeamQuotationList,
            meta: { title: '横梁载重单', requiresPermission: 'beam:write' },
          },
          {
            path: 'history',
            name: 'BeamQuotationHistory',
            component: BeamQuotationHistory,
            meta: { title: '横梁载重单历史', requiresPermission: 'beam:write' },
          },
        ],
      },
      {
        path: 'quotation-statistics',
        name: 'QuotationStatistics',
        component: QuotationStatistics,
        meta: { title: '报价单统计', requiresPermission: 'quotation:write' },
      },
      {
        path: 'approval',
        component: ApprovalLayout,
        meta: { title: '审批管理', requiresPermission: 'approval:review' },
        children: [
          {
            path: '',
            name: 'Approval',
            component: Approval,
            meta: { title: '审批', requiresPermission: 'approval:review' },
          },
          {
            path: 'history',
            name: 'ApprovalHistory',
            component: ApprovalHistory,
            meta: { title: '审批历史', requiresPermission: 'approval:review' },
          },
          {
            path: 'history/:id',
            name: 'ApprovalHistoryDetail',
            component: ApprovalDetail,
            meta: { title: '审批历史详情', requiresPermission: 'approval:review' },
          },
          {
            path: ':id',
            name: 'ApprovalDetail',
            component: ApprovalDetail,
            meta: { title: '审批详情', requiresPermission: 'approval:review' },
          },
        ],
      },
      {
        path: 'medium-shelf-weight',
        name: 'MediumShelfWeight',
        component: MediumShelfWeightTable,
        meta: { title: '中型货架重量表', requiresPermission: 'quotation:write' },
      },
      {
        path: 'material-calculation',
        component: MaterialCalculationLayout,
        meta: { title: '计算材料' },
        children: [
          {
            path: 'shelf-weight',
            name: 'ShelfMaterialWeight',
            component: ShelfMaterialWeight,
            meta: { title: '货架材料单', requiresPermission: 'quotation:write' },
          },
          {
            path: 'back-mesh',
            name: 'BackMeshMaterial',
            component: BackMeshMaterial,
            meta: { title: '背网材料计算', requiresPermission: 'quotation:write' },
          }
        ]
      },
      {
        path: 'memo-management',
        name: 'MemoManagement',
        component: MemoManagement,
        meta: { title: '备忘录', requiresPermission: 'memo:write' },
      },
      {
        path: 'usd-conversion',
        name: 'UsdConversion',
        component: UsdConversion,
        meta: { title: '美金换算', requiresPermission: 'quotation:write' },
      },
      {
        path: 'customer-management',
        name: 'CustomerManagement',
        component: CustomerManagement,
        meta: { title: '客户管理', requiresPermission: 'customer:write' },
      },
      {
        path: 'notepad',
        name: 'Notepad',
        component: NotepadView,
        meta: { title: '记事本', requiresPermission: 'notepad:write' },
      },
      {
        path: 'contract',
        component: ContractLayout,
        meta: { title: '合同管理' },
        children: [
          {
            path: '',
            name: 'ContractNew',
            component: ContractNew,
            meta: { title: '新增合同', requiresPermission: 'contract:write' },
          },
          {
            path: 'history',
            name: 'ContractHistory',
            component: ContractHistory,
            meta: { title: '合同历史', requiresPermission: 'contract:write' },
          }
        ]
      },
      // 已登录用户访问不存在的地址：展示 404 页面（保留侧边栏）
      {
        path: ':pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
        meta: { title: '页面不存在' },
      },
    ],
  },
  { path: '/beam-quotation-history', redirect: '/beam-quotation/history' },
  { path: '/quotation-history', redirect: '/quotation/history' },
  { path: '/Quotation-statistics', redirect: '/quotation-statistics' },
  // 顶层兜底：未登录访问任意地址 → 由 authGuard 重定向到 /login
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to: RouteLocationNormalized, from: RouteLocationNormalized, savedPosition: { top: number; left: number } | null) {
    if (savedPosition) return savedPosition
    return { top: 0, left: 0 }
  },
})

router.beforeEach(applyAuthGuard)

export default router