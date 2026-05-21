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
        <SearchBar v-model="searchKeyword" placeholder="搜索公司名称、客户姓名、联系方式、货架类型" @search="handleSearch" />

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
              <div class="info-row two-col">
                <div class="col-item">
                  <span class="label">客户姓名：</span>
                  <span class="value">{{ item.customerName || '-' }}</span>
                </div>
                <div class="col-item">
                  <span class="label">联系方式：</span>
                  <span class="value">{{ item.contactInfo || '-' }}</span>
                </div>
              </div>

              <div class="info-row two-col">
                <div class="col-item">
                  <span class="label">货架类型：</span>
                  <span class="value">{{ item.shelfType || '-' }}</span>
                </div>
                <div class="col-item quotation-info">
                  <span class="label">报价状态：</span>
                  <el-tag v-if="item.hasQuotation" type="success" size="small">已报价</el-tag>
                  <el-tag v-else type="info" size="small" plain>未报价</el-tag>
                  <!-- <span v-if="item.quotationDate" class="quotation-date">{{ item.quotationDate }}</span> -->
                </div>
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
                <span class="delivery-date-value">{{ item.deliveryDate }}</span>
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
                <el-button type="primary" size="small" round
                  @click.stop="handleViewDetail(item as CustomerListItem)">详情</el-button>
                <el-button v-if="item.hasQuotation && item.quotationId" type="success" size="small" round
                  @click.stop="handleGoToQuotation(item as CustomerListItem)">查看报价单</el-button>
                <template v-if="!isGuest">
                  <el-button v-if="canEdit" type="warning" size="small" plain
                    @click.stop="handleEdit(item as CustomerListItem)">编辑</el-button>
                  <el-button v-if="canDelete" type="danger" size="small" plain
                    @click.stop="handleDelete(item as CustomerListItem)">删除</el-button>
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
      @delete-follow-up="(item: FollowUpData) => handleDeleteFollowUp(item, loadList)" />

    <FollowUpFormDialog v-model="followUpDialogVisible" :form-data="followUpFormData"
      @submit="(data: FollowUpData) => handleFollowUpSubmit(data, loadList)" append-to-body />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import customerApi from '@/api/customer'
import { to } from '@/utils/async'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/message'
import { usePermissions } from '@/composables/usePermissions'
import { useCustomerList, useCustomerForm, useFollowUp } from '@/composables/useCustomer'
import type { CustomerData, FollowUpData } from '@/types'
import type { CustomerListItem } from '@/composables/useCustomer'

import SearchBar from '@/components/common/SearchBar.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import CardList from '@/components/common/CardList.vue'
import CustomerFormDialog from '@/components/customer/CustomerFormDialog.vue'
import CustomerDetailDialog from '@/components/customer/CustomerDetailDialog.vue'
import FollowUpFormDialog from '@/components/customer/FollowUpFormDialog.vue'

const router = useRouter()
const { isGuest, canCreate, canEdit, canDelete } = usePermissions()

const {
  loading, customerList, searchKeyword, filterCooperationStatus, filterCustomerType,
  page, pageSize, total, loadList, handleSearch, handleResetFilter, updateLocalItem
} = useCustomerList()

const {
  dialogVisible, editingId, formData, handleAdd, handleEdit, withSubmitLock
} = useCustomerForm()

const {
  detailVisible, currentCustomer, followUpDialogVisible, followUpFormData,
  handleViewDetail, handleDetailOpen, showAddFollowUpDialog,
  handleFollowUpSubmit, handleDeleteFollowUp
} = useFollowUp()

const handleFormSubmit = async (data: CustomerData) => {
  await withSubmitLock(async () => {
    if (editingId.value) {
      const [err, res] = await to(customerApi.update(editingId.value, { ...data }))
      if (err) { showError(err, '更新客户失败'); throw err }
      if (res?.customer) {
        updateLocalItem(editingId.value as number, res.customer)
      } else {
        loadList()
      }
      showSuccess('客户更新成功')
    } else {
      const [err] = await to(customerApi.create({ ...data }))
      if (err) { showError(err, '创建客户失败'); throw err }
      showSuccess('客户创建成功')
      loadList()
    }
    dialogVisible.value = false
  })
}

const handleDelete = async (row: { id?: number | string; companyName: string }) => {
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

const getCustomerTypeTagType = (type?: string | null) => {
  const map: Record<string, string> = { 终端: 'info', 经销商: 'primary', 待确认: 'warning' }
  return map[type || ''] || 'info'
}

const handleGoToQuotation = (item: { quotationId?: number | string }) => {
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

.two-col {
  display: flex !important;
  align-items: flex-start;
  gap: 20px;
}

.two-col .col-item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.two-col .quotation-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
