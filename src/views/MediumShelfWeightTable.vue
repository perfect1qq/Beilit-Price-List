<template>





  <div class="medium-weight-page">

    <el-card class="page-card" shadow="never" v-loading="loading">
      <template #header>
        <CardHeader title="中型货架重量表">
          <template #actions>
            <div class="toolbar-actions">
              <template v-if="!isGuest">
                <el-button v-if="!editMode" type="primary" :icon="Edit" @click="startEdit">
                  编辑
                </el-button>

                <template v-else>
                  <el-button :icon="Plus" @click="addSummaryRow">新增中型货架重量表</el-button>
                  <el-button :loading="saving" type="success" @click="saveData">保存</el-button>
                  <el-button @click="cancelEdit">取消</el-button>
                </template>
              </template>

              <el-button :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
            </div>
          </template>
        </CardHeader>
      </template>

      <div class="page-subtitle">
        {{ editMode ? '当前为编辑模式，可动态修改、添加或删除层级与结构数据' : '当前为实时预览模式，系统将自动从服务端同步配置' }}
      </div>


      <el-alert v-if="errorMsg" class="mb-16" type="error" :title="errorMsg" :closable="false" show-icon />


      <template v-if="summaryRows?.length || detailRows?.length">

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="section-title">中型货架重量表</div>
          </template>

          <el-table :data="displaySummaryRows" border stripe class="table smart-table nowrap-table"
            :header-cell-style="TABLE_HEADER_STYLE">
            <el-table-column prop="index" label="序号" width="70" align="center" />

            <el-table-column label="名称" min-width="120" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.name" size="small" placeholder="名称" />
                <span v-else class="config-text">
                  {{ formatConfigText(row.name) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="规格" min-width="120" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.spec" size="small" placeholder="规格" />
                <span v-else>{{ row.spec }}</span>
              </template>
            </el-table-column>

            <el-table-column label="层数" width="90" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.layers" size="small" placeholder="层数" />
                <span v-else>{{ row.layers }}</span>
              </template>
            </el-table-column>

            <el-table-column label="载重" width="110" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.load" size="small" placeholder="载重" />
                <span v-else>{{ row.load }}</span>
              </template>
            </el-table-column>

            <el-table-column label="总自重" width="110" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.totalWeight" size="small" placeholder="总自重" />
                <span v-else>{{ row.totalWeight }}</span>
              </template>
            </el-table-column>

            <el-table-column label="配件分拆重量">
              <el-table-column label="立柱片" width="110" align="center">
                <template #default="{ row }">
                  <el-input v-if="editMode" v-model="row.uprightWeight" size="small" placeholder="立柱片" />
                  <span v-else>{{ row.uprightWeight }}</span>
                </template>
              </el-table-column>

              <el-table-column label="横梁" width="110" align="center">
                <template #default="{ row }">
                  <el-input v-if="editMode" v-model="row.beamWeight" size="small" placeholder="横梁" />
                  <span v-else>{{ row.beamWeight }}</span>
                </template>
              </el-table-column>

              <el-table-column label="层板" width="110" align="center">
                <template #default="{ row }">
                  <el-input v-if="editMode" v-model="row.shelfWeight" size="small" placeholder="层板" />
                  <span v-else>{{ row.shelfWeight }}</span>
                </template>
              </el-table-column>
            </el-table-column>

            <el-table-column v-if="editMode" label="操作" min-width="90" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeSummaryRow($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>


        <el-card shadow="never" class="section-card">
          <template #header>
            <div style="display:flex; align-items:center; justify-content:space-between">
              <div class="section-title">层数规格明细</div>
              <el-button v-if="editMode" :icon="Plus" @click="addDetailRow">新增层数规格明细</el-button>
            </div>
          </template>

          <el-table :data="displayDetailRows" border stripe class="table smart-table"
            :header-cell-style="TABLE_HEADER_STYLE" :span-method="editMode ? undefined : detailSpanMethod"
            row-key="index">
            <el-table-column prop="index" label="序号" width="70" align="center" />

            <el-table-column label="层数" width="90" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.layerGroup" size="small" placeholder="层数" />
                <span v-else>{{ row.layerGroup }}</span>
              </template>
            </el-table-column>

            <el-table-column label="规格（L*W*H）" min-width="170" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.spec" size="small" placeholder="规格" />
                <span v-else>{{ row.spec }}</span>
              </template>
            </el-table-column>

            <el-table-column label="载重（kg/层）" width="120" align="center">
              <template #default="{ row }">
                <el-input v-if="editMode" v-model="row.loadPerLayer" size="small" placeholder="载重" />
                <span v-else>{{ row.loadPerLayer }}</span>
              </template>
            </el-table-column>
            <el-table-column label="报价" min-width="200" align="center">
              <template #default="{ row }">
                <div class="wrap-text">
                  <el-input v-if="editMode" v-model="row.quote" type="textarea" :rows="2" resize="none" />
                  <span v-else>{{ row.quote }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际" min-width="200" align="center">
              <template #default="{ row }">
                <div class="wrap-text">
                  <el-input v-if="editMode" v-model="row.actual" type="textarea" :rows="2" resize="none" />
                  <span v-else>{{ row.actual }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column v-if="editMode" label="操作" min-width="90" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeDetailRow($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </template>

      <el-empty v-else description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { usePermissions } from '@/composables/usePermissions'
import { useMediumShelfWeight } from '@/composables/useMediumShelfWeight'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import CardHeader from '@/components/common/CardHeader.vue'

const { isGuest } = usePermissions()

const {
  loading,
  saving,
  errorMsg,
  editMode,
  summaryRows,
  detailRows,
  displaySummaryRows,
  displayDetailRows,
  formatConfigText,
  loadData,
  startEdit,
  cancelEdit,
  addSummaryRow,
  addDetailRow,
  removeSummaryRow,
  removeDetailRow,
  saveData
} = useMediumShelfWeight()



const buildSpanMap = (rows: Record<string, unknown>[], field: string) => {
  if (!Array.isArray(rows) || !rows.length) return {}
  const map: Record<number, number> = {}
  let i = 0

  while (i < rows.length) {
    const currentValue = rows[i]?.[field]
    let count = 1

    while (i + count < rows.length && rows[i + count]?.[field] === currentValue) {
      count += 1
    }

    map[i] = count
    for (let j = 1; j < count; j += 1) {
      map[i + j] = 0
    }

    i += count
  }

  return map
}

const detailSpanMaps = computed(() => {
  const rows = displayDetailRows.value
  if (!rows || !rows.length) return { layerGroup: {}, loadPerLayer: {}, quote: {}, actual: {} }
  return {
    layerGroup: buildSpanMap(rows, 'layerGroup'),
    loadPerLayer: buildSpanMap(rows, 'loadPerLayer'),
    quote: buildSpanMap(rows, 'quote'),
    actual: buildSpanMap(rows, 'actual')
  }
})

const detailSpanMethod = ({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => {
  const spanMapList: Record<number, Record<number, number>> = {
    1: detailSpanMaps.value.layerGroup,
    3: detailSpanMaps.value.loadPerLayer,
    4: detailSpanMaps.value.quote,
    5: detailSpanMaps.value.actual
  }

  const spanMap = spanMapList[columnIndex]
  if (!spanMap) return [1, 1]

  const span = spanMap[rowIndex]
  if (span === 0) return [0, 0]
  if (span > 1) return [span, 1]
  return [1, 1]
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.medium-weight-page {
  min-height: 100%;
}

.page-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.page-subtitle {
  margin-bottom: 16px;
  font-size: 13px;
  color: #64748b;
}

.section-card {
  margin-top: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #1e293b;
  line-height: 1;
}

.config-text {
  white-space: pre-line;
  /* 让 \n 生效 */
  line-height: 1.6;
  word-break: break-word;
}

.table {
  width: 100%;
}

.mb-16 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .page-subtitle {
    font-size: 12px;
    line-height: 1.5;
  }

  .toolbar-actions {
    width: 100%;
  }

  .toolbar-actions :deep(.el-button) {
    margin-left: 0;
  }

  .section-card {
    margin-top: 12px;
  }
}
</style>