<template>
  <el-card shadow="never" class="approval-card">
    <template #header>
      <CardHeader title="审批管理">
        <template #actions>
          <SearchBar v-model="searchKeyword" placeholder="按公司名称、名称或提交人搜索" button-text="刷新列表" :loading="loading"
            @search="loadList(1)" />
        </template>
      </CardHeader>
    </template>

    <CardList :data="list" :loading="loading" :total="total" v-model:current-page="page" v-model:page-size="pageSize"
      :columns="2" empty-description="暂无待审批记录" @page-change="(p) => loadList(p)">
      <template #card="{ item }">
        <div class="approval-card-item">
          <div class="card-header">
            <h3 class="quotation-name">{{ item.name || item.companyName || '-' }}</h3>
            <el-tag :type="tagType(item.status)" size="small">{{ statusLabel(item.status) }}</el-tag>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="label">公司名称：</span>
              <span class="value">{{ item.companyName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">提交人：</span>
              <span class="value">{{ item.ownerName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">创建时间：</span>
              <span class="value">{{ item.createDate || '-' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <el-button type="primary" size="small" round @click.stop="editDetail(item.id)">详情</el-button>
            <el-button type="success" size="small" plain :loading="isActionLoading(item.id as string | number)"
              @click.stop="approveRow(item)">通过</el-button>
            <el-button type="danger" size="small" plain :loading="isActionLoading(item.id as string | number)"
              @click.stop="rejectRow(item)">驳回</el-button>
          </div>
        </div>
      </template>
    </CardList>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { to } from '@/utils/async'
import approvalApi from '@/api/approval'
import quotationApi from '@/api/quotation'
import { notificationApi } from '@/api/notifications'
import { useInstantListActions } from '@/composables/useInstantListActions'
import { useListQueryState } from '@/composables/useListQueryState'
import CardList from '@/components/common/CardList.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import type { QuotationData } from '@/types'
import SearchBar from '@/components/common/SearchBar.vue'
import { showError, showSuccess } from '@/utils/message'
import { DEFAULT_PAGE_SIZE } from '@/constants/table'

const router = useRouter()
const loading = ref(false)
const list = ref<QuotationData[]>([])
const total = ref(0)
const { keyword: searchKeyword, page, pageSize } = useListQueryState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, keyword: '' })
const { isActionLoading, withActionLock, replaceById, removeById } = useInstantListActions(list)

const tagType = (status: string) => ({ draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', deleted: 'info' }[status] || 'info')
const statusLabel = (status: string) => ({ draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', deleted: '已删除' }[status] || status)

const loadList = async (targetPage = page.value) => {
  loading.value = true
  const [err, res] = await to(approvalApi.list({
    status: 'pending',
    keyword: searchKeyword.value.trim(),
    page: targetPage,
    pageSize: pageSize.value
  }))
  if (err || !res) {
    showError(err, '获取审批列表失败')
    loading.value = false
    return
  }
  list.value = res.list || []
  total.value = Number(res.total || 0)
  page.value = Number(res.page || targetPage)
  pageSize.value = Number(res.pageSize || pageSize.value)
  void notificationApi.markAllAsRead()
  loading.value = false
}

const editDetail = (id: number | string) => {
  router.push({ path: `/approval/${id}`, query: { mode: 'edit' } })
}

const approveRow = async (row: QuotationData) => {
  const [confirmErr] = await to(ElMessageBox.confirm(`确认通过报价单「${row.companyName || row.name}」吗？`, '审批通过', { type: 'warning' }))
  if (confirmErr) return

  replaceById(row.id, { status: 'approved' })
  removeById(row.id)
  const [apiErr] = await to(withActionLock(row.id, async () => {
    await quotationApi.approve(row.id, '同意')
  }))
  if (apiErr) {
    showError(apiErr, '审批失败')
    await loadList(page.value)
    return
  }
  showSuccess('已通过')
  await loadList(page.value)
}

const rejectRow = async (row: QuotationData) => {
  const [promptErr, promptRes] = await to(ElMessageBox.prompt('请输入驳回原因', '驳回报价单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }))
  if (promptErr) return

  replaceById(row.id, { status: 'rejected' })
  removeById(row.id)
  const [apiErr] = await to(withActionLock(row.id, async () => {
    await quotationApi.reject(row.id, promptRes?.value || '拒绝')
  }))
  if (apiErr) {
    showError(apiErr, '驳回失败')
    await loadList(page.value)
    return
  }
  showSuccess('已驳回')
  await loadList(page.value)
}

onMounted(() => loadList(1))
</script>

<style scoped>
.approval-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.approval-card-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.approval-card-item .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.approval-card-item .quotation-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  flex: 1;
  margin-right: 12px;
  word-break: break-all;
}

.approval-card-item .card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.approval-card-item .info-row {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.6;
}

.approval-card-item .info-row .label {
  color: #909399;
  white-space: nowrap;
  min-width: 100px;
  font-weight: 500;
}

.approval-card-item .info-row .value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

.approval-card-item .card-footer {
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
