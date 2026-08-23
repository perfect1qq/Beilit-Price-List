<template>
  <div class="shelf-material-weight-page">
    <el-card class="box-card" shadow="never">
      <template #header>
        <CardHeader title="货架材料重量">
          <template #actions>
            <div style="display: flex; gap: 12px;">
              <AppButton variant="delete" size="default" @click="clearTable">
                清空表格
              </AppButton>
              <AppButton variant="add" @click="addRow">
                新增一行
              </AppButton>
            </div>
          </template>
        </CardHeader>
      </template>

      <div class="generator-form" style="margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 4px;">
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
        :data="tableData"
        style="width: 100%"
        border
        :header-cell-style="TABLE_HEADER_STYLE"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column label="名称" min-width="100" align="center">
          <template #default="{ row }">
            <el-input v-model="row.materialName" placeholder="名称" />
          </template>
        </el-table-column>
        
        <el-table-column label="规格" min-width="130" align="center">
          <template #default="{ row, $index }">
            <el-select 
              v-model="row.name" 
              placeholder="请选择或输入规格" 
              filterable 
              allow-create 
              default-first-option
              class="full-width"
              @change="handleNameChange(row)"
            >
              <el-option
                v-for="item in getOptionsForRow($index)"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="展开面" min-width="90" align="center">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.expandedSurface" 
              :controls="false"
              class="full-width" 
              placeholder="0"
            />
          </template>
        </el-table-column>

        <el-table-column label="厚度" min-width="90" align="center">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.thickness" 
              :controls="false" 
              :precision="2"
              class="full-width" 
              placeholder="0"
            />
          </template>
        </el-table-column>

        <el-table-column label="密度" min-width="90" align="center">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.density" 
              :controls="false" 
              :precision="5"
              :step="0.00001"
              class="full-width" 
            />
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

        <el-table-column label="操作" width="60" align="center" fixed="right">
          <template #default="{ $index }">
            <AppButton variant="delete" circle @click="removeRow($index)"/>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import CardHeader from '@/components/common/CardHeader.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface MaterialRow {
  id: number
  materialName: string
  name: string
  expandedSurface: number | undefined
  thickness: number | undefined
  density: number
  length: number | undefined
  quantity: number | undefined
}

const MATERIAL_SPECS: Record<string, { expandedSurface: number, thickness: number, category: string }> = {
  '立柱90*70*2.0': { expandedSurface: 250, thickness: 2.0, category: 'column' },
  '立柱100*70*2.5': { expandedSurface: 1, thickness: 2.5, category: 'column' },
  '双C抱焊梁100': { expandedSurface: 202, thickness: 1.5, category: 'beam' },
  '双C抱焊梁120': { expandedSurface: 222, thickness: 1.5, category: 'beam' },
  '双C抱焊梁140': { expandedSurface: 242, thickness: 1.5, category: 'beam' },
  '双C抱焊梁160': { expandedSurface: 262, thickness: 1.5, category: 'beam' },
  '一体梁100': { expandedSurface: 350, thickness: 1.5, category: 'beam' },
  '一体梁120': { expandedSurface: 390, thickness: 1.5, category: 'beam' },
  '一体梁140': { expandedSurface: 430, thickness: 1.5, category: 'beam' },
  '横撑24*40': { expandedSurface: 93, thickness: 1.5, category: 'horizontal_brace' },
  '横撑29*40': { expandedSurface: 103, thickness: 1.5, category: 'horizontal_brace' },
  '斜撑24*40': { expandedSurface: 93, thickness: 1.5, category: 'diagonal_brace' },
  '斜撑29*40': { expandedSurface: 103, thickness: 1.5, category: 'diagonal_brace' },
}

const materialOptions = Object.keys(MATERIAL_SPECS)

const getOptionsForRow = (index: number) => {
  if (index === 0) {
    return materialOptions.filter(k => MATERIAL_SPECS[k].category === 'column')
  } else if (index === 1) {
    return materialOptions.filter(k => MATERIAL_SPECS[k].category === 'beam')
  } else if (index === 2) {
    return materialOptions.filter(k => MATERIAL_SPECS[k].category === 'horizontal_brace')
  } else if (index === 3) {
    return materialOptions.filter(k => MATERIAL_SPECS[k].category === 'diagonal_brace')
  }
  return materialOptions
}

const handleNameChange = (row: MaterialRow) => {
  const spec = MATERIAL_SPECS[row.name]
  if (spec) {
    row.expandedSurface = spec.expandedSurface
    row.thickness = spec.thickness
  }
}

const generateId = () => Date.now() + Math.floor(Math.random() * 1000)

const createEmptyRow = (): MaterialRow => ({
  id: generateId(),
  materialName: '',
  name: '',
  expandedSurface: undefined,
  thickness: undefined,
  density: 0.00785,
  length: undefined,
  quantity: undefined
})

const createRow = (materialName: string, name: string, expandedSurface: number, thickness: number): MaterialRow => ({
  id: generateId(),
  materialName,
  name,
  expandedSurface,
  thickness,
  density: 0.00785,
  length: undefined,
  quantity: undefined
})

const tableData = ref<MaterialRow[]>([
  createRow('立柱', '立柱90*70*2.0', 250, 2.0),
  createRow('横梁', '双C抱焊梁100', 202, 1.5),
  createRow('横撑', '横撑24*40', 93, 1.5),
])

const shelfSpec = ref({
  length: 2000,
  depth: 600,
  height: 2000,
  levels: 4,
  type: 'starter'
})

const generateShelfMaterials = () => {
  if (!shelfSpec.value.length || !shelfSpec.value.depth || !shelfSpec.value.height) {
    ElMessage.warning('请输入完整的货架规格（长、宽、高）')
    return
  }

  tableData.value = []
  
  // 1. 立柱
  const columnCount = shelfSpec.value.type === 'starter' ? 4 : 2
  const columnRow = createRow('立柱', '立柱90*70*2.0', 250, 2.0)
  columnRow.length = shelfSpec.value.height
  columnRow.quantity = columnCount
  tableData.value.push(columnRow)
  
  // 2. 横梁
  const beamCount = shelfSpec.value.levels * 2
  const beamRow = createRow('横梁', '双C抱焊梁100', 202, 1.5)
  beamRow.length = shelfSpec.value.length
  beamRow.quantity = beamCount
  tableData.value.push(beamRow)
  
  // 3. 横撑
  const horizontalBraceRow = createRow('横撑', '横撑24*40', 93, 1.5)
  horizontalBraceRow.length = shelfSpec.value.depth - 56 - 56 + 40
  horizontalBraceRow.quantity = 2 // 默认顶部和底部各一根
  tableData.value.push(horizontalBraceRow)
  
  // 4. 斜撑
  // 粗略计算：斜撑数量 = (高度 / 600) * 2
  const diagonalCount = Math.floor(shelfSpec.value.height / 600) * 2
  // 斜撑长度 = sqrt(深度的平方 + 600的平方)
  const diagonalLength = Math.round(Math.sqrt(Math.pow(shelfSpec.value.depth, 2) + Math.pow(600, 2)))
  const diagonalBraceRow = createRow('斜撑', '斜撑29*40', 103, 1.5)
  diagonalBraceRow.length = diagonalLength
  diagonalBraceRow.quantity = diagonalCount || 2 // 至少2根
  tableData.value.push(diagonalBraceRow)

  ElMessage.success('已自动生成计算结果！请根据实际情况调整横斜撑数量。')
}

const addRow = () => {
  tableData.value.push(createEmptyRow())
}

const clearTable = () => {
  ElMessageBox.confirm(
    '确定要清空所有行的长度和数量吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    tableData.value.forEach(row => {
      row.length = undefined
      row.quantity = undefined
    })
    ElMessage.success('长度和数量已清空')
  }).catch(() => {})
}

const removeRow = (index: number) => {
  tableData.value.splice(index, 1)
}

const calculateWeight = (row: MaterialRow): string => {
  if (row.expandedSurface == null || row.thickness == null || row.density == null) {
    return '0.00000'
  }
  
  let weight = row.expandedSurface * row.thickness * row.density
  
  if (row.materialName && row.materialName.includes('双C抱焊梁')) {
    weight = weight * 2
  }
  
  return weight.toFixed(1)
}

const calculateTotalWeight = (row: MaterialRow): string => {
  const weightStr = calculateWeight(row)
  const weight = parseFloat(weightStr)
  
  if (isNaN(weight) || row.length == null || row.quantity == null) {
    return '0.000'
  }
  
  const total = weight * (row.length / 1000) * row.quantity
  return total.toFixed(3)
}

const getSummaries = (param: { columns: any[]; data: any[] }) => {
  const { columns, data } = param
  const sums: string[] = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    if (column.label === '重量(kg/m)') {
      let totalUnitWeight = 0
      data.forEach(row => {
        const rowUnitStr = calculateWeight(row)
        const rowUnitWeight = parseFloat(rowUnitStr)
        if (!isNaN(rowUnitWeight)) {
          totalUnitWeight += rowUnitWeight
        }
      })
      sums[index] = totalUnitWeight.toFixed(1)
    } else if (column.label === '总重量(kg)') {
      let totalWeight = 0
      data.forEach(row => {
        const rowTotalStr = calculateTotalWeight(row)
        const rowTotal = parseFloat(rowTotalStr)
        if (!isNaN(rowTotal)) {
          totalWeight += rowTotal
        }
      })
      sums[index] = totalWeight.toFixed(3)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}
</script>

<style scoped>
.shelf-material-weight-page {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.box-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: none;
}

:deep(.el-card__body) {
  padding: 16px;
  flex: 1;
  overflow: auto;
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

.column-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
  line-height: 1.2;
  margin-top: 2px;
}
</style>

