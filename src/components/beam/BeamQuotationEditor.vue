<template>
  <el-card shadow="never" class="editor-card">
    <template #header>
      <CardHeader title="横梁载重单详情">
        <template #actions>
          <AppButton variant="back" label="返回列表" @click="$emit('back')" />
          <AppButton v-if="mode === 'edit'" variant="submit" label="提交修改" @click="$emit('update')" />
        </template>
      </CardHeader>
    </template>

    <el-form ref="formRef" :model="localFormModel">
      <el-table :data="tableItems" border stripe style="width: 100%; margin-top: 20px"
        :header-cell-style="TABLE_HEADER_STYLE" class="smart-table" :span-method="objectSpanMethod">

        <el-table-column label="横梁名称" min-width="180" align="left">
          <template #default="{}">
            <el-form-item prop="recordName" :rules="recordNameRule" style="margin-bottom: 0;">
              <el-input v-model="localFormModel.recordName" size="small" :disabled="mode === 'view'" placeholder="请输入记录名称，如：XX项目重型货架横梁" />
            </el-form-item>
          </template>
        </el-table-column>

        <el-table-column label="长度(mm)" width="130" align="center">
          <template #default="{ row, $index }">
            <el-form-item :prop="'editingItems.' + $index + '.length'"
              :rules="positiveDecimalRule('长度')">
              <el-input v-model="row.length" size="small" :disabled="mode === 'view'" placeholder="必填" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="规格(mm)" width="150" align="center">
          <template #default="{ row, $index }">
            <el-form-item :prop="'editingItems.' + $index + '.spec'"
              :rules="positiveDecimalRule('规格')">
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
        <el-table-column v-if="mode === 'edit'" label="操作" min-width="80" align="center">
          <template #default="{ $index }">
            <AppButton variant="delete" link label="" @click="$emit('remove-row', $index)" />
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <AppButton v-if="mode === 'edit'" variant="add" label="添加一行" @click="$emit('add-row')"
      style="margin-top: 15px; width: 100%" />
  </el-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { beamNameRule, recordNameRule, positiveDecimalRule, noSpaceRawValidator } from '@/utils/formRules'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import CardHeader from '@/components/common/CardHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
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

const objectSpanMethod = ({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number }) => {
  if (columnIndex === 0) {
    if (rowIndex === 0) {
      return { rowspan: tableItems.value.length, colspan: 1 }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
}
</script>

<style scoped>
.editor-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.name-group {
  display: flex;
  align-items: center;
  vertical-align: middle;
}

.label {
  font-weight: bold;
  color: #475569;
  vertical-align: middle;
  line-height: normal;
}

.name-group :deep(.el-form-item) {
  vertical-align: middle;
  margin-bottom: 0;
  display: flex;
  align-items: flex-start;
}

.name-group :deep(.el-form-item__error) {
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
  .name-group {
    width: 100%;
    flex-wrap: wrap;
    gap: 6px;
  }

  .name-group :deep(.el-input),
  .name-group :deep(.el-input__wrapper) {
    width: 100% !important;
  }
}
</style>
