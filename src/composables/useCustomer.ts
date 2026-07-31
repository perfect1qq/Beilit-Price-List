import { ref, reactive } from 'vue'
import customerApi from '@/api/customer'
import { to } from '@/utils/async'
import { showError } from '@/utils/message'
import { useListQueryState } from '@/composables/useListQueryState'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { formatDate, addDays } from '@/utils/date'
import type { CustomerListItem, CustomerCreatePayload, CustomerUpdatePayload, CustomerDetailData } from '@/types'

export interface CustomerStats {
  total: number
  undealt: number
  dealt: number
  pending: number
  settled: number
  ordered: number
  notOrdered: number
  pendingInstall: number
  installed: number
  dealer: number
  terminal: number
}

const INITIAL_FORM: CustomerCreatePayload & CustomerUpdatePayload = {
  companyName: '',
  customerName: '',
  contactInfo: '',
  cooperationStatus: '未合作',
  customerType: '终端',
  deliveryDays: null,
  workshopDeliveryDays: null,
  shelfType: '',
  discountPoints: '',
  remark: '',
  paymentStatus: '未有款项',
  orderStatus: '未下单',
  installationStatus: '待安装'
}

export const useCustomerList = () => {
  const loading = ref(false)
  const customerList = ref<CustomerListItem[]>([])
  const searchKeyword = ref('')
  const filterCooperationStatus = ref('')
  const filterCustomerType = ref('')
  const filterPaymentStatus = ref('')
  const filterOrderStatus = ref('')
  const filterInstallationStatus = ref('')

  const { page, pageSize, total, resetToFirstPage } = useListQueryState({
    page: 1,
    pageSize: 10,
    onLoad: () => loadList()
  })

  const loadList = async () => {
    loading.value = true
    try {
      const params: Record<string, unknown> = {
        keyword: searchKeyword.value || undefined,
        page: page.value,
        pageSize: pageSize.value
      }
      if (filterCooperationStatus.value?.trim()) params.cooperationStatus = filterCooperationStatus.value.trim()
      if (filterCustomerType.value?.trim()) params.customerType = filterCustomerType.value.trim()
      if (filterPaymentStatus.value?.trim()) params.paymentStatus = filterPaymentStatus.value.trim()
      if (filterOrderStatus.value?.trim()) params.orderStatus = filterOrderStatus.value.trim()
      if (filterInstallationStatus.value?.trim()) params.installationStatus = filterInstallationStatus.value.trim()

      const [err, res] = await to(customerApi.list(params))
      if (err) { showError(err, '加载客户列表失败'); return }

      customerList.value = (res?.list || []).map((c: ApiCustomerListItem) => ({
        ...c,
        deliveryDate: c.deliveryDays && c.deliveryDays > 0
          ? formatDate(addDays(c.deliveryDays, c.deliveryStartDate || c.createdAt))
          : '',
        workshopDeliveryDate: c.workshopDeliveryDays && c.workshopDeliveryDays > 0
          ? formatDate(addDays(c.workshopDeliveryDays, c.workshopDeliveryStartDate || c.createdAt))
          : ''
      }))
      total.value = Number(res?.total ?? 0)
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => { resetToFirstPage(); loadList() }

  const handleResetFilter = () => {
    searchKeyword.value = ''
    filterCooperationStatus.value = ''
    filterCustomerType.value = ''
    filterPaymentStatus.value = ''
    filterOrderStatus.value = ''
    filterInstallationStatus.value = ''
    resetToFirstPage()
    loadList()
  }

  const removeLocalItem = (id: number) => {
    customerList.value = customerList.value.filter(c => c.id !== id)
  }

  const updateLocalItem = (id: number, data: Partial<CustomerListItem>) => {
    const idx = customerList.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      const list = [...customerList.value]
      list[idx] = { ...list[idx], ...data }
      customerList.value = list
    }
  }

  return {
    loading,
    customerList,
    searchKeyword,
    filterCooperationStatus,
    filterCustomerType,
    filterPaymentStatus,
    filterOrderStatus,
    filterInstallationStatus,
    page,
    pageSize,
    total,
    loadList,
    handleSearch,
    handleResetFilter,
    removeLocalItem,
    updateLocalItem
  }
}

export const useCustomerForm = () => {
  const dialogVisible = ref(false)
  const editingId = ref<number | null>(null)
  const editingDeliveryStartDate = ref('')
  const editingWorkshopDeliveryStartDate = ref('')
  const formData = reactive<CustomerCreatePayload & CustomerUpdatePayload>({ ...INITIAL_FORM })
  const { withSubmitLock } = useFormSubmit()

  const resetForm = () => {
    Object.assign(formData, INITIAL_FORM)
    editingId.value = null
    editingDeliveryStartDate.value = ''
    editingWorkshopDeliveryStartDate.value = ''
  }

  const handleAdd = () => { resetForm(); dialogVisible.value = true }

  const handleEdit = (row: CustomerListItem) => {
    resetForm()
    editingId.value = row.id ?? null
    editingDeliveryStartDate.value = row.deliveryStartDate || ''
    editingWorkshopDeliveryStartDate.value = row.workshopDeliveryStartDate || ''
    Object.assign(formData, {
      companyName: row.companyName,
      customerName: row.customerName,
      contactInfo: row.contactInfo,
      cooperationStatus: row.cooperationStatus || '未合作',
      customerType: row.customerType || '终端',
      deliveryDays: row.deliveryDays ?? null,
      workshopDeliveryDays: row.workshopDeliveryDays ?? null,
      shelfType: row.shelfType || '',
      discountPoints: row.discountPoints || '',
      remark: row.remark,
      paymentStatus: row.paymentStatus || '未有款项',
      orderStatus: row.orderStatus || '未下单',
      installationStatus: row.installationStatus || '待安装'
    })
    dialogVisible.value = true
  }

  return {
    dialogVisible,
    editingId,
    editingDeliveryStartDate,
    editingWorkshopDeliveryStartDate,
    formData,
    resetForm,
    handleAdd,
    handleEdit,
    withSubmitLock
  }
}

export const useCustomerStats = () => {
  const stats = ref<CustomerStats>({
    total: 0,
    undealt: 0,
    dealt: 0,
    pending: 0,
    settled: 0,
    ordered: 0,
    notOrdered: 0,
    pendingInstall: 0,
    installed: 0,
    dealer: 0,
    terminal: 0
  })
  const statsLoading = ref(false)

  const loadStats = async () => {
    statsLoading.value = true
    const [err, res] = await to(customerApi.getStats())
    if (err) { showError(err, '加载统计数据失败'); statsLoading.value = false; return }
    if (res) {
      stats.value = {
        total: res.total,
        undealt: res.undealt,
        dealt: res.dealt,
        pending: res.pending,
        settled: res.settled,
        ordered: res.ordered,
        notOrdered: res.notOrdered,
        pendingInstall: res.pendingInstall,
        installed: res.installed,
        dealer: res.dealer,
        terminal: res.terminal
      }
    }
    statsLoading.value = false
  }

  return { stats, statsLoading, loadStats }
}

export const useFollowUp = () => {
  const currentCustomer = ref<CustomerDetailData | null>(null)

  const refreshCurrentCustomer = async (id: number): Promise<CustomerDetailData | null> => {
    try {
      const res = await customerApi.getDetail(id)
      currentCustomer.value = res?.customer || null
      return currentCustomer.value
    } catch (err) {
      showError(err, '刷新客户数据失败')
      return null
    }
  }

  return {
    currentCustomer,
    refreshCurrentCustomer
  }
}

/**
 * 从客户详情派生列表项更新补丁
 * 报价单相关字段优先使用 updateResult（编辑客户时由后端基于新公司名重算），
 * 否则保留 current 的旧值（跟进/复购变更不影响报价单关联）
 */
export const buildListPatchFromDetail = (
  detail: CustomerDetailData,
  current?: CustomerListItem,
  updateResult?: { hasQuotation: boolean; quotationId: number | null; quotationCount?: number } | null
): Partial<CustomerListItem> => {
  const followUps = detail.followUps || []
  const orders = detail.orders || []
  // 后端按 createdAt 降序返回（最新在前），取第一条作为最新跟进
  const latestFollowUp = followUps.length > 0 ? followUps[0] : null

  return {
    companyName: detail.companyName,
    customerName: detail.customerName,
    contactInfo: detail.contactInfo,
    cooperationStatus: detail.cooperationStatus,
    customerType: detail.customerType,
    deliveryDays: detail.deliveryDays,
    deliveryStartDate: detail.deliveryStartDate,
    workshopDeliveryDays: detail.workshopDeliveryDays,
    workshopDeliveryStartDate: detail.workshopDeliveryStartDate,
    shelfType: detail.shelfType,
    discountPoints: detail.discountPoints,
    remark: detail.remark,
    paymentStatus: detail.paymentStatus,
    orderStatus: detail.orderStatus,
    installationStatus: detail.installationStatus,
    followUpCount: followUps.length,
    orderCount: orders.length,
    latestFollowUp,
    deliveryDate: detail.deliveryDays && detail.deliveryDays > 0
      ? formatDate(addDays(detail.deliveryDays, detail.deliveryStartDate || detail.createdAt))
      : '',
    workshopDeliveryDate: detail.workshopDeliveryDays && detail.workshopDeliveryDays > 0
      ? formatDate(addDays(detail.workshopDeliveryDays, detail.workshopDeliveryStartDate || detail.createdAt))
      : '',
    // 报价单字段：编辑客户时用后端重算的最新值（含 false/null/0，必须显式覆盖）；
    // 其他场景（跟进/复购变更）保留旧值
    ...(updateResult ? {
      hasQuotation: updateResult.hasQuotation,
      quotationDate: null,
      quotationStatus: null,
      quotationId: updateResult.quotationId,
      quotationCount: updateResult.quotationCount
    } : {
      hasQuotation: current?.hasQuotation ?? false,
      quotationDate: current?.quotationDate ?? null,
      quotationStatus: current?.quotationStatus ?? null,
      quotationId: current?.quotationId ?? null,
      quotationCount: current?.quotationCount
    })
  }
}
