<template>
  <!-- 报价单主工作页面 -->
  <div class="quotation-page">
    <el-card shadow="never" class="card">
      <!-- 顶部操作按钮工具栏 -->
      <div class="toolbar">
        <!-- 解析粘贴自 Word 或 Excel 的非结构化文本 -->
        <el-button v-if="!isViewMode" type="primary" :icon="DocumentAdd" @click="handleParseText" :loading="parsing">智能解析粘贴内容</el-button>
        <el-button type="primary" plain :icon="Plus" @click="addRow" :disabled="isViewMode">手动添加一行</el-button>
        <el-button :icon="Refresh" @click="clearRows" :disabled="isViewMode">清空当前表格</el-button>
        
        <!-- 提交并保存报价单到后端数据库，使用 isSubmitting 防抖处理高并发重连机制 -->
        <el-button type="success" :icon="DocumentAdd" @click="handleSubmit" :loading="isSubmitting" :disabled="isViewMode">确认保存报价单</el-button>
        
        <!-- 模式切换按钮 -->
        <QuotationModeActions
          :is-editing="isEditing"
          :is-view-mode="isViewMode"
          @reset="resetDraft"
          @switch-edit="switchToEdit"
        />
      </div>

      <el-row :gutter="16" class="meta-area">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="section-title">基础信息</div>
            </template>
            <el-form label-width="92px">
              <el-form-item label="名称" required>
                <el-input v-model="quotationNo" placeholder="请输入名称" :disabled="isViewMode" />
              </el-form-item>
              <el-form-item label="公司名称" required>
                <el-input v-model="companyName" placeholder="请输入公司名称" :disabled="isViewMode" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="remark" type="textarea" :rows="3" placeholder="备注信息，不参与表格" :disabled="isViewMode" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="section-title">价格设置</div>
            </template>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="折扣(%)">
                  <el-input-number
                    v-model="discount"
                    :min="0"
                    :max="100"
                    :precision="2"
                    controls-position="right"
                    style="width: 100%"
                    :disabled="isViewMode"
                    @change="handleDiscountChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="成交价">
                  <el-input-number
                    v-model="finalPrice"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    style="width: 100%"
                    :disabled="isViewMode"
                    @change="handleManualFinalPriceChange"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="price-summary">
              <div>小计：<strong>¥ {{ formatMoney(subtotal) }}</strong></div>
              <div>优惠金额：<strong>¥ {{ formatMoney(discountAmount) }}</strong></div>
              <div>自动成交价：<strong>¥ {{ formatMoney(autoFinalPrice) }}</strong></div>
              <div>状态：<el-tag :type="isManualFinalPrice ? 'warning' : 'success'" effect="plain">{{ isManualFinalPrice ? '手动成交价' : '自动成交价' }}</el-tag></div>
            </div>

            <div class="price-actions">
              <el-button size="small" @click="restoreAutoFinalPrice" :disabled="isViewMode || !isManualFinalPrice">恢复自动成交价</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card v-if="!isViewMode" shadow="never" class="inner-card">
        <template #header>
          <div class="section-title">粘贴 Word 内容</div>
        </template>
        <el-input
          v-model="rawText"
          type="textarea"
          :rows="8"
          resize="vertical"
          placeholder="把 Word 里复制出来的表格直接粘贴到这里，再点击“智能解析粘贴内容”"
        />
        <div class="hint-row">
          支持名称/规格/数量/单价/总价的任意组合，缺少的列会自动隐藏；总价缺失时会用 数量 × 单价 自动计算。
        </div>
      </el-card>

      <el-card shadow="never" class="inner-card">
        <template #header>
          <div class="section-title">报价明细</div>
        </template>

        <el-table
          :data="items"
          border
          stripe
          style="width: 100%"
          :header-cell-style="headerStyle"
          empty-text="暂无明细，请先粘贴内容或手动添加一行" class="smart-table">
          <el-table-column v-if="visibleColumns.includes('name')" label="名称" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="名称" :disabled="isViewMode" />
            </template>
          </el-table-column>

          <el-table-column v-if="visibleColumns.includes('spec')" label="规格" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.spec" placeholder="规格" :disabled="isViewMode" />
            </template>
          </el-table-column>

          <el-table-column v-if="visibleColumns.includes('quantity')" label="数量" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.quantity" placeholder="数量" :disabled="isViewMode" @change="updateRowTotal(row)" />
            </template>
          </el-table-column>

          <el-table-column v-if="visibleColumns.includes('unitPrice')" label="单价" min-width="130">
            <template #default="{ row }">
              <el-input v-model="row.unitPrice" placeholder="单价" :disabled="isViewMode" @change="updateRowTotal(row)" />
            </template>
          </el-table-column>

          <el-table-column v-if="visibleColumns.includes('totalPrice')" label="总价" min-width="130" align="center">
            <template #default="{ row }">
              <span>¥ {{ formatMoney(row.totalPrice) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="90" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" :icon="Delete" @click="removeRow($index)" :disabled="isViewMode">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, DocumentAdd, Plus, Refresh } from '@element-plus/icons-vue'
import { quotationApi } from '@/api/quotation'
import { useQuotationDraft } from '@/composables/useQuotationDraft'
import { useQuotationHistory } from '@/composables/useQuotationHistory'
import QuotationModeActions from '@/components/quotation/QuotationModeActions.vue'

const headerStyle = { background: '#f8fafc', color: '#475569', fontWeight: 'bold', textAlign: 'center' }

// 控制全页面并发状态的 Loading
const parsing = ref(false)
const isSubmitting = ref(false)

// 格式化金额：保留两位小数并添加千分位
const formatMoney = (val) => {
  const num = Number(val || 0)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// --- [状态管理] 报价单草稿逻辑 ---
// 核心逻辑高度封装在 useQuotationDraft 中，包括：
// 1. 自动计算总价、小计、折扣
// 2. 区分“自动成交价”与“手动覆盖成交价”
// 3. 动态显隐表格列 (根据解析出的内容)
const {
  quotationNo,
  companyName,
  remark,
  discount,
  finalPrice,
  isManualFinalPrice, // 是否处于手动指定总价模式
  rawText, // 用户粘贴的原始文本
  items, // 表格行数据
  visibleColumns, // 当前显示的列 (name, spec, quantity, unitPrice, totalPrice)
  editingHistoryId, // 当前是否在修改已有的历史记录
  isViewMode, // 是否处于只读查看模式
  isEditing, // 是否处于编辑模式
  subtotal,
  autoFinalPrice,
  discountAmount,
  resetDraft,
  setRows,
  addRow,
  removeRow,
  clearRows,
  updateRowTotal,
  setFinalPriceManual, // 切换到手动指定成交价状态
  restoreAutoFinalPrice, // 恢复通过折扣计算成交价的状态
  loadRecord,
  getPayload,
  originalPayloadStr // 暴露深比对历史快照
} = useQuotationDraft()

// --- [状态管理] 历史记录逻辑 ---
const {
  saveQuotation,
  deleteHistory
} = useQuotationHistory({ 
  api: quotationApi, 
  loadToEditor: (record, mode) => loadRecord(record, mode) 
})

const handleManualFinalPriceChange = (value) => {
  if (isViewMode.value) return
  setFinalPriceManual(value)
}

const handleDiscountChange = () => {
  if (isViewMode.value) return
  if (isManualFinalPrice.value) {
    restoreAutoFinalPrice()
  }
}

/**
 * 智能解析剪贴板内容核心逻辑
 * - 使用 try..catch 完美替换 .catch 增强语法规范
 */
const handleParseText = async () => {
  if (isViewMode.value) return
  const text = String(rawText.value ?? '').trim()
  if (!text) {
    return ElMessage.warning('请先粘贴报价内容至编辑框内')
  }

  parsing.value = true
  try {
    const result = await quotationApi.parseText(text)
    if (!result) return
    
    // 生成行内明细数据并初始化表结构
    setRows(result.items || [], result.columns || [])
    if (result.warnings?.length) {
      ElMessage.warning(result.warnings[0])
    } else {
      ElMessage.success('文本解析完成，已渲染至下方数据表')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '解析失败，请检查服务连通性')
  } finally {
    parsing.value = false
  }
}

/**
 * 完整校验当前行数据合法性，避免创建脏数据
 */
const validateRows = () => {
  const validRows = items.value.filter(row => {
    const hasText = String(row.name || '').trim() || String(row.spec || '').trim()
    const hasQty = String(row.quantity ?? '').trim() !== ''
    const hasUnit = String(row.unitPrice ?? '').trim() !== ''
    const hasTotal = String(row.totalPrice ?? '').trim() !== ''
    const meaningful = hasText || hasQty || hasUnit || hasTotal
    // 行数据有效需同时满足: 基础信息 + 基础组合 (数量x单价 | 总价直出)
    return meaningful ? ((hasQty && hasUnit) || hasTotal) : false
  })

  // 三元或简化式校验逻辑
  if (!quotationNo.value.trim()) return ElMessage.warning('请先填写名称'), false
  if (!companyName.value.trim()) return ElMessage.warning('请先填写公司名称归属'), false
  if (!validRows.length) return ElMessage.warning('请先录入或使用 AI 智能粘贴获取报价明细'), false
  if (validRows.length !== items.value.length) return ElMessage.warning('表格存在残缺不完整的数据行，请修正后继续'), false
  
  return true
}

/**
 * 提交并保存报价单到后端 (加入防高频触发防御机制，并增强无效修改判定)
 */
const handleSubmit = async () => {
  if (isSubmitting.value) return // 防重锁防御机制
  if (!validateRows()) return

  const payload = getPayload() // 序列化传输负载

  // 严格脏数据比对防护：查看历史记录编辑时，没修改不让保存！
  if (isEditing.value && editingHistoryId.value) {
     if (JSON.stringify(payload) === originalPayloadStr?.value) {
        return ElMessage.warning('没有做任何修改，无法保存无用的沉余记录！');
     }
  }

  isSubmitting.value = true
  try {
    const result = await saveQuotation(payload, editingHistoryId.value)
    
    if (result) {
      ElMessage.success(editingHistoryId.value ? '修改保存成功！' : '成功创建了一条新报价单！')
      resetDraft() // 持久化成功清理状态环境
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message ?? error.message ?? '入库失败，请稍后刷新重试！')
  } finally {
    isSubmitting.value = false
  }
}

const switchToEdit = () => {
  if (!isViewMode.value) return
  loadRecord({
    id: editingHistoryId.value,
    quotationNo: quotationNo.value,
    companyName: companyName.value,
    remark: remark.value,
    discount: discount.value,
    finalPrice: finalPrice.value,
    isManual: isManualFinalPrice.value,
    items: items.value
  }, 'edit')
}
</script>

<style scoped>
.quotation-page { padding: 0; }
.card {   border-radius: 12px;box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: none;}
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
.meta-area { margin-bottom: 16px; }
.inner-card { border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
.section-title { font-size: 15px; font-weight: 700; color: #1e293b; border-left: 4px solid #6366f1; padding-left: 10px; line-height: 1; margin-bottom: 4px; }
.price-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 6px;}
.price-summary strong { color: #020617; font-size: 15px; }
.price-actions { margin-top: 14px; }
.hint-row { margin-top: 10px; color: #64748b; font-size: 13px; line-height: 1.6; }
@media (max-width: 960px) {
  .price-summary { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .toolbar {
    margin-bottom: 12px;
    gap: 8px;
  }

}
</style>
