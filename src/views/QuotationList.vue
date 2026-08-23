<template>
  <div v-if="loading" class="skeleton-wrapper">
    <el-skeleton :rows="8" animated />
  </div>
  <div v-else class="quotation-page">
    <el-card shadow="never" class="card">
      <template #header>
        <CardHeader title="报价单编辑">
          <template #actions>
            <div class="toolbar">

              <template v-if="!isGuest">

                <AppButton variant="delete" size="default" @click="clearRows" :disabled="isViewMode">
                  清空当前表格
                </AppButton>


                <AppButton variant="save" type="success" @click="handleSubmit" :loading="isSubmitting" :disabled="isViewMode">
                  确认保存报价单
                </AppButton>
              </template>


              <QuotationModeActions :is-editing="isEditing" :is-view-mode="isViewMode" @reset="resetDraft"
                @switch-edit="switchToEdit" />
            </div>
          </template>
        </CardHeader>
      </template>




      <QuotationEditor ref="formRef" :is-view-mode="isViewMode" :rules-disabled="rulesDisabled" :form-model="formModel"
        :editing-history-id="editingHistoryId" v-model:remark="remark" v-model:discount="discount"
        v-model:final-price="finalPrice" v-model:raw-text="rawText" :subtotal="subtotal"
        :discount-amount="discountAmount" :auto-final-price="autoFinalPrice" :is-manual-final-price="isManualFinalPrice"
        :items="items" :visible-columns="visibleColumns" :hide-action-column="isGuest"
        @handle-discount-change="handleDiscountChange" @handle-manual-final-price-change="handleManualFinalPriceChange"
        @restore-auto-final-price="restoreAutoFinalPrice" @update-row-total="updateRowTotal" @remove-row="removeRow">

        <template #parse-action>
          <AppButton variant="primary" v-if="!isViewMode" :icon="MagicStick" @click="handleParseText" :loading="parsing">
            智能解析粘贴内容
          </AppButton>
        </template>

        <template #detail-action>
          <AppButton variant="add" v-if="!isGuest && !isViewMode" @click="addRow" size="small">
            添加一行
          </AppButton>
        </template>
      </QuotationEditor>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
defineOptions({ name: 'QuotationList' })
import {
  Delete,
  Check,
  MagicStick,
  Plus,
} from '@element-plus/icons-vue'
import quotationApi from '@/api/quotation'
import { useQuotationDraft } from '@/composables/useQuotationDraft'
import { useQuotationHistory } from '@/composables/useQuotationHistory'
import { useQuotationEditor } from '@/composables/useQuotationEditor'
import { usePermissions } from '@/composables/usePermissions'
import QuotationModeActions from '@/components/quotation/QuotationModeActions.vue'
import QuotationEditor from '@/components/quotation/QuotationEditor.vue'
import CardHeader from '@/components/common/CardHeader.vue'

const { isGuest } = usePermissions()


const formRef = ref(null)



const formModel = reactive({
  name: '',
  companyName: '',
})


const parsing = ref(false)


const rulesDisabled = ref(false)




const {
  name,
  companyName,
  remark,
  discount,
  finalPrice,
  isManualFinalPrice,
  rawText,
  items,
  visibleColumns,
  editingHistoryId,
  isViewMode,
  isEditing,
  subtotal,
  autoFinalPrice,
  discountAmount,
  resetDraft,
  setRows,
  addRow,
  removeRow,
  clearRows,
  updateRowTotal,
  setFinalPriceManual,
  restoreAutoFinalPrice,
  loadRecord,
  getPayload,
  originalPayloadStr,
} = useQuotationDraft()


watch(name, (val) => {
  formModel.name = val
})
watch(companyName, (val) => {
  formModel.companyName = val
})


const { saveQuotation, loading } = useQuotationHistory({
  api: quotationApi,
  loadToEditor: (record, mode) => loadRecord(record, mode),
})


const {
  isSubmitting,
  handleManualFinalPriceChange,
  handleDiscountChange,
  handleParseText,
  handleSubmit,
} = useQuotationEditor({
  isViewMode,
  parsing,
  rawText,
  items,
  name,
  companyName,
  formRef,
  formModel,
  editingHistoryId,
  originalPayloadStr,
  isManualFinalPrice,
  setFinalPriceManual,
  restoreAutoFinalPrice,
  setRows,
  getPayload,
  saveQuotation,
  parseTextFn: quotationApi.parseText.bind(quotationApi),
  onSaveSuccess: () => {
    rulesDisabled.value = true
    resetDraft()
  },
})



const switchToEdit = () => {
  if (!isViewMode.value) return
  rulesDisabled.value = false
  formModel.name = name.value
  formModel.companyName = companyName.value
  loadRecord(
    {
      id: editingHistoryId.value,
      name: name.value,
      companyName: companyName.value,
      remark: remark.value,
      discount: discount.value,
      finalPrice: finalPrice.value,
      isManual: isManualFinalPrice.value,
      items: items.value,
    },
    'edit',
  )
}
</script>

<style scoped>
/** 页面根容器：无内边距 */
.quotation-page {
  padding: 0;
}

/**
 * 卡片样式
 * - 圆角边框
 * - 轻微阴影效果
 * - 无默认边框
 */
.card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.skeleton-wrapper {
  padding: 24px;
}

/**
 * 工具栏布局
 * - Flex 弹性布局
 * - 子元素间距 10px
 * - 支持换行（小屏幕自适应）
 * - 底部间距 20px
 */
.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

/** 移动端适配：缩小间距 */
@media (max-width: 768px) {
  .toolbar {
    margin-bottom: 12px;
    gap: 8px;
  }
}
</style>

