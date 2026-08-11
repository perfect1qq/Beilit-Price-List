<template>
  <div class="contract-history-container">
    <el-card shadow="never">
      <template #header>
        <div class="header-tools">
          <span class="page-title">合同历史</span>
          <div class="actions">
            <el-input
              v-model="keyword"
              placeholder="搜索公司名称 / 合同名称..."
              clearable
              style="width: 300px"
              @input="onSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-button type="primary" @click="router.push('/contract')">新增合同</el-button>
          </div>
        </div>
      </template>

      <div class="history-content-wrap" v-loading="loading">
        <el-empty v-if="!groupedContracts.length" :description="keyword ? '未搜索到匹配的合同' : '暂无合同记录'" />
        
        <GroupedHistoryList v-else :data="groupedContracts">
          <template #default="{ records }">
            <el-table-column prop="title" label="合同名称" min-width="200" />
            <el-table-column prop="ownerName" label="创建人" width="120" />
            <el-table-column label="附件" min-width="150">
              <template #default="scope">
                <div v-if="parseAttachments(scope.row.attachments).length">
                  <div v-for="file in parseAttachments(scope.row.attachments)" :key="file.url" style="margin-bottom: 4px;">
                    <el-link type="primary" @click.prevent="handleDownload(file)" underline="never">
                      <el-icon style="margin-right: 4px"><Document /></el-icon>{{ file.name }}
                    </el-link>
                  </div>
                </div>
                <span v-else style="color: #999">无</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" plain @click="editContract(scope.row)">查看/编辑</el-button>
                <el-button type="danger" size="small" plain @click="deleteContract(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </template>
        </GroupedHistoryList>
      </div>


    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import contractApi from '@/api/contract'
import { downloadFile } from '@/utils/downloadFile'
import type { ContractData } from '@/types'
import GroupedHistoryList from '@/components/common/GroupedHistoryList.vue'
import { groupByYearAndCompany } from '@/utils/grouping'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const rawData = ref<ContractData[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10000) // Fetch all for proper grouping
const keyword = ref('')

const parseAttachments = (attachmentsStr: string) => {
  if (!attachmentsStr) return []
  try {
    return JSON.parse(attachmentsStr)
  } catch {
    return []
  }
}

const handleDownload = (file: { url: string, name: string }) => {
  downloadFile({ url: file.url, name: file.name })
}

const groupedContracts = computed(() => {
  return groupByYearAndCompany(rawData.value, (r) => r.companyName || '未分配公司')
})

let searchTimer: any = null
const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchTimer = null
    page.value = 1
    fetchData()
  }, 500)
}

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await contractApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value
    })
    rawData.value = res.list
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const editContract = (row: ContractData) => {
  router.push({ path: '/contract', query: { id: row.id } })
}

const deleteContract = async (row: ContractData) => {
  try {
    await ElMessageBox.confirm('确定要删除该合同吗？', '提示', { type: 'warning' })
    await contractApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

onMounted(() => {
  if (route.query.keyword) {
    keyword.value = String(route.query.keyword)
  }
  fetchData()
})
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
