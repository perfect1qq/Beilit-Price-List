<template>
  <div class="beam-quotation-page">
    <el-form ref="formRef" :model="{ recordName, items }" :disabled="isGuest">
      <el-card shadow="never" class="editor-card">
        <template #header>
        <CardHeader title="横梁载重单编辑">
          <template #actions>
            <div class="toolbar">
              <template v-if="!isGuest">
                <AppButton variant="add" @click="addRow">添加一行</AppButton>
                <AppButton variant="save" type="success" :loading="saving" @click="handleSave">提交保存</AppButton>
              </template>

            </div>
          </template>
        </CardHeader>
      </template>

      <el-table :data="items" border stripe style="width: 100%" :header-cell-style="TABLE_HEADER_STYLE"
        class="smart-table" :span-method="objectSpanMethod">
          <el-table-column label="横梁名称" align="center" width="220">
            <template #default="{}">
              <el-form-item prop="recordName" :rules="beamNameRule" style="margin-bottom: 0;">
                <el-input v-model="recordName" size="small" placeholder="请输入横梁名称，如：XX项目重型货架横梁" :disabled="isGuest" />
              </el-form-item>
            </template>
          </el-table-column>

          <el-table-column label="长度(mm)" align="center">
            <template #default="{ row, $index }">
              <el-form-item :prop="'items.' + $index + '.length'"
                :rules="[{ required: true, message: '请输入长度', trigger: 'blur' }, { validator: noSpaceRawValidator, trigger: 'blur' }]">
                <el-input v-model="row.length" size="small" placeholder="必填" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="规格(mm)" align="center">
            <template #default="{ row, $index }">
              <el-form-item :prop="'items.' + $index + '.spec'"
                :rules="[{ required: true, message: '请输入规格', trigger: 'blur' }, { validator: noSpaceRawValidator, trigger: 'blur' }]">
                <el-input v-model="row.spec" size="small" placeholder="必填" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="最大载重(kg)" align="center">
            <template #default="{ row, $index }">
              <el-form-item :prop="'items.' + $index + '.maxLoad'" :rules="positiveDecimalRule('最大载重')">
                <el-input v-model="row.maxLoad" size="small" placeholder="必填" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column v-if="!isGuest" label="操作" min-width="80" align="center">
            <template #default="{ $index }">
              <AppButton variant="delete" @click="deleteRow($index)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
defineOptions({ name: 'BeamQuotationList' })
import { Plus, Delete, Check } from '@element-plus/icons-vue'
import beamApi from '../api/beam'
import { to } from '@/utils/async'
import { showWarning, showError, showSuccess } from '@/utils/message'
import { beamNameRule, positiveDecimalRule, noSpaceRawValidator } from '@/utils/formRules'
import { usePermissions } from '@/composables/usePermissions'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import CardHeader from '@/components/common/CardHeader.vue'

const { isGuest } = usePermissions()

const recordName = ref('')
const items = ref<Array<{ length: string; spec: string; maxLoad: string }>>([{ length: '', spec: '', maxLoad: '' }])
const { submitLoading: saving, withSubmitLock } = useFormSubmit({ lockDuration: 300 })
const formRef = ref<InstanceType<typeof import('element-plus')['ElForm']> | null>(null)

const objectSpanMethod = ({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number }) => {
  if (columnIndex === 0) {
    if (rowIndex === 0) {
      return { rowspan: items.value.length, colspan: 1 }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
}

const addRow = () => items.value.push({ length: '', spec: '', maxLoad: '' })

const deleteRow = (index: number) => {
  if (items.value.length <= 1) {
    return showWarning('至少需要保留一行数据！')
  }
  items.value.splice(index, 1)
}

const handleSave = async () => {
  const [validateErr] = await to(formRef.value?.validate() ?? Promise.resolve(undefined))
  if (validateErr) return

  const [, checkRes] = await to(beamApi.checkName(recordName.value.trim()))
  if (checkRes?.exists) {
    return showWarning('历史记录中已存在同名的横梁名称，请更换横梁名称！')
  }

  await withSubmitLock(async () => {
    const [err] = await to(beamApi.create({ name: recordName.value, items: items.value }))
    if (err) {
      showError('保存失败，请检查网络或后端接口')
      return
    }
    showSuccess('新增成功')
    formRef.value?.resetFields()
    recordName.value = ''
    items.value = [{ length: '', spec: '', maxLoad: '' }]
  })
}

</script>

<style scoped>
.editor-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.name-group {
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

/* 表格内表单验证提示文字已通过 global.css 全局优化 */
/* 输入框居中 + 错误提示显示在下方 */

:deep(.el-form-item__error) {
  font-size: 11px;
  line-height: 1.6;
  padding-top: 2px;
}

@media (max-width: 768px) {
  .toolbar {
    margin-bottom: 12px;
    gap: 8px;
  }

  .name-group {
    margin-left: 0;
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
