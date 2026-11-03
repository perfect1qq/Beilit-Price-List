import { ref, reactive } from 'vue'
import { useFormSubmit } from '@/composables/useFormSubmit'
import type { CustomerListItem, CustomerCreatePayload, CustomerUpdatePayload } from '@/types'

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
  orderAmount: null,
  paidAmount: null,
  paymentStatus: '未有款项',
  orderStatus: '未下单',
  installationStatus: '待安装'
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
      orderStatus: row.orderStatus && row.orderStatus !== '未下单' ? row.orderStatus : '待排产',
      installationStatus: row.installationStatus || '待安装',
      orderCount: row.orderCount || 0,
      totalAmount: row.totalAmount || 0,
      totalPaidAmount: row.totalPaidAmount || 0,
      contractCount: (row as any).contractCount || 0,
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
