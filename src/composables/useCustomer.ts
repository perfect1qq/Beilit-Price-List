import { ref, reactive } from 'vue'
import { ElMessageBox } from 'element-plus'
import customerApi from '@/api/customer'
import { to } from '@/utils/async'
import { showError, showSuccess } from '@/utils/message'
import { usePagination } from '@/composables/usePagination'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { formatDate, addDays } from '@/utils/date'
import type { CustomerData, FollowUpData } from '@/types'

export interface CustomerListItem extends CustomerData {
  latestFollowUp?: FollowUpData
  followUpCount?: number
  ownerName?: string
  hasQuotation?: boolean
  quotationId?: number | string
  quotationDate?: string
  deliveryDate?: string
}

const INITIAL_FORM: CustomerData = {
  companyName: '',
  customerName: '',
  contactInfo: '',
  cooperationStatus: '未合作',
  customerType: '终端',
  deliveryDays: null,
  shelfType: '',
  remark: ''
}

export const useCustomerList = () => {
  const loading = ref(false)
  const customerList = ref<CustomerListItem[]>([])
  const searchKeyword = ref('')
  const filterCooperationStatus = ref('')
  const filterCustomerType = ref('')

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

    const [err, res] = await to(customerApi.list(params))
    if (err) { showError(err, '加载客户列表失败'); loading.value = false; return }

    customerList.value = (res?.customers || []).map((c: CustomerListItem) => ({
      ...c,
      deliveryDate: c.deliveryDays && c.deliveryDays > 0
        ? formatDate(addDays(c.deliveryDays))
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
    resetToFirstPage()
    loadList()
  }

  const removeLocalItem = (id: number | string) => {
    customerList.value = customerList.value.filter(c => c.id !== id)
  }

  const updateLocalItem = (id: number | string, data: Partial<CustomerListItem>) => {
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
  const editingId = ref<number | string | null>(null)
  const formData = reactive<CustomerData>({ ...INITIAL_FORM })
  const { withSubmitLock } = useFormSubmit()

  const resetForm = () => {
    Object.assign(formData, INITIAL_FORM)
    editingId.value = null
  }

  const handleAdd = () => { resetForm(); dialogVisible.value = true }

  const handleEdit = (row: CustomerListItem) => {
    resetForm()
    editingId.value = row.id ?? null
    Object.assign(formData, {
      companyName: row.companyName,
      customerName: row.customerName,
      contactInfo: row.contactInfo,
      cooperationStatus: row.cooperationStatus || '未合作',
      customerType: row.customerType || '终端',
      deliveryDays: row.deliveryDays ?? null,
      shelfType: row.shelfType || '',
      remark: row.remark
    })
    dialogVisible.value = true
  }

  return {
    dialogVisible,
    editingId,
    formData,
    resetForm,
    handleAdd,
    handleEdit,
    withSubmitLock
  }
}

export const useFollowUp = () => {
  const detailVisible = ref(false)
  const currentCustomer = ref<CustomerListItem | null>(null)
  const followUpDialogVisible = ref(false)
  const followUpFormData = reactive({ content: '', nextTime: '' })
  const { withSubmitLock } = useFormSubmit()

  const handleViewDetail = async (row: CustomerListItem) => {
    currentCustomer.value = null
    detailVisible.value = true
    try {
      const res = await customerApi.getDetail(row.id!)
      currentCustomer.value = res?.customer || null
    } catch (err) {
      showError(err, '加载客户详情失败')
      detailVisible.value = false
    }
  }

  const handleDetailOpen = () => { currentCustomer.value = null }

  const showAddFollowUpDialog = () => {
    followUpFormData.content = ''
    followUpFormData.nextTime = ''
    followUpDialogVisible.value = true
  }

  const handleFollowUpSubmit = async (data: FollowUpData, onSuccess: () => void) => {
    await withSubmitLock(async () => {
      const [err] = await to(customerApi.addFollowUp(currentCustomer.value!.id!, { ...data }))
      if (err) { showError(err, '添加跟进记录失败'); throw err }
      showSuccess('跟进记录添加成功')
      followUpDialogVisible.value = false

      const [, res] = await to(customerApi.getDetail(currentCustomer.value!.id!))
      if (res?.customer) currentCustomer.value = res.customer
      onSuccess()
    })
  }

  const handleDeleteFollowUp = async (item: FollowUpData, onSuccess: () => void) => {
    const [confirmErr] = await to(ElMessageBox.confirm(
      '确定要删除这条跟进记录吗？', '删除确认',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    ))
    if (confirmErr) return

    const [err] = await to(customerApi.deleteFollowUp(item.id as number | string))
    if (err) { showError(err, '删除跟进记录失败'); return }
    showSuccess('跟进记录删除成功')

    const customerId = currentCustomer.value!.id!
    const [, res] = await to(customerApi.getDetail(customerId))
    if (res?.customer) currentCustomer.value = res.customer
    onSuccess()
  }

  return {
    detailVisible,
    currentCustomer,
    followUpDialogVisible,
    followUpFormData,
    handleViewDetail,
    handleDetailOpen,
    showAddFollowUpDialog,
    handleFollowUpSubmit,
    handleDeleteFollowUp
  }
}
