<template>
  <div class="beam-quotation-history-container">
    <div v-if="viewState === 'list'" class="history-list-view">
      <el-card shadow="never" class="history-card" v-loading="loading">
        <template #header>
          <CardHeader title="横梁载重单历史">
            <template #actions>
              <SearchBar v-model="searchKeyword" placeholder="按横梁名称模糊搜索" @search="handleSearch" />
            </template>
          </CardHeader>
        </template>

        <el-table :data="historyList" stripe border style="width: 100%" :header-cell-style="TABLE_HEADER_STYLE"
          class="smart-table">
          <el-table-column label="时间" width="105" align="center">
            <template #default="{ row }">{{ formatDate(row.createdAt || row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column prop="name" label="横梁名称" min-width="140" show-overflow-tooltip align="center" />
          <el-table-column label="长度(mm)" align="center">
            <template #default="{ row }">{{ getFirstItemValue(row, 'length') }}</template>
          </el-table-column>
          <el-table-column label="规格(mm)" min-width="150" show-overflow-tooltip align="center">
            <template #default="{ row }">{{ getFirstItemValue(row, 'spec') }}</template>
          </el-table-column>
          <el-table-column label="最大载重(kg)" align="center">
            <template #default="{ row }">{{ getFirstItemValue(row, 'maxLoad') }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-btns">
                <template v-if="!isGuest">
                  <el-button type="warning" size="small" plain :loading="isActionLoading(row.id)"
                    @click="enterDetail(row, 'edit')">修改</el-button>
                  <el-button v-if="isAdmin" type="danger" size="small" plain :loading="isActionLoading(row.id)"
                    @click="handleDelete(row)">删除</el-button>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!historyList.length" description="暂无数据" />

        <div class="pager-wrap">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]"
            :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>

    <BeamQuotationEditor v-else :mode="viewState" :form-model="formModel" :items="editingItems" @back="backToList"
      @update="handleUpdate" @add-row="addRow" @remove-row="removeRow" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
defineOptions({ name: 'BeamQuotationHistory' })
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { usePermissions } from '@/composables/usePermissions'
import { useHistoryView } from '@/composables/useHistoryView'
import { formatDate } from '@/utils/date'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import beamApi from '@/api/beam'
import type { BeamQuotationItem } from '@/types'
import SearchBar from '@/components/common/SearchBar.vue'
import CardHeader from '@/components/common/CardHeader.vue'
import BeamQuotationEditor from '@/components/beam/BeamQuotationEditor.vue'

const { isGuest, isAdmin } = usePermissions()

const editingId = ref<number | string | null>(null)
const editingName = ref('')
const editingItems = ref<BeamQuotationItem[]>([])
const originalDataStr = ref('')
const formModel = reactive<{ recordName: string; editingItems: BeamQuotationItem[]; items?: BeamQuotationItem[] }>({ recordName: '', editingItems: editingItems.value })

watch(editingName, (val) => { formModel.recordName = val })

watch(editingItems, (val) => { formModel.editingItems = val }, { deep: true })

const {
  viewState, historyList, loading, page, pageSize, total, searchKeyword,
  isActionLoading, withActionLock, replaceById,
  loadList, handleCurrentChange, handleSizeChange, handleSearch, backToList, handleDelete
} = useHistoryView({
  api: beamApi,
  fetchList: async (targetPage) => {
    const [err, res] = await to(beamApi.list({
      page: targetPage, pageSize: pageSize.value, keyword: searchKeyword.value.trim()
    }))
    if (err) throw err
    return res ?? { list: [], total: 0, page: targetPage, pageSize: pageSize.value }
  }
})

const enterDetail = (row: Record<string, unknown>, mode: string) => {
  editingId.value = row.id as number | string
  editingName.value = row.name as string
  try {
    const parsed = typeof row.items === 'string' ? JSON.parse(row.items) : JSON.parse(JSON.stringify(row.items || []))
    const items = Array.isArray(parsed) ? parsed : []
    editingItems.value = items
    formModel.recordName = row.name as string
    formModel.items = items
    originalDataStr.value = JSON.stringify({ name: row.name, items })
  } catch {
    editingItems.value = []
    formModel.recordName = row.name as string
    formModel.items = []
    originalDataStr.value = JSON.stringify({ name: row.name, items: [] })
  }
  viewState.value = mode
}

const addRow = () => editingItems.value.push({ name: '', length: '', spec: '', maxLoad: '' })

const removeRow = (index: number) => {
  if (editingItems.value.length <= 1) return showWarning('至少需要保留一行数据，无法继续删除！')
  editingItems.value.splice(index, 1)
}

const handleUpdate = async () => {
  const currentName = formModel.recordName
  const currentDataStr = JSON.stringify({ name: currentName, items: editingItems.value })
  if (currentDataStr === originalDataStr.value) return showWarning('您没有修改任何数据，无需提交修改。')

  replaceById(editingId.value as number | string, { name: currentName, items: JSON.parse(JSON.stringify(editingItems.value)) })
  const [err] = await to(withActionLock(editingId.value as number | string, async () => {
    await beamApi.update(editingId.value as number | string, { name: currentName, items: editingItems.value })
  }))
  if (err) {
    await loadList(page.value)
    showError('历史记录里面有相同的横梁名称')
    return
  }
  showSuccess('修改成功！')
  backToList()
}

const getFirstItemValue = (row: Record<string, unknown>, f: string) => {
  try {
    const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    return items?.[0]?.[f] || '-'
  } catch { return '-' }
}

onMounted(() => loadList(1))
</script>

<style scoped>
.beam-quotation-history-container {
  padding: 0;
}

.history-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.search-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pager-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

.action-btns .el-button {
  padding: 5px 12px;
}

@media (max-width: 768px) {
  .search-toolbar {
    gap: 8px;
  }

  .search-toolbar :deep(.el-input),
  .search-toolbar :deep(.el-input__wrapper) {
    width: 100% !important;
  }

  .pager-wrap {
    justify-content: center;
  }
}
</style>
