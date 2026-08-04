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
        
        <el-collapse v-else v-model="activePanels" class="company-collapse">
          <el-collapse-item v-for="group in groupedContracts" :key="group.companyName" :name="group.companyName">
            <template #title>
              <div class="group-title">
                <div class="group-title-main">
                  <span class="group-company">{{ group.companyName || '未分类' }}</span>
                  <el-tag size="small" type="primary">{{ group.records.length }} 份</el-tag>
                </div>
              </div>
            </template>

            <el-table :data="group.records" style="width: 100%;" stripe border class="smart-table">
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
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import contractApi, { type ContractData } from '@/api/contract'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const rawData = ref<ContractData[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(100) // Increase page size for better grouping
const keyword = ref('')
const activePanels = ref<string[]>([])

const parseAttachments = (attachmentsStr: string) => {
  if (!attachmentsStr) return []
  try {
    return JSON.parse(attachmentsStr)
  } catch (e) {
    return []
  }
}

const handleDownload = async (file: { url: string, name: string }) => {
  let msg: any = null
  try {
    msg = ElMessage.info({ message: `正在准备下载 ${file.name}...`, duration: 0 })
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const downloadUrl = `${baseUrl}/api/upload/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.name || 'download')}`
    
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error('Network response was not ok')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    if (msg) msg.close()
    ElMessage.success(`文件 ${file.name} 下载成功`)
  } catch (error) {
    console.error('Download failed, falling back to window.open:', error)
    if (msg) msg.close()
    ElMessage.warning(`下载可能会在后台进行或已被拦截，尝试新窗口打开...`)
    window.open(file.url, '_blank')
  }
}

const groupedContracts = computed(() => {
  const groups: Record<string, ContractData[]> = {}
  rawData.value.forEach(contract => {
    const key = contract.companyName || ''
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(contract)
  })
  
  return Object.keys(groups).map(companyName => ({
    companyName,
    records: groups[companyName]
  })).sort((a, b) => {
    if (a.companyName === '') return 1
    if (b.companyName === '') return -1
    return a.companyName.localeCompare(b.companyName)
  })
})

watch(() => groupedContracts.value, (groups) => {
  if (keyword.value.trim() !== '') {
    activePanels.value = groups.map(g => g.companyName)
  } else if (activePanels.value.length === 0 && groups.length > 0) {
    // default open first panel
    activePanels.value = [groups[0].companyName]
  }
}, { immediate: true })

let searchTimer: any = null
const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 500)
}

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
