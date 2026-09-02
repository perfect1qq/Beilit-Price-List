<template>
  <el-drawer
    v-model="visible"
    title="客户 360° 全景管家"
    size="85%"
    :destroy-on-close="true"
    class="customer-360-drawer"
  >
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="!customer" class="empty-state">
      <el-empty description="无法加载客户信息" />
    </div>
    <div v-else class="drawer-content">
      <!-- Top Dashboard -->
      <div class="dashboard-header">
        <div class="dash-avatar">
          {{ (customer.companyName || customer.customerName || '?').substring(0, 1) }}
        </div>
        <div class="dash-info">
          <h2>{{ customer.companyName || customer.customerName }}</h2>
          <p>
            联系人: <strong>{{ customer.customerName }}</strong> | 
            电话: <strong>{{ customer.contactInfo || '-' }}</strong> | 
            类型: <strong>{{ customer.customerType || '-' }}</strong>
          </p>
        </div>
        <div class="dash-stats">
          <div class="stat-box">
            <div class="lbl">累计合作总额</div>
            <div class="val">¥{{ (customer.totalAmount || 0).toLocaleString() }}</div>
          </div>
          <div class="stat-box" :class="{ danger: (customer.totalAmount || 0) > (customer.totalPaidAmount || 0) }">
            <div class="lbl">当前欠款</div>
            <div class="val">¥{{ Math.max(0, (customer.totalAmount || 0) - (customer.totalPaidAmount || 0)).toLocaleString() }}</div>
          </div>
        </div>
        <div class="dash-actions" style="display: flex; flex-direction: column; gap: 8px; margin-left: 20px; padding-left: 20px; border-left: 1px solid var(--border-color);">
          <AppButton type="primary" plain size="small" @click="$emit('invoice', customer)">开票信息</AppButton>
          <AppButton plain size="small" @click="$emit('edit', customer)">编 辑</AppButton>
        </div>
      </div>

      <!-- Tabs Section -->
      <el-tabs v-model="activeTab" class="dashboard-tabs" type="border-card">
        
        <el-tab-pane label="业务跟进记录" name="overview">
          <div class="tab-content-scroll">
            <div class="section-block">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <h4>业务跟进记录</h4>
                <AppButton type="success" size="small" @click="showFollowUpDialog = true">+ 记录跟进</AppButton>
              </div>
              <el-timeline v-if="customer.followUps && customer.followUps.length">
                <el-timeline-item 
                  v-for="log in customer.followUps" 
                  :key="log.id"
                  :timestamp="new Date(log.createdAt).toLocaleString()"
                  placement="top"
                >
                  <el-card shadow="hover">
                    <p>{{ log.content }}</p>
                    <small v-if="log.nextTime" style="color: #e6a23c;">下次跟进计划：{{ new Date(log.nextTime).toLocaleDateString() }}</small>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无跟进记录" :image-size="60" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史报价单" name="quotes">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; text-align: right;">
              <AppButton type="primary" size="small" label="跳转至新增报价单" @click="goCreateQuotation" />
            </div>
            <el-table :data="quotes" border style="width: 100%" stripe>
              <el-table-column prop="name" label="报价单名称" min-width="180">
                <template #default="{ row }">
                  <span style="font-weight: bold;">{{ row.name || row.companyName || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="finalPrice" label="成交总额(元)" width="150" align="center">
                <template #default="{ row }">
                  <span style="color: #f56c6c; font-weight: bold;">¥ {{ Number(row.finalPrice || 0).toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="ownerName" label="提交人" width="120" align="center" />
              <el-table-column prop="createDate" label="创建时间" width="160" align="center" />
              <el-table-column prop="status" label="状态" width="120" align="center">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'approved' ? 'success' : (scope.row.status === 'rejected' ? 'danger' : 'warning')">
                    {{ scope.row.status === 'approved' ? '已通过' : (scope.row.status === 'rejected' ? '已拒绝' : '草稿/待定') }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="quotes.length === 0" description="该客户暂未生成报价单" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="车间下单记录" name="orders">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; text-align: right;">
              <AppButton type="primary" size="small" @click="goCreateOrder">
                跳转至新增下单
              </AppButton>
            </div>
            <el-table :data="orders" border style="width: 100%" stripe>
              <el-table-column prop="name" label="下单名称" min-width="180">
                <template #default="{ row }">
                  <span style="font-weight: bold;">{{ row.name || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="deliveryAddress" label="交货地址" min-width="180" show-overflow-tooltip />
              <el-table-column prop="orderDate" label="下单日期" width="140" align="center" />
              <el-table-column prop="ownerName" label="业务员" width="120" align="center" />
            </el-table>
            <el-empty v-if="orders.length === 0" description="该客户暂无真实车间下单记录" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="正式合同与账款" name="contracts">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; text-align: right;">
              <AppButton type="primary" size="small" label="跳转至新增合同" @click="goCreateContract" />
            </div>
            <el-table :data="contracts" border style="width: 100%" stripe>
              <el-table-column prop="title" label="合同标题" min-width="200" />
              <el-table-column prop="amount" label="合同确定总额(元)" width="180" align="center">
                <template #default="scope">
                  <strong style="color: #f56c6c;">¥ {{ Number(scope.row.amount || 0).toLocaleString() }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="contractDate" label="合同时间" width="140" align="center">
                <template #default="scope">{{ scope.row.contractDate ? new Date(scope.row.contractDate).toLocaleDateString() : (scope.row.createdAt ? new Date(scope.row.createdAt).toLocaleDateString() : '-') }}</template>
              </el-table-column>
              <el-table-column prop="ownerName" label="录入人" width="120" align="center" />
            </el-table>
            <el-empty v-if="contracts.length === 0" description="该客户暂未签订正式合同" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="财务记账与回款" name="finance">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
              <h4 style="margin: 0; padding-left: 10px; border-left: 4px solid var(--el-color-primary);">财务账单与收款明细</h4>
              <AppButton variant="add" label="新增交易账单" size="small" @click="openFinanceAddDialog" />
            </div>
            <el-table :data="customer.orders || []" border style="width: 100%" stripe>

              <AutoFitColumn :data="customer.orders || []" prop="orderName" label="账单/订单名称" :min="150" :max="400">
                <template #default="{ row }">
                  <span style="font-weight: bold;">{{ row.orderName }}</span>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="customer.orders || []" prop="orderAmount" label="账单总额(元)" :min="130" :max="200" align="center">
                <template #default="{ row }">¥ {{ Number(row.orderAmount || 0).toLocaleString() }}</template>
              </AutoFitColumn>
              <AutoFitColumn :data="customer.orders || []" prop="paidAmount" label="已收金额(元)" :min="130" :max="200" align="center">
                <template #default="{ row }">¥ {{ Number(row.paidAmount || 0).toLocaleString() }}</template>
              </AutoFitColumn>
              <AutoFitColumn :data="customer.orders || []" label="当前欠款(元)" :min="130" :max="200" align="center">
                <template #default="{ row }">
                  <strong style="color: #f56c6c;">¥ {{ Math.max(0, (row.orderAmount || 0) - (row.paidAmount || 0)).toLocaleString() }}</strong>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="customer.orders || []" prop="paymentStatus" label="结款状态" :min="120" :max="180" align="center">
                <template #default="scope">
                  <el-tag :type="getPaymentStatusInfo(scope.row).type">
                    {{ getPaymentStatusInfo(scope.row).label }}
                  </el-tag>
                </template>
              </AutoFitColumn>
              <el-table-column label="操作" min-width="160" align="center">
                <template #default="scope">
                  <ActionButtons
                    :actions="getFinanceActions(scope.row)"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!(customer.orders && customer.orders.length)" description="该客户暂无交易账单记录" :image-size="60" />
          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- Dialogs -->
    <el-dialog v-model="showFollowUpDialog" title="写跟进记录" width="500px" append-to-body>
      <el-form :model="followUpForm" label-width="80px" label-position="top">
        <el-form-item label="跟进详情"><el-input type="textarea" v-model="followUpForm.content" rows="3" /></el-form-item>
        <el-form-item label="下次跟进计划(可选)"><el-date-picker v-model="followUpForm.nextTime" type="date" value-format="YYYY-MM-DD" placeholder="选择下次联系时间" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <FormButtons submit-text="保存" @cancel="showFollowUpDialog = false" @submit="submitFollowUp" />
      </template>
    </el-dialog>

    <el-dialog v-model="showFinanceDialog" :title="editingFinanceId ? '登记回款与更新状态' : '新增交易账单'" width="650px" append-to-body>
      <el-form :model="financeForm" label-width="120px">
        <el-form-item label="账单/订单名称">
          <el-input v-model="financeForm.orderName" placeholder="如：第一笔订单、二期工程..." />
        </el-form-item>
        <el-form-item label="账单总额(元)">
          <el-input-number v-model="financeForm.orderAmount" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="已收金额(元)">
          <el-input-number v-model="financeForm.paidAmount" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="当前欠款(元)">
          <span style="color: #f56c6c; font-weight: bold;">
            ¥ {{ Math.max(0, (Number(financeForm.orderAmount) || 0) - (Number(financeForm.paidAmount) || 0)).toLocaleString() }}
          </span>
        </el-form-item>
        <el-form-item label="结款状态">
          <el-tag :type="computedFinanceStatus.type" disable-transitions size="large">
            {{ computedFinanceStatus.label }}
          </el-tag>
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">根据欠款自动判定</span>
        </el-form-item>
      </el-form>
      
      <!-- 回款记录模块 -->
      <div v-if="editingFinanceId" style="margin-top: 25px; border-top: 1px solid #ebeef5; padding-top: 20px;">
        <h4 style="margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid var(--el-color-primary); color: #303133;">分批次回款记录</h4>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <el-row :gutter="12" align="middle">
            <el-col :span="8">
              <el-input-number v-model="paymentForm.amount" :min="0" style="width: 100%" :controls="false" placeholder="输入金额(元)" />
            </el-col>
            <el-col :span="12">
              <el-input v-model="paymentForm.remark" placeholder="添加备注（选填）" style="width: 100%" />
            </el-col>
            <el-col :span="4">
              <AppButton type="primary" style="width: 100%" @click="submitPayment" :loading="submittingPayment">记录</AppButton>
            </el-col>
          </el-row>
        </div>

        <el-table :data="currentOrderForPayment?.payments || []" border size="small" style="width: 100%" max-height="250">
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" prop="createdAt" label="回款时间" :min="140" :max="200" align="center">
            <template #default="{ row }">
              <span style="color: #606266;">{{ new Date(row.createdAt).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) }}</span>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" prop="amount" label="金额(元)" :min="100" :max="150" align="center">
            <template #default="{ row }">
              <span style="color: #67c23a; font-weight: bold; font-family: monospace; font-size: 13px;">{{ row.amount.toLocaleString() }}</span>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" prop="remark" label="备注" :min="120" :max="300" align="center" show-overflow-tooltip />
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" label="操作" :min="90" align="center">
            <template #default="{ row }">
              <AppButton variant="delete" type="danger" link @click="deletePaymentRecord(row.id)">删除</AppButton>
            </template>
          </AutoFitColumn>
          <template #empty>
            <span style="color: #909399; font-size: 13px;">暂无回款记录</span>
          </template>
        </el-table>
      </div>

      <template #footer>
        <FormButtons submit-text="保存账单基础信息" @cancel="showFinanceDialog = false" @submit="submitFinance" />
      </template>
    </el-dialog>

  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import quotationApi from '@/api/quotation'
import contractApi from '@/api/contract'
import orderApi from '@/api/order'
import {
  useCustomerDetailQuery,
  useAddFollowUpMutation,
  useAddOrderMutation,
  useUpdateOrderMutation,
  useDeleteCustomerOrderMutation,
  useAddPaymentMutation,
  useDeletePaymentMutation,
} from '@/composables/useCustomerQueries'
import AppButton from '@/components/common/AppButton.vue'
import AutoFitColumn from '@/components/common/AutoFitColumn.vue'
import ActionButtons from '@/components/common/ActionButtons.vue'
import FormButtons from '@/components/common/FormButtons.vue'

const props = defineProps<{
  modelValue: boolean
  customerId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'data-changed'): void
  (e: 'edit', customer: any): void
  (e: 'invoice', customer: any): void
}>()

const router = useRouter()

const visible = ref(false)
const activeTab = ref('overview')

// ---- 客户详情：用 vue-query 自动加载，修改后自动刷新 ----
const customerIdRef = toRef(props, 'customerId')
const { data: customer, isLoading: loading, refetch: refetchCustomer } = useCustomerDetailQuery(customerIdRef)

const quotes = ref<any[]>([])
const contracts = ref<any[]>([])
const orders = ref<any[]>([])

// Dialog forms
const showFollowUpDialog = ref(false)
const showFinanceDialog = ref(false)
const editingFinanceId = ref<number | null>(null)

const followUpForm = ref({ content: '', nextTime: '' })
const financeForm = ref({ orderName: '', orderAmount: 0, paidAmount: 0, paymentStatus: '待结款', orderStatus: '已下单' })

/**
 * 根据账单总额与已收金额自动计算结款状态
 * - 无账单金额 → 待结款
 * - 已收金额 >= 账单总额 → 已结清
 * - 仍有欠款 → 待催款
 */
const computePaymentStatus = (orderAmount: number | null | undefined, paidAmount: number | null | undefined): string => {
  const total = Number(orderAmount) || 0
  const paid = Number(paidAmount) || 0
  if (total <= 0) return '待结款'
  if (paid >= total) return '已结清'
  return '待催款'
}

// 对话框中实时计算的结款状态
const computedFinanceStatus = computed(() => {
  const status = computePaymentStatus(financeForm.value.orderAmount, financeForm.value.paidAmount)
  const typeMap: Record<string, 'success' | 'danger' | 'warning'> = {
    '已结清': 'success',
    '待催款': 'danger',
    '待结款': 'warning',
  }
  return { label: status, type: typeMap[status] || 'warning' }
})

// 表格中根据订单数据动态计算结款状态（不依赖后端存储值，确保旧数据也能正确显示）
const getPaymentStatusInfo = (row: { orderAmount?: number | null; paidAmount?: number | null }) => {
  const status = computePaymentStatus(row.orderAmount, row.paidAmount)
  const typeMap: Record<string, 'success' | 'danger' | 'warning'> = {
    '已结清': 'success',
    '待催款': 'danger',
    '待结款': 'warning',
  }
  return { label: status, type: typeMap[status] || 'warning' }
}

// 监听金额变化，自动同步结款状态到表单（提交时使用）
watch(
  () => [financeForm.value.orderAmount, financeForm.value.paidAmount],
  ([orderAmount, paidAmount]) => {
    financeForm.value.paymentStatus = computePaymentStatus(orderAmount, paidAmount)
  }
)

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
  if (!newVal) {
    activeTab.value = 'overview'
  }
})

// 客户详情变化时加载关联的报价单/合同/订单
watch(customer, async (c) => {
  if (!c) {
    quotes.value = []
    contracts.value = []
    orders.value = []
    return
  }
  const companyName = c.companyName || c.customerName || ''
  if (!companyName) return

  try {
    const [qRes, cRes, oRes] = await Promise.all([
      quotationApi.list({ keyword: companyName, page: 1, pageSize: 100 }),
      contractApi.list({ keyword: companyName, page: 1, pageSize: 100 }),
      orderApi.list({ keyword: companyName, page: 1, pageSize: 100 }),
    ])
    quotes.value = qRes?.list || []
    contracts.value = cRes?.list || []
    orders.value = oRes?.list || []
  } catch (e) {
    console.error('加载关联数据失败', e)
  }
}, { immediate: true })

const goCreateQuotation = () => {
  if (!customer.value) return
  visible.value = false
  router.push({
    path: '/quotation',
    query: { companyName: customer.value.companyName || customer.value.customerName }
  })
}

const goCreateOrder = () => {
  if (!customer.value) return
  visible.value = false
  router.push({
    path: '/order',
    query: { customerName: customer.value.companyName || customer.value.customerName }
  })
}

const goCreateContract = () => {
  if (!customer.value) return
  visible.value = false
  router.push({
    path: '/contract',
    query: { companyName: customer.value.companyName || customer.value.customerName }
  })
}

// ---- mutations ----
const addFollowUpMutation = useAddFollowUpMutation()
const addOrderMutation = useAddOrderMutation()
const updateOrderMutation = useUpdateOrderMutation()
const deleteOrderMutation = useDeleteCustomerOrderMutation()

const submitFollowUp = async () => {
  if (!props.customerId) return
  try {
    await addFollowUpMutation.mutateAsync({
      customerId: props.customerId,
      data: { ...followUpForm.value },
    })
    ElMessage.success('跟进记录添加成功')
    showFollowUpDialog.value = false
    followUpForm.value = { content: '', nextTime: '' }
    // mutation 的 onSuccess 已 invalidate ['customer', id] 和 ['customers']，
    // 客户详情会自动刷新，客户管理列表也会自动更新
    emit('data-changed')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.message || ''))
  }
}

const openFinanceAddDialog = () => {
  editingFinanceId.value = null
  financeForm.value = { orderName: '', orderAmount: 0, paidAmount: 0, paymentStatus: '待结款', orderStatus: '已下单' }
  showFinanceDialog.value = true
}

// 合同同步生成的账单（contractId 非空）不允许在此删除，需通过删除对应合同来移除
const getFinanceActions = (row: any) => {
  const actions = [
    { key: 'edit', variant: 'edit' as const, label: '编辑账单', onClick: () => openFinanceEditDialog(row) },
  ]
  if (!row.contractId) {
    actions.push({ key: 'delete', variant: 'delete' as const, label: '删除', onClick: () => handleDeleteFinance(row) })
  }
  return actions
}

const addPaymentMutation = useAddPaymentMutation()
const deletePaymentMutation = useDeletePaymentMutation()

const currentOrderForPayment = ref<any>(null)
const paymentForm = ref({ amount: 0, remark: '' })
const submittingPayment = ref(false)

watch(() => customer.value?.orders, (newOrders) => {
  if (editingFinanceId.value && currentOrderForPayment.value) {
    const updated = newOrders?.find((o: any) => o.id === currentOrderForPayment.value.id)
    if (updated) {
      currentOrderForPayment.value = updated
      // Sync the paid amount to the edit form as well
      financeForm.value.paidAmount = updated.paidAmount || 0
      financeForm.value.paymentStatus = computePaymentStatus(updated.orderAmount, updated.paidAmount)
    }
  }
}, { deep: true })

const submitPayment = async () => {
  if (!currentOrderForPayment.value || !props.customerId) return
  if (paymentForm.value.amount <= 0) {
    ElMessage.warning('回款金额必须大于 0')
    return
  }
  const customerArrears = Math.max(0, (customer.value?.totalAmount || 0) - (customer.value?.totalPaidAmount || 0));
  if (paymentForm.value.amount > customerArrears) {
    ElMessage.warning(`回款金额不能超过该客户的总欠款金额 (最多还能登记: ¥${customerArrears})`)
    return
  }
  submittingPayment.value = true
  try {
    await addPaymentMutation.mutateAsync({
      orderId: currentOrderForPayment.value.id,
      data: { ...paymentForm.value },
      customerId: props.customerId
    })
    ElMessage.success('收款记录添加成功')
    paymentForm.value = { amount: 0, remark: '' }
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || e.message || '保存失败')
  } finally {
    submittingPayment.value = false
  }
}

const deletePaymentRecord = async (paymentId: number) => {
  if (!props.customerId) return
  try {
    await ElMessageBox.confirm('确定要删除这条收款记录吗？', '提示', { type: 'warning' })
    await deletePaymentMutation.mutateAsync({ paymentId, customerId: props.customerId })
    ElMessage.success('收款记录删除成功')
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.message || e.message || '删除失败')
  }
}

const openFinanceEditDialog = (row: any) => {
  editingFinanceId.value = row.id
  currentOrderForPayment.value = row
  paymentForm.value = { amount: 0, remark: '' }
  financeForm.value = {
    orderName: row.orderName || '',
    orderAmount: row.orderAmount || 0,
    paidAmount: row.paidAmount || 0,
    paymentStatus: computePaymentStatus(row.orderAmount, row.paidAmount),
    orderStatus: row.orderStatus || '已下单'
  }
  showFinanceDialog.value = true
}

const submitFinance = async () => {
  if (!props.customerId) return

  const originalPaidAmount = currentOrderForPayment.value?.paidAmount || 0;
  const increase = financeForm.value.paidAmount - originalPaidAmount;
  const customerArrears = Math.max(0, (customer.value?.totalAmount || 0) - (customer.value?.totalPaidAmount || 0));

  if (increase > customerArrears) {
    ElMessage.warning(`已收金额的新增量不能超过该客户的总欠款 (最多还能增加: ¥${customerArrears})`)
    return
  }
  
  // 提交前强制重新计算结款状态
  financeForm.value.paymentStatus = computePaymentStatus(financeForm.value.orderAmount, financeForm.value.paidAmount)
  try {
    if (editingFinanceId.value) {
      await updateOrderMutation.mutateAsync({
        orderId: editingFinanceId.value,
        data: {
          orderName: financeForm.value.orderName,
          orderAmount: financeForm.value.orderAmount,
          paidAmount: financeForm.value.paidAmount,
          paymentStatus: financeForm.value.paymentStatus
        },
        customerId: props.customerId,
      })
      ElMessage.success('回款记录更新成功')
    } else {
      await addOrderMutation.mutateAsync({
        customerId: props.customerId,
        data: { ...financeForm.value },
      })
      ElMessage.success('交易账单新建成功')
    }
    showFinanceDialog.value = false
    emit('data-changed')
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message || '保存失败'
    ElMessage.error('保存失败: ' + errorMsg)
  }
}

const handleDeleteFinance = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条账单记录吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    await deleteOrderMutation.mutateAsync({ orderId: row.id, customerId: props.customerId })
    ElMessage.success('账单删除成功')
    emit('data-changed')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || e.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.customer-360-drawer :deep(.el-drawer__body) {
  padding: 0;
  background-color: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.drawer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-state, .empty-state { display: flex; justify-content: center; align-items: center; height: 100%; padding: 40px; }

/* Dashboard Header */
.dashboard-header { display: flex; gap: 20px; align-items: center; padding: 25px 30px; background: var(--bg-card); border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.dash-avatar { width: 64px; height: 64px; background: var(--el-color-primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; }
.dash-info { flex: 1; }
.dash-info h2 { margin: 0 0 8px; font-size: 22px; color: var(--text-primary); }
.dash-info p { margin: 0; color: var(--text-secondary); font-size: 14px; }
.dash-stats { display: flex; gap: 40px; }
.stat-box { text-align: right; }
.stat-box .lbl { font-size: 13px; color: var(--text-secondary); margin-bottom: 5px; }
.stat-box .val { font-size: 24px; font-weight: bold; color: var(--text-primary); }
.stat-box.danger .val { color: #f56c6c; }

/* Tabs */
.dashboard-tabs { flex: 1; border: none; box-shadow: none; display: flex; flex-direction: column; }
:deep(.el-tabs__header) { margin: 0; background: var(--bg-card); }
:deep(.el-tabs__content) { flex: 1; padding: 0; overflow: hidden; background: var(--bg-card); }
:deep(.el-tab-pane) { height: 100%; }
.tab-content-scroll { height: 100%; padding: 20px 30px; overflow-y: auto; box-sizing: border-box; }
.section-block h4 { margin-top: 0; margin-bottom: 0; padding-left: 10px; border-left: 4px solid var(--el-color-primary); font-size: 16px; color: var(--text-primary); }
.mt-20 { margin-top: 30px; }

:deep(.el-table) {
  margin-top: 10px;
}
:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #333;
}
</style>
