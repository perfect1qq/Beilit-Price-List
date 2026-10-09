<template>
  <el-dialog
    v-model="visible"
    :title="`合同详情 - ${detail?.title || detail?.companyName || ''}`"
    width="920px"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading" style="min-height: 180px;">
      <template v-if="detail">
        <!-- 基础信息概要 -->
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="合同标题">
            <b>{{ detail.title || '-' }}</b>
          </el-descriptions-item>
          <el-descriptions-item label="客户公司">
            {{ detail.companyName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="录入人">
            {{ detail.ownerName || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="合同时间">
            {{ formattedContractDate }}
          </el-descriptions-item>
          <el-descriptions-item label="合同确定总额">
            <strong style="color: #f56c6c; font-size: 15px;">
              ¥ {{ Number(detail.amount || 0).toLocaleString() }}
            </strong>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 合同正文内容 -->
        <div class="content-section-title">合同正文内容</div>
        <div
          v-if="sanitizedContent"
          class="contract-preview-paper"
          v-html="sanitizedContent"
        ></div>
        <el-empty v-else description="暂无合同正文内容" :image-size="60" />

        <!-- 附件材料 -->
        <div v-if="hasAttachments" class="attachments-card">
          <div class="sub-block-title">【合同附件】</div>
          <AttachmentList :raw="detail.attachments" empty-text="暂无附件" />
        </div>
      </template>
    </div>

    <template #footer>
      <FormButtons
        cancel-text="关闭"
        submit-text="前往合同完整页面"
        submit-type="primary"
        @cancel="visible = false"
        @submit="goToContractPage"
      />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import DOMPurify from 'dompurify'
import contractApi from '@/api/contract'
import FormButtons from '@/components/common/FormButtons.vue'
import AttachmentList from '@/components/common/AttachmentList.vue'
import { formatDateOnly } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  contractId?: number | string | null
  initialData?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'navigate', contract: any): void
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
    if (props.contractId) {
      loadDetail(props.contractId)
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

watch(() => props.contractId, (newId) => {
  if (visible.value && newId) {
    loadDetail(newId)
  }
})

const loadDetail = async (id: number | string) => {
  loading.value = true
  try {
    const res: any = await contractApi.get(Number(id))
    if (res?.contract) {
      detail.value = res.contract
    } else if (res) {
      detail.value = res
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '获取合同详情失败')
  } finally {
    loading.value = false
  }
}

const formattedContractDate = computed(() => {
  const d = detail.value?.contractDate || detail.value?.createdAt
  return d ? formatDateOnly(d) : '-'
})

const sanitizedContent = computed(() => {
  if (!detail.value?.content) return ''
  return DOMPurify.sanitize(detail.value.content)
})

const hasAttachments = computed(() => {
  if (!detail.value?.attachments) return false
  const raw = detail.value.attachments
  if (Array.isArray(raw)) return raw.length > 0
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return raw.trim().length > 0
    }
  }
  return false
})

const handleClosed = () => {
  if (!props.initialData) {
    detail.value = null
  }
}

const goToContractPage = () => {
  if (!detail.value?.id) return
  const current = detail.value
  visible.value = false
  emit('navigate', current)
  router.push({
    path: '/contract',
    query: { id: current.id }
  })
}
</script>

<style scoped>
.content-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary, #409eff);
}

.sub-block-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.contract-preview-paper {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 18px 24px;
  background: #ffffff;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.7;
  color: #334155;
  font-size: 14px;
}

.contract-preview-paper :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.contract-preview-paper :deep(th),
.contract-preview-paper :deep(td) {
  border: 1px solid #cbd5e1;
  padding: 6px 10px;
}

.attachments-card {
  margin-top: 14px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
}
</style>
