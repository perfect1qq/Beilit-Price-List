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
          class="smart-table nowrap-table">
          <el-table-column label="时间" width="115" align="center">
            <template #default="{ row }">{{ formatDate(row.createdAt || row.updatedAt) }}</template>
          </el-table-column>
          <AutoFitColumn :data="historyList" prop="name" label="横梁名称" :min="140" :max="480" />
          <AutoFitColumn :data="historyList" label="长度(mm)" :getter="(row: any) => getFirstItemValue(row, 'length')" :min="85" :max="160" use-width>
            <template #default="{ row }">{{ getFirstItemValue(row, 'length') }}</template>
          </AutoFitColumn>
          <AutoFitColumn :data="historyList" label="规格(mm)" :getter="(row: any) => getFirstItemValue(row, 'spec')" :min="130" :max="480">
            <template #default="{ row }">{{ getFirstItemValue(row, 'spec') }}</template>
          </AutoFitColumn>
          <AutoFitColumn :data="historyList" label="最大载重(kg)" :getter="(row: any) => getFirstItemValue(row, 'maxLoad')" :min="110" :max="400">
            <template #default="{ row }">{{ getFirstItemValue(row, 'maxLoad') }}</template>
          </AutoFitColumn>
          <el-table-column label="操作" min-width="155" align="center">
            <template #default="{ row }">
              <ActionButtons
                :actions="[
                  { key: 'edit', variant: 'edit', label: '编辑', loading: isActionLoading(row.id), show: !isGuest, onClick: () => enterDetail(row, 'edit') },
                  { key: 'delete', variant: 'delete', label: '删除', loading: isActionLoading(row.id), show: isAdmin, onClick: () => handleDelete(row) },
                ]"
              />
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!historyList.length" description="暂无数据" />

        <div class="pager-wrap">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
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
import { TABLE_HEADER_STYLE, DEFAULT_PAGE_SIZE } from '@/constants/table'
import beamApi from '@/api/beam'
import type { BeamQuotationItem } from '@/types'
import BeamQuotationEditor from '@/components/beam/BeamQuotationEditor.vue'
import ActionButtons from '@/components/common/ActionButtons.vue'

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

// 横梁载重单默认每页 20 条
pageSize.value = DEFAULT_PAGE_SIZE

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

const addRow = () => editingItems.value.push({ length: '', spec: '', maxLoad: '' })

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


@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
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
