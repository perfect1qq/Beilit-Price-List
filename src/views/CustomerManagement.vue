<!--
  @file views/CustomerManagement.vue
  @description 客户管理页面（CRUD + 跟进记录 + 报价联动）
-->

<template>
  <div class="customer-management">
    <el-card shadow="never">
      <template #header>
        <CardHeader title="客户管理">
          <template #actions>
            <el-button v-if="canCreate" type="primary" :icon="Plus" @click="handleAdd">
              新增客户
            </el-button>
          </template>
        </CardHeader>
      </template>

      <div class="search-filter-row">
        <SearchBar v-model="searchKeyword" placeholder="搜索公司名称、客户姓名、联系方式" @search="handleSearch" />

        <div class="filter-group">
          <el-select v-model="filterCooperationStatus" placeholder="合作状态" clearable style="width: 130px">
            <el-option label="已合作" value="已合作" />
            <el-option label="未合作" value="未合作" />
          </el-select>

          <el-select v-model="filterCustomerType" placeholder="客户类型" clearable style="width: 130px">
            <el-option label="终端" value="终端" />
            <el-option label="经销商" value="经销商" />
            <el-option label="待确认" value="待确认" />
          </el-select>

          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="handleResetFilter">清空</el-button>
        </div>
      </div>

      <CardList :data="customerList" :loading="loading" :total="total" v-model:current-page="page"
        v-model:page-size="pageSize" :columns="2" empty-description="暂无客户数据" :empty-image-size="120"
        @page-change="() => loadList()">
        <template #card="{ item }">
          <div class="customer-card">
            <div class="card-header">
              <h3 class="company-name">{{ item.companyName }}</h3>
              <div class="tags">
                <el-tag :type="item.cooperationStatus === '已合作' ? 'success' : 'warning'" size="small">
                  {{ item.cooperationStatus || '未合作' }}
                </el-tag>
                <el-tag :type="getCustomerTypeTagType(item.customerType)" size="small">
                  {{ item.customerType || '终端' }}
                </el-tag>
              </div>
            </div>

            <div class="card-body">
              <div class="info-row">
                <span class="label">客户姓名：</span>
                <span class="value">{{ item.customerName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">联系方式：</span>
                <span class="value">{{ item.contactInfo || '-' }}</span>
              </div>

              <div v-if="item.hasQuotation" class="info-row quotation-info">
                <span class="label">报价状态：</span>
                <el-tag type="success" size="small">已报价</el-tag>
                <span v-if="item.quotationDate" class="quotation-date">{{ item.quotationDate }}</span>
              </div>
              <div v-else class="info-row quotation-info">
                <span class="label">报价状态：</span>
                <el-tag type="info" size="small" plain>未报价</el-tag>
              </div>

              <div class="info-row">
                <span class="label">备注：</span>
                <span class="value remark-text">{{ item.remark || '-' }}</span>
              </div>

              <div v-if="item.deliveryDays && item.deliveryDays > 0" class="info-row delivery-info">
                <span class="label">工期：</span>
                <span class="delivery-days-value">{{ item.deliveryDays }}天</span>
                <span class="delivery-arrow">→</span>
                <span class="delivery-date-label">预计完成：</span>
                <span class="delivery-date-value">{{ getDeliveryDate(item.deliveryDays) }}</span>
              </div>

              <div v-if="item.latestFollowUp" class="info-row follow-up-info">
                <span class="label">最新跟进：</span>
                <div class="follow-up-content">
                  <span class="follow-up-text">{{ (item.latestFollowUp as FollowUpData).content }}</span>
                  <span class="follow-up-meta">
                    <span class="follow-up-time">{{ formatDate((item.latestFollowUp as FollowUpData).createdAt as
                      string) }}</span>
                  </span>
                </div>
              </div>
              <div v-else-if="Number(item.followUpCount) > 0" class="info-row follow-up-info">
                <span class="label">跟进记录：</span>
                <el-tag size="small" type="info">{{ Number(item.followUpCount) }} 条记录</el-tag>
              </div>
            </div>

            <div class="card-footer">
              <div class="action-buttons">
                <el-button type="primary" size="small" round @click.stop="handleViewDetail(item)">详情</el-button>
                <el-button v-if="item.hasQuotation && item.quotationId" type="success" size="small" round
                  @click.stop="handleGoToQuotation(item)">查看报价单</el-button>
                <template v-if="!isGuest">
                  <el-button v-if="canEdit" type="warning" size="small" plain
                    @click.stop="handleEdit(item)">编辑</el-button>
                  <el-button v-if="canDelete" type="danger" size="small" plain
                    @click.stop="handleDelete(item)">删除</el-button>
                </template>
              </div>
            </div>
          </div>
        </template>

        <template #empty-action>
          <el-button v-if="canCreate" type="primary" @click="handleAdd">立即添加客户</el-button>
        </template>
      </CardList>
    </el-card>

    <CustomerFormDialog v-model="dialogVisible" :form-data="formData" :is-edit="editingId !== null"
      @submit="handleFormSubmit" append-to-body />

    <CustomerDetailDialog v-model="detailVisible" :customer="currentCustomer" :can-create="canCreate"
      :is-guest="isGuest" append-to-body @open="handleDetailOpen" @add-follow-up="showAddFollowUpDialog"
      @delete-follow-up="handleDeleteFollowUp" />

    <FollowUpFormDialog v-model="followUpDialogVisible" :form-data="followUpFormData" @submit="handleFollowUpSubmit"
      append-to-body />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import customerApi from '@/api/customer'
import { to } from '@/utils/async'
import { formatDate, addDays } from '@/utils/date'
import { showError, showSuccess } from '@/utils/message'
import { usePagination } from '@/composables/usePagination'
import { usePermissions } from '@/composables/usePermissions'
import { useFormSubmit } from '@/composables/useFormSubmit'
import type { CustomerData, FollowUpData } from '@/types'

interface CustomerListItem extends CustomerData {
  latestFollowUp?: FollowUpData
  followUpCount?: number
  ownerName?: string
  hasQuotation?: boolean
  quotationId?: number | string
  quotationDate?: string
}

import SearchBar from '@/components/common/SearchBar.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import CardList from '@/components/common/CardList.vue'
import CustomerFormDialog from '@/components/customer/CustomerFormDialog.vue'
import CustomerDetailDialog from '@/components/customer/CustomerDetailDialog.vue'
import FollowUpFormDialog from '@/components/customer/FollowUpFormDialog.vue'

const router = useRouter()
const { isGuest, canCreate, canEdit, canDelete } = usePermissions()
const { withSubmitLock } = useFormSubmit()

const loading = ref(false)
const customerList = shallowRef<CustomerListItem[]>([])
const searchKeyword = ref('')
const filterCooperationStatus = ref('')
const filterCustomerType = ref('')

const { page, pageSize, total, resetToFirstPage } = usePagination({
  defaultPage: 1,
  defaultPageSize: 10,
  onLoad: () => loadList()
})

const dialogVisible = ref(false)
const editingId = ref<number | string | null>(null)

const formData = reactive<CustomerData>({
  companyName: '',
  customerName: '',
  contactInfo: '',
  cooperationStatus: '未合作',
  customerType: '终端',
  deliveryDays: null,
  remark: ''
})

const detailVisible = ref(false)
const currentCustomer = ref<CustomerListItem | null>(null)

const followUpDialogVisible = ref(false)
const followUpFormData = reactive({ content: '', nextTime: '' })

const getDeliveryDate = (days: number): string => {
  if (!days || days <= 0) return ''
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDate(addDays(days - 1, tomorrow))
}

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

  customerList.value = res?.customers || []
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

const resetForm = () => {
  formData.companyName = ''
  formData.customerName = ''
  formData.contactInfo = ''
  formData.cooperationStatus = '未合作'
  formData.customerType = '终端'
  formData.deliveryDays = null
  formData.remark = ''
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
    remark: row.remark
  })
  dialogVisible.value = true
}

const handleFormSubmit = async (data: CustomerData) => {
  await withSubmitLock(async () => {
    if (editingId.value) {
      const [err] = await to(customerApi.update(editingId.value, { ...data }))
      if (err) { showError(err, '更新客户失败'); throw err }
      showSuccess('客户更新成功')
    } else {
      const [err] = await to(customerApi.create({ ...data }))
      if (err) { showError(err, '创建客户失败'); throw err }
      showSuccess('客户创建成功')
    }
    dialogVisible.value = false
    loadList()
  })
}

const handleDelete = async (row: CustomerListItem) => {
  const [confirmErr] = await to(ElMessageBox.confirm(
    `确定要删除客户"${row.companyName}"吗？此操作将同时删除所有跟进记录。`,
    '删除确认', { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
  ))
  if (confirmErr) return

  const [err] = await to(customerApi.remove(row.id!))
  if (err) { showError(err, '删除客户失败'); return }
  showSuccess('客户删除成功')
  loadList()
}

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

const handleFollowUpSubmit = async (data: FollowUpData) => {
  await withSubmitLock(async () => {
    const [err] = await to(customerApi.addFollowUp(currentCustomer.value!.id!, { ...data }))
    if (err) { showError(err, '添加跟进记录失败'); throw err }
    showSuccess('跟进记录添加成功')
    followUpDialogVisible.value = false

    const [, res] = await to(customerApi.getDetail(currentCustomer.value!.id!))
    if (res?.customer) currentCustomer.value = res.customer
    loadList()
  })
}

const handleDeleteFollowUp = async (item: FollowUpData) => {
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
  loadList()
}

const getCustomerTypeTagType = (type?: string | null) => {
  const map: Record<string, string> = { 终端: 'info', 经销商: 'primary', 待确认: 'warning' }
  return map[type || ''] || 'info'
}

const handleGoToQuotation = (item: CustomerListItem) => {
  if (item.quotationId) {
    router.push({ path: '/quotation/history', query: { id: String(item.quotationId), mode: 'view' } as Record<string, string> })
  }
}

onMounted(() => loadList())
</script>

<style scoped>
.customer-management {
  padding: 20px;
}

.search-filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.search-filter-row .search-bar {
  flex: 1;
  min-width: 300px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.customer-card .info-row .remark-text {
  color: #909399;
  font-size: 13px;
  font-style: italic;
}

.quotation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quotation-date {
  color: #67c23a;
  font-size: 13px;
  font-weight: 500;
}

.follow-up-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 4px;
}

.follow-up-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.follow-up-text {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-up-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.follow-up-time {
  color: #909399;
  font-size: 12px;
}

.delivery-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.delivery-days-value {
  color: #409eff;
  font-weight: 600;
  font-size: 13px;
}

.delivery-arrow {
  color: #409eff;
  font-weight: bold;
}

.delivery-date-label {
  color: #606266;
  font-size: 13px;
}

.delivery-date-value {
  color: #e6a23c;
  font-weight: 600;
  font-size: 13px;
}
</style>
