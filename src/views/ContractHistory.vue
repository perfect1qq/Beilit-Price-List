<template>
  <div class="contract-history-container">
    <el-card shadow="never">
      <template #header>
        <div class="header-tools">
          <span class="page-title">合同历史</span>
          <div class="actions">
            <SearchBar
              v-model="filters.keyword"
              placeholder="搜索公司 / 合同号..."
              style="width: 300px"
              @search="onSearch"
            />
            
            <AppButton variant="primary" @click="router.push('/contract')">新增合同</AppButton>
          </div>
        </div>
      </template>

      <div class="history-content-wrap" v-loading="loading">
        <el-empty v-if="!groupedContracts.length" :description="keyword ? '未搜索到匹配的合同' : '暂无合同记录'" />
        
        <GroupedHistoryList v-else :data="groupedContracts">
          <template #default="{ records }">
            <el-table-column prop="title" label="合同名称" min-width="200" />
            <el-table-column label="合同时间" width="120" align="center">
              <template #default="scope">
                {{ formatDateOnly(scope.row.contractDate || scope.row.createdAt) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="ownerName" label="创建人" width="120" />
            <el-table-column label="附件" min-width="150">
              <template #default="scope">
                <AttachmentList :raw="scope.row.attachments" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
              <template #default="scope">
                <AppButton variant="primary" size="small" @click="editContract(scope.row)">查看/编辑</AppButton>
                <AppButton variant="delete" size="small" @click="deleteContract(scope.row)">删除</AppButton>
              </template>
            </el-table-column>
          </template>
        </GroupedHistoryList>
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchBar from '@/components/common/SearchBar.vue'
import { formatDateOnly } from '@/utils/date'
import type { ContractData } from '@/types'
import GroupedHistoryList from '@/components/common/GroupedHistoryList.vue'
import { groupByYearAndCompany } from '@/utils/grouping'
import { useContractListQuery, useDeleteContractMutation } from '@/composables/useHistoryQueries'

const router = useRouter()
const route = useRoute()

// 列表过滤条件（响应式，传给 vue-query）
const filters = ref({
  keyword: route.query.keyword ? String(route.query.keyword) : '',
  page: 1,
  pageSize: 10000, // 一次拉取所有，用于前端分组
})

// 列表查询（自动响应 filters 变化）
const { data, isLoading: loading, isFetching } = useContractListQuery(filters)
const rawData = computed<ContractData[]>(() => data.value?.list || [])

// 删除 mutation
const deleteMutation = useDeleteContractMutation()

const groupedContracts = computed(() => {
  return groupByYearAndCompany(rawData.value, (r) => r.companyName || '未分配公司')
})

const onSearch = () => {
  filters.value = { ...filters.value, page: 1 }
}

const editContract = (row: ContractData) => {
  router.push({ path: '/contract', query: { id: row.id } })
}

const deleteContract = async (row: ContractData) => {
  try {
    await ElMessageBox.confirm('确定要删除该合同吗？', '提示', { type: 'warning' })
    await deleteMutation.mutateAsync(row.id)
    ElMessage.success('删除成功')
    // 删除后 vue-query 自动失效并重新拉取，无需手动调 fetchData
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.contract-history-container {
  padding: 20px;
}
.header-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 18px;
  font-weight: bold;
}
.actions {
  display: flex;
  gap: 12px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 折叠面板样式 */
.company-collapse {
  border: none;
  margin-top: 20px;
}

:deep(.company-collapse > .el-collapse-item) {
  border: none;
  margin-bottom: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

:deep(.company-collapse .el-collapse-item__header) {
  background-color: #f8fafc;
  font-weight: 700;
  font-size: 15px;
  height: auto !important;
  min-height: 50px;
  line-height: 1.4;
  padding: 12px 16px;
  border-bottom: none;
  color: #1e293b;
}

:deep(.company-collapse .el-collapse-item__header.is-active) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.company-collapse .el-collapse-item__wrap) {
  border: none;
  background-color: #fff;
}

:deep(.company-collapse .el-collapse-item__content) {
  padding: 16px;
}

.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.group-title-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-company {
  font-weight: 700;
  color: #1e293b;
}

:deep(.smart-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.smart-table .el-table__header th) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}
</style>

