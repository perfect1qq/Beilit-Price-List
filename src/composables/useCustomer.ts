import { ref, reactive } from 'vue'
import customerApi from '@/api/customer'
import { to } from '@/utils/async'
import { showError } from '@/utils/message'
import { usePagination } from '@/composables/usePagination'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { formatDate, addDays } from '@/utils/date'
import type { CustomerListItem as ApiCustomerListItem, CustomerCreatePayload, CustomerUpdatePayload, CustomerDetailData } from '@/types'

export interface CustomerListItem extends ApiCustomerListItem {
  deliveryDate?: string
}

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

  const { page, pageSize, total, resetToFirstPage } = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    onLoad: () => loadList()
  })

  const loadList = async () => {
    loading.value = true
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
    if (err) { showError(err, '加载客户列表失败'); loading.value = false; return }

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
    loading.value = false
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
 * 保留报价单相关字段（hasQuotation/quotation*），仅更新跟进/复购/工期等动态字段
 */
export const buildListPatchFromDetail = (detail: CustomerDetailData, current?: CustomerListItem): Partial<CustomerListItem> => {
  const followUps = detail.followUps || []
  const orders = detail.orders || []
  const latestFollowUp = followUps.length > 0 ? followUps[followUps.length - 1] : null

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
    // 保留报价单相关字段
    hasQuotation: current?.hasQuotation ?? false,
    quotationDate: current?.quotationDate ?? null,
    quotationStatus: current?.quotationStatus ?? null,
    quotationId: current?.quotationId ?? null,
    quotationCount: current?.quotationCount
  }
}
