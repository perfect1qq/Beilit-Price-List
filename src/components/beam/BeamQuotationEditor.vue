<template>
  <el-card shadow="never" class="editor-card">
    <template #header>
      <CardHeader title="横梁载重单详情">
        <template #actions>
          <el-button @click="$emit('back')">返回列表</el-button>
          <el-button v-if="mode === 'edit'" type="success" @click="$emit('update')">提交修改</el-button>
        </template>
      </CardHeader>
    </template>

    <el-form ref="formRef" :model="localFormModel">
      <div class="name-display">
        <span class="label">记录名称:</span>
        <el-form-item prop="recordName" :rules="recordNameRule">
          <el-input v-model="localFormModel.recordName" :disabled="mode === 'view'" style="width: 250px"
            placeholder="必填" />
        </el-form-item>
      </div>

      <el-table :data="tableItems" border stripe style="width: 100%; margin-top: 20px"
        :header-cell-style="TABLE_HEADER_STYLE" class="smart-table">
        <el-table-column label="横梁名称" min-width="180" align="left">
          <template #default="{ row, $index }">
            <el-form-item :prop="'editingItems.' + $index + '.name'" :rules="beamNameRule">
              <el-input v-model="row.name" size="small" :disabled="mode === 'view'" placeholder="必填" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="长度(mm)" width="130" align="center">
          <template #default="{ row, $index }">
            <el-form-item :prop="'editingItems.' + $index + '.length'"
              :rules="[{ required: true, message: '请输入长度', trigger: 'blur' }, { validator: noSpaceRawValidator, trigger: 'blur' }]">
              <el-input v-model="row.length" size="small" :disabled="mode === 'view'" placeholder="必填" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="规格(mm)" width="150" align="center">
          <template #default="{ row, $index }">
            <el-form-item :prop="'editingItems.' + $index + '.spec'"
              :rules="[{ required: true, message: '请输入规格', trigger: 'blur' }, { validator: noSpaceRawValidator, trigger: 'blur' }]">
              <el-input v-model="row.spec" size="small" :disabled="mode === 'view'" placeholder="必填" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="最大载重(kg)" width="140" align="center">
          <template #default="{ row, $index }">
            <el-form-item :prop="'editingItems.' + $index + '.maxLoad'" :rules="positiveDecimalRule('最大载重')">
              <el-input v-model="row.maxLoad" size="small" :disabled="mode === 'view'" placeholder="必填" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column v-if="mode === 'edit'" label="操作" width="80" fixed="right" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" :icon="Delete" @click="$emit('remove-row', $index)" />
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <el-button v-if="mode === 'edit'" type="primary" plain :icon="Plus" @click="$emit('add-row')"
      style="margin-top: 15px; width: 100%">添加一行</el-button>
  </el-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { beamNameRule, recordNameRule, positiveDecimalRule, noSpaceRawValidator } from '@/utils/formRules'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import CardHeader from '@/components/common/CardHeader.vue'
import type { BeamQuotationItem } from '@/types'

interface BeamFormModel {
  recordName: string
  editingItems: BeamQuotationItem[]
  items?: BeamQuotationItem[]
  [key: string]: unknown
}

const props = defineProps({
  mode: { type: String, required: true },
  formModel: { type: Object as PropType<BeamFormModel>, required: true },
  items: { type: Array as PropType<BeamQuotationItem[]>, required: true }
})

const emit = defineEmits(['back', 'update', 'add-row', 'remove-row', 'update:formModel'])

const localFormModel = computed({
  get: () => props.formModel,
  set: (val) => emit('update:formModel', val)
})

const tableItems = computed(() => localFormModel.value.editingItems || props.items)
</script>

<style scoped>
.editor-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.name-display {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  vertical-align: middle;
}

.label {
  font-weight: bold;
  color: #475569;
  vertical-align: middle;
  line-height: normal;
}

.name-display :deep(.el-form-item) {
  vertical-align: middle;
  margin-bottom: 0;
  display: flex;
  align-items: flex-start;
}

.name-display :deep(.el-form-item__error) {
  font-size: 11px;
  line-height: 1.6;
  padding-top: 2px;
  position: absolute;
  top: 100%;
  left: 0;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__error) {
  font-size: 11px;
  line-height: 1.6;
  padding-top: 2px;
}

@media (max-width: 768px) {
  .name-display {
    margin-left: 0;
    width: 100%;
    flex-wrap: wrap;
    gap: 6px;
  }

  .name-display :deep(.el-input),
  .name-display :deep(.el-input__wrapper) {
    width: 100% !important;
  }
}
</style>
