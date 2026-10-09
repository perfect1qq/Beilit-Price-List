<template>
  <el-dialog
    v-model="visible"
    :title="`报价单详情 - ${detail?.name || detail?.companyName || ''}`"
    width="920px"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading" style="min-height: 180px;">
      <template v-if="detail">
        <!-- 基础信息概要 -->
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="报价单名称">
            <b>{{ detail.name || '-' }}</b>
          </el-descriptions-item>
          <el-descriptions-item label="客户公司">
            {{ detail.companyName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交人">
            {{ detail.ownerName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="报价日期">
            {{ detail.quotationDate ? new Date(detail.quotationDate).toLocaleDateString() : (detail.createDate || '-') }}
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag
              :type="detail.status === 'approved' ? 'success' : (detail.status === 'rejected' ? 'danger' : 'warning')"
              size="small"
            >
              {{ detail.status === 'approved' ? '已通过' : (detail.status === 'rejected' ? '已拒绝' : '草稿/待定') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="成交总额">
            <strong style="color: #f56c6c; font-size: 15px;">
              ¥ {{ Number(detail.finalPrice || 0).toLocaleString() }}
            </strong>
            <span v-if="detail.discount" style="color: #909399; font-size: 12px; margin-left: 6px;">
              ({{ detail.discount }}% 折扣)
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.remark" label="备注" :span="3">
            {{ detail.remark }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 货架明细表格 -->
        <el-table
          :data="quotationItems"
          border
          stripe
          size="small"
          style="width: 100%; max-height: 420px; overflow-y: auto;"
        >
          <el-table-column type="index" label="序号" width="55" align="center" />
          <AutoFitColumn :data="quotationItems" prop="name" label="项目名称" :min="140" :max="260" align="left" show-overflow-tooltip />
          <AutoFitColumn :data="quotationItems" prop="spec" label="规格型号" :min="160" :max="300" align="left" show-overflow-tooltip />
          <AutoFitColumn :data="quotationItems" prop="color" label="颜色" :min="80" :max="120" align="center" />
          <AutoFitColumn :data="quotationItems" label="数量" :min="80" :max="120" align="center">
            <template #default="{ row }">
              {{ row.quantity ?? row.qty ?? '-' }} {{ row.unit || '' }}
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="quotationItems" label="单价(元)" :min="100" :max="140" align="right">
            <template #default="{ row }">
              ¥ {{ Number(row.price ?? row.unitPrice ?? 0).toFixed(2) }}
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="quotationItems" label="金额(元)" :min="110" :max="150" align="right">
            <template #default="{ row }">
              <b style="color: #409eff;">¥ {{ Number(row.total ?? row.amount ?? row.totalPrice ?? ((Number(row.quantity ?? row.qty ?? 0)) * (Number(row.price ?? row.unitPrice ?? 0)))).toFixed(2) }}</b>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="quotationItems" prop="remark" label="备注" :min="110" :max="220" align="left" show-overflow-tooltip />
        </el-table>
      </template>
    </div>

    <template #footer>
      <FormButtons
        cancel-text="关闭"
        submit-text="前往报价单完整页面"
        submit-type="primary"
        @cancel="visible = false"
        @submit="goToQuotationPage"
      />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import quotationApi from '@/api/quotation'
import AutoFitColumn from '@/components/common/AutoFitColumn.vue'
import FormButtons from '@/components/common/FormButtons.vue'

const props = defineProps<{
  modelValue: boolean
  quotationId?: number | string | null
  initialData?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'navigate', quotation: any): void
}>()

const router = useRouter()
const visible = ref(props.modelValue)
const loading = ref(false)
const detail = ref<any>(props.initialData || null)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    if (props.initialData) {
      detail.value = props.initialData
    }
    if (props.quotationId) {
      loadDetail(props.quotationId)
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.initialData, (val) => {
  if (val) {
    detail.value = val
  }
})

watch(() => props.quotationId, (newId) => {
  if (visible.value && newId) {
    loadDetail(newId)
  }
})

const loadDetail = async (id: number | string) => {
  loading.value = true
  try {
    const res: any = await quotationApi.get(Number(id))
    if (res?.quotation) {
      detail.value = res.quotation
    } else if (res) {
      detail.value = res
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '获取报价单详情失败')
  } finally {
    loading.value = false
  }
}

const quotationItems = computed(() => {
  if (!detail.value?.items) return []
  const raw = detail.value.items
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
})

const handleClosed = () => {
  if (!props.initialData) {
    detail.value = null
  }
}

const goToQuotationPage = () => {
  if (!detail.value?.id) return
  const current = detail.value
  visible.value = false
  emit('navigate', current)
  router.push({
    path: '/quotation/history',
    query: { id: current.id, mode: 'view' }
  })
}
</script>
