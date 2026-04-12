<template>
  <!-- 待审批列表卡片页面 -->
  <el-card shadow="never" class="approval-card">
    <div class="head">
      <div>
        <h2>审批管理</h2>
        <p class="sub">这里展示报价单提交后的待审记录，仅管理员可处理。</p>
      </div>
      <div class="actions">
        <el-input
          v-model="searchKeyword"
          placeholder="按公司名称、名称或提交人搜索"
          clearable
          class="search-input"
          @input="onKeywordInput"
        />
        <el-button type="primary" :loading="loading" @click="loadList(1)">刷新列表</el-button>
      </div>
    </div>

    <el-table :data="list" border stripe style="width: 100%; margin-top: 16px" :header-cell-style="headerStyle" class="smart-table">
      <el-table-column prop="quotationNo" label="名称" width="180" />
      <el-table-column prop="companyName" label="公司名称" min-width="180" />
      <el-table-column prop="ownerName" label="提交人" width="120" />
      <el-table-column prop="createDate" label="创建时间" width="120" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="tagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="editDetail(row.id)">详情/修改</el-button>
          <el-button link type="success" size="small" :loading="isActionLoading(row.id)" @click="approveRow(row)">通过</el-button>
          <el-button link type="danger" size="small" :loading="isActionLoading(row.id)" @click="rejectRow(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && !list.length" description="暂无待审批记录" style="padding: 32px 0" />

    <PagePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      @page-change="loadList"
    />
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createDebounce } from '@/utils/debounce'
import { approvalApi } from '@/api/approval'
import { quotationApi } from '@/api/quotation'
import { useInstantListActions } from '@/composables/useInstantListActions'
import { useListQueryState } from '@/composables/useListQueryState'
import PagePagination from '@/components/common/PagePagination.vue'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const { keyword: searchKeyword, page, pageSize, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 10, keyword: '' })
const { isActionLoading, withActionLock, replaceById, removeById } = useInstantListActions(list)

const headerStyle = { background: '#f8fafc', color: '#475569', fontWeight: 'bold', textAlign: 'center' }
const tagType = (status) => ({ draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', deleted: 'info' }[status] || 'info')
const statusLabel = (status) => ({ draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', deleted: '已删除' }[status] || status)

const loadList = async (targetPage = page.value) => {
  try {
    loading.value = true
    const res = await approvalApi.list({
      status: 'pending',
      keyword: searchKeyword.value.trim(),
      page: targetPage,
      pageSize: pageSize.value
    })
    list.value = res.approvals || []
    total.value = Number(res.total || 0)
    page.value = Number(res.page || targetPage)
    pageSize.value = Number(res.pageSize || pageSize.value)
    void quotationApi.markAllNotificationsAsRead()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '获取审批列表失败')
  } finally {
    loading.value = false
  }
}

const onKeywordInput = createDebounce(() => {
  resetToFirstPage()
  loadList(1)
}, 300)

const editDetail = (id) => {
  router.push({ path: `/approval/${id}`, query: { mode: 'edit' } })
}

const approveRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认通过报价单「${row.companyName || row.name}」吗？`, '审批通过', { type: 'warning' })
    replaceById(row.id, { status: 'approved' })
    removeById(row.id)
    await withActionLock(row.id, async () => {
      await quotationApi.approve(row.id, '同意')
    })
    ElMessage.success('已通过')
    await loadList(page.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || error?.response?.data?.message || '审批失败')
      await loadList(page.value)
    }
  }
}

const rejectRow = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回报价单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    replaceById(row.id, { status: 'rejected' })
    removeById(row.id)
    await withActionLock(row.id, async () => {
      await quotationApi.reject(row.id, value || '拒绝')
    })
    ElMessage.success('已驳回')
    await loadList(page.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || error?.response?.data?.message || '驳回失败')
      await loadList(page.value)
    }
  }
}

onMounted(() => loadList(1))
</script>

<style scoped>
.approval-card {
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #e2e8f0;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}
.head h2 {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  border-left: 4px solid #2563eb;
  padding-left: 10px;
  margin: 0;
  line-height: 1;
}
.sub {
  color: #64748b;
  font-size: 13px;
  margin-top: 8px;
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.search-input {
  width: 300px;
}
@media (max-width: 768px) {
  .head {
    margin-bottom: 12px;
    align-items: flex-start;
  }
  .actions {
    width: 100%;
  }
  .search-input {
    width: 100%;
  }
}
</style>
