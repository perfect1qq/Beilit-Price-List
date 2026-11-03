<template>
  <div class="shelf-material-weight-page">
    <el-card v-loading="loading" class="page-card" shadow="never">
      <template #header>
        <CardHeader title="货架材料重量">
          <template #actions>
            <div class="toolbar-actions">
              <template v-if="!isGuest">
                <AppButton v-if="!editMode" variant="edit" size="default" @click="startEdit">
                  编辑
                </AppButton>

                <template v-else>
                  <AppButton variant="add" @click="addRow">新增一行</AppButton>
                  <AppButton variant="save" :loading="saving" type="success" @click="saveData">保存</AppButton>
                  <AppButton variant="cancel" @click="cancelEdit">取消</AppButton>
                </template>
              </template>

              <AppButton variant="delete" size="default" @click="clearTable">
                清空表格
              </AppButton>
              <AppButton variant="refresh" :loading="loading" @click="loadData">刷新</AppButton>
            </div>
          </template>
        </CardHeader>
      </template>

      <div class="page-subtitle">
        {{ editMode ? '当前为编辑模式，可动态修改、添加或删除材料规格与参数数据' : '当前为实时预览与计算模式，系统将自动从服务端同步配置' }}
      </div>

      <el-alert v-if="errorMsg" class="mb-16" type="error" :title="errorMsg" :closable="false" show-icon />

      <div class="generator-form">
        <el-form :inline="true" :model="shelfSpec" style="margin-bottom: -18px;">
          <el-form-item label="规格 (长*宽*高)">
            <div style="display: flex; gap: 8px; align-items: center;">
              <el-input-number v-model="shelfSpec.length" :controls="false" placeholder="长" style="width: 80px;" />
              <span style="color: #909399;">*</span>
              <el-input-number v-model="shelfSpec.depth" :controls="false" placeholder="宽" style="width: 80px;" />
              <span style="color: #909399;">*</span>
              <el-input-number v-model="shelfSpec.height" :controls="false" placeholder="高" style="width: 80px;" />
            </div>
          </el-form-item>
          <el-form-item label="层数">
            <el-input-number v-model="shelfSpec.levels" :min="1" style="width: 90px;" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="shelfSpec.type" style="width: 80px;">
              <el-option label="主架" value="starter" />
              <el-option label="副架" value="addon" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <AppButton type="success" @click="generateShelfMaterials">
              一键生成
            </AppButton>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="displayRows"
        style="width: 100%"
        border
        stripe
        class="table smart-table"
        :header-cell-style="TABLE_HEADER_STYLE"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column type="index" label="序号" width="65" align="center" />

        <el-table-column label="名称" min-width="100" align="center">
          <template #default="{ row }">
            <el-input v-if="editMode" v-model="row.materialName" size="small" placeholder="名称" />
            <span v-else>{{ row.materialName || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="规格" min-width="160" align="center">
          <template #default="{ row, $index }">
            <el-select
              :ref="(el: unknown) => setSelectRef($index, el)"
              v-model="row.name"
              :size="editMode ? 'small' : 'default'"
              :placeholder="editMode ? '选择或输入新规格' : '请选择规格'"
              filterable
              :allow-create="editMode"
              default-first-option
              class="full-width"
              @change="handleNameChange(row)"
            >
              <el-option
                v-for="item in getOptionsForRow(row, $index)"
                :key="item"
                :label="item"
                :value="item"
              >
                <div class="spec-option-item">
                  <span>{{ item }}</span>
                  <span v-if="!isGuest" class="spec-option-actions">
                    <el-icon
                      class="spec-action-icon edit"
                      title="修改此规格参数"
                      @click.stop="openEditSpecDialog(item, $index)"
                    >
                      <Edit />
                    </el-icon>
                    <el-icon
                      class="spec-action-icon remove"
                      title="删除此规格"
                      @click.stop="deleteSpecOption(item)"
                    >
                      <Close />
                    </el-icon>
                  </span>
                </div>
              </el-option>

              <template v-if="!isGuest" #footer>
                <div class="spec-dropdown-footer" @click="openAddSpecDialog(row, $index)">
                  <el-icon><Plus /></el-icon>
                  <span>{{ row.materialName?.trim() ? `新增「${row.materialName.trim()}」规格` : '新增规格' }}</span>
                </div>
              </template>
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="展开面" min-width="90" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="editMode"
              v-model="row.expandedSurface"
              size="small"
              :controls="false"
              class="full-width"
              placeholder="0"
            />
            <span v-else>{{ row.expandedSurface ?? '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="厚度" min-width="90" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="editMode"
              v-model="row.thickness"
              size="small"
              :controls="false"
              :precision="2"
              class="full-width"
              placeholder="0"
            />
            <span v-else>{{ row.thickness != null ? Number(row.thickness).toFixed(2) : '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="密度" min-width="95" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="editMode"
              v-model="row.density"
              size="small"
              :controls="false"
              :precision="5"
              :step="0.00001"
              class="full-width"
            />
            <span v-else>{{ row.density != null ? Number(row.density).toFixed(5) : '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="重量(kg/m)" min-width="95" align="center">
          <template #default="{ row }">
            <span class="calc-value">{{ calculateWeight(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="长度(mm)" min-width="100" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.length"
              :size="editMode ? 'small' : 'default'"
              :controls="false"
              class="full-width"
              placeholder="0"
            />
          </template>
        </el-table-column>

        <el-table-column label="数量" min-width="90" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :size="editMode ? 'small' : 'default'"
              :controls="false"
              class="full-width"
              placeholder="0"
            />
          </template>
        </el-table-column>

        <el-table-column label="总重量(kg)" min-width="100" align="center">
          <template #default="{ row }">
            <span class="calc-value highlight">{{ calculateTotalWeight(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column v-if="editMode" label="操作" width="90" align="center" fixed="right">
          <template #default="{ $index }">
            <AppButton variant="delete" @click="removeRow($index)">
              删除
            </AppButton>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 下拉框内快捷新增 / 修改规格弹窗 -->
    <el-dialog
      v-model="specDialogVisible"
      :title="editingOriginalSpecName ? '修改规格参数' : '新增规格'"
      width="440px"
      destroy-on-close
      append-to-body
    >
      <el-form ref="specFormRef" :model="specForm" :rules="specFormRules" label-width="85px">
        <el-form-item label="所属名称" prop="materialName">
          <el-select
            v-model="specForm.materialName"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入名称（如：立柱、横梁）"
            style="width: 100%;"
          >
            <el-option
              v-for="cat in materialNameChoices"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="规格名称" prop="specName">
          <el-input
            v-model="specForm.specName"
            placeholder="如：立柱90*70*1.8、双C抱焊梁180"
            clearable
          />
        </el-form-item>

        <el-form-item label="展开面" prop="expandedSurface">
          <el-input-number
            v-model="specForm.expandedSurface"
            :min="0.01"
            :controls="false"
            placeholder="请输入展开面"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="厚度" prop="thickness">
          <el-input-number
            v-model="specForm.thickness"
            :min="0.01"
            :precision="2"
            :controls="false"
            placeholder="请输入厚度"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="密度" prop="density">
          <el-input-number
            v-model="specForm.density"
            :min="0.00001"
            :precision="5"
            :step="0.00001"
            :controls="false"
            style="width: 100%;"
          />
        </el-form-item>

        <div class="spec-weight-preview">
          参考单重：<span class="calc-value highlight">{{ specPreviewWeight }} kg/m</span>
        </div>
      </el-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <AppButton variant="cancel" @click="specDialogVisible = false">取消</AppButton>
          <AppButton variant="save" type="primary" :plain="false" :loading="specSaving" @click="submitSpecDialog">
            确定保存
          </AppButton>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Close, Edit, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import CardHeader from '@/components/common/CardHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useShelfMaterialWeight } from '@/composables/useShelfMaterialWeight'
import type { MaterialRow } from '@/api/shelfMaterialWeight'

const { isGuest } = usePermissions()

const {
  loading,
  saving,
  errorMsg,
  editMode,
  activeSpecs,
  shelfSpec,
  displayRows,
  loadData,
  startEdit,
  cancelEdit,
  addRow,
  removeRow,
  upsertSpecPreset,
  deleteSpecOption,
  getOptionsForRow,
  handleNameChange,
  saveData,
  generateShelfMaterials,
  clearTable,
} = useShelfMaterialWeight()

// 收起对应的下拉菜单引用
const selectRefs = new Map<number, { blur?: () => void }>()
const setSelectRef = (index: number, el: unknown) => {
  if (el && typeof el === 'object') {
    selectRefs.set(index, el as { blur?: () => void })
  } else {
    selectRefs.delete(index)
  }
}

// ==================== 新增 / 修改单个规格弹窗 ====================
const specDialogVisible = ref(false)
const specSaving = ref(false)
const editingOriginalSpecName = ref('')
const targetRowForSpec = ref<MaterialRow | null>(null)
const specFormRef = ref<FormInstance | null>(null)

const specForm = reactive({
  materialName: '立柱',
  specName: '',
  expandedSurface: undefined as number | undefined,
  thickness: undefined as number | undefined,
  density: 0.00785,
})

const specFormRules: FormRules = {
  materialName: [{ required: true, message: '请选择或输入所属名称', trigger: 'change' }],
  specName: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
  expandedSurface: [{ required: true, message: '请输入展开面', trigger: 'blur' }],
  thickness: [{ required: true, message: '请输入厚度', trigger: 'blur' }],
  density: [{ required: true, message: '请输入密度', trigger: 'blur' }],
}

const materialNameChoices = computed(() => {
  const set = new Set<string>(['立柱', '横梁', '横撑', '斜撑', '层板'])
  for (const r of displayRows.value) {
    if (r.materialName?.trim()) set.add(r.materialName.trim())
  }
  for (const s of Object.values(activeSpecs.value)) {
    if (s.materialName?.trim()) set.add(s.materialName.trim())
  }
  return Array.from(set)
})

const openAddSpecDialog = (row: MaterialRow, rowIndex: number) => {
  selectRefs.get(rowIndex)?.blur?.()
  editingOriginalSpecName.value = ''
  targetRowForSpec.value = row
  specForm.materialName = row.materialName?.trim() || '立柱'
  specForm.specName = ''
  specForm.expandedSurface = undefined
  specForm.thickness = undefined
  specForm.density = 0.00785
  specDialogVisible.value = true
}

const openEditSpecDialog = (specName: string, rowIndex: number) => {
  selectRefs.get(rowIndex)?.blur?.()
  const preset = activeSpecs.value[specName]
  if (!preset) return
  editingOriginalSpecName.value = specName
  targetRowForSpec.value = null
  specForm.materialName = preset.materialName || '立柱'
  specForm.specName = specName
  specForm.expandedSurface = preset.expandedSurface
  specForm.thickness = preset.thickness
  specForm.density = preset.density ?? 0.00785
  specDialogVisible.value = true
}

const submitSpecDialog = async () => {
  if (!specFormRef.value || specSaving.value) return
  try {
    await specFormRef.value.validate()
  } catch {
    return
  }

  specSaving.value = true
  try {
    const ok = await upsertSpecPreset({
      originalName: editingOriginalSpecName.value || undefined,
      specName: specForm.specName,
      preset: {
        materialName: specForm.materialName.trim(),
        expandedSurface: Number(specForm.expandedSurface),
        thickness: Number(specForm.thickness),
        density: Number(specForm.density),
      },
      targetRow: targetRowForSpec.value,
    })
    if (ok) {
      specDialogVisible.value = false
    }
  } finally {
    specSaving.value = false
  }
}

// ==================== 重量计算 ====================
const calculateWeight = (row: Partial<MaterialRow>): string => {
  if (row.expandedSurface == null || row.thickness == null || row.density == null) {
    return '0.00000'
  }

  let weight = row.expandedSurface * row.thickness * row.density

  if ((row.materialName && row.materialName.includes('双C抱焊梁')) || (row.name && row.name.includes('双C抱焊梁'))) {
    weight = weight * 2
  }

  return weight.toFixed(1)
}

const specPreviewWeight = computed(() =>
  calculateWeight({
    materialName: specForm.materialName,
    name: specForm.specName,
    expandedSurface: specForm.expandedSurface,
    thickness: specForm.thickness,
    density: specForm.density,
  }),
)

const calculateTotalWeight = (row: MaterialRow): string => {
  const weightStr = calculateWeight(row)
  const weight = parseFloat(weightStr)

  if (isNaN(weight) || row.length == null || row.quantity == null) {
    return '0.000'
  }

  const total = weight * (row.length / 1000) * row.quantity
  return total.toFixed(3)
}

const SUMMARY_CALCULATORS: Record<string, (data: MaterialRow[]) => string> = {
  '重量(kg/m)': (data) => {
    let total = 0
    data.forEach((row) => {
      const val = parseFloat(calculateWeight(row))
      if (!isNaN(val)) total += val
    })
    return total.toFixed(1)
  },
  '总重量(kg)': (data) => {
    let total = 0
    data.forEach((row) => {
      const val = parseFloat(calculateTotalWeight(row))
      if (!isNaN(val)) total += val
    })
    return total.toFixed(3)
  },
}

const getSummaries = (param: { columns: Array<{ label: string }>; data: MaterialRow[] }) => {
  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }

    const calculator = SUMMARY_CALCULATORS[column.label]
    if (calculator) {
      sums[index] = calculator(data)
    } else {
      sums[index] = ''
    }
  })

  return sums
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.shelf-material-weight-page {
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

.mb-16 {
  margin-bottom: 16px;
}

.generator-form {
  margin-bottom: 16px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.table {
  width: 100%;
}

.full-width {
  width: 100%;
}

.calc-value {
  font-family: monospace;
  font-size: 14px;
}

.highlight {
  color: var(--el-color-primary);
  font-weight: bold;
}

.spec-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.spec-option-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s;
}

.spec-option-item:hover .spec-option-actions {
  opacity: 1;
}

.spec-action-icon {
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s;
}

.spec-action-icon.edit:hover {
  color: var(--el-color-primary);
}

.spec-action-icon.remove:hover {
  color: var(--el-color-danger);
}

.spec-dropdown-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.spec-dropdown-footer:hover {
  opacity: 0.85;
}

.spec-weight-preview {
  padding: 8px 12px;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  text-align: right;
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
}
</style>
