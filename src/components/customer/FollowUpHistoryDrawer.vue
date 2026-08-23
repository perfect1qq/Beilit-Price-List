<template>
  <el-drawer
    :model-value="modelValue"
    :title="drawerTitle"
    direction="rtl"
    size="560px"
    destroy-on-close
    append-to-body
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="fu-drawer">
      <div class="drawer-toolbar">
        <span class="record-count">
          共 <b>{{ filteredFollowUps.length }}</b> 条跟进记录
        </span>
        <SearchBar
          v-model="searchKeyword"
          placeholder="搜索跟进内容或操作人..."
          style="flex: 1; margin: 0 16px; max-width: 250px;"
          @search="searchKeyword = $event"
        />
        <AppButton variant="add" v-if="canCreate" size="small" @click="handleAdd">
          添加跟进
        </AppButton>
      </div>

      <div v-if="filteredFollowUps.length > 0" class="fu-list">
        <div v-for="item in filteredFollowUps" :key="item.id" class="fu-card">
          <div class="fu-card-header">
            <div class="fu-operator">
              <span class="fu-avatar">{{ (item.operatorName || '?').charAt(0) }}</span>
              <span class="fu-name">{{ item.operatorName }}</span>
            </div>
            <div class="fu-header-right">
              <span class="fu-time">{{ formatDateTime(item.createdAt || '') }}</span>
              <AppButton variant="delete" v-if="!isGuest" size="small" class="fu-delete" @click="handleDelete(item)">
                删除
              </AppButton>
            </div>
          </div>
          <p class="fu-content">{{ item.content }}</p>
          <div v-if="item.nextTime" class="fu-card-footer">
            <el-icon class="fu-next-icon"><Calendar /></el-icon>
            <span>下次跟进：{{ formatDate(item.nextTime) }}</span>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无跟进记录" :image-size="100" />
    </div>

    <FollowUpFormDialog
      v-model="followUpDialogVisible"
      :form-data="followUpFormData"
      @submit="handleFollowUpSubmit"
      append-to-body
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { PropType } from 'vue'
import { Plus, Calendar, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FollowUpFormDialog from './FollowUpFormDialog.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import customerApi from '@/api/customer'
import { formatDate, formatDateTime } from '@/utils/date'
import { confirmAndDelete } from '@/utils/dialog'
import type { FollowUpData, FollowUpCreatePayload } from '@/types'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customerId: { type: Number, default: 0 },
  customerName: { type: String, default: '' },
  followUps: { type: Array as PropType<FollowUpData[]>, default: () => [] },
  canCreate: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'follow-up-change'])

const followUpDialogVisible = ref(false)
const followUpFormData = reactive<FollowUpCreatePayload>({ content: '', nextTime: '' })

const drawerTitle = computed(() => {
  const name = props.customerName || '客户'
  return `${name} · 跟进记录`
})

const searchKeyword = ref('')

const filteredFollowUps = computed(() => {
  if (!searchKeyword.value) return props.followUps
  const kw = searchKeyword.value.toLowerCase()
  return props.followUps.filter(item => 
    item.content.toLowerCase().includes(kw) || 
    (item.operatorName && item.operatorName.toLowerCase().includes(kw))
  )
})

const handleAdd = () => {
  followUpFormData.content = ''
  followUpFormData.nextTime = ''
  followUpDialogVisible.value = true
}

const handleFollowUpSubmit = async (data: FollowUpCreatePayload) => {
  if (!props.customerId) {
    ElMessage.error('客户信息不存在')
    return
  }
  try {
    await customerApi.addFollowUp(props.customerId, data)
    ElMessage.success('跟进记录添加成功')
    followUpDialogVisible.value = false
    emit('follow-up-change')
  } catch {
    ElMessage.error('添加跟进记录失败')
  }
}

const handleDelete = async (item: FollowUpData) => {
  const ok = await confirmAndDelete(
    '确定要删除这条跟进记录吗？',
    () => customerApi.deleteFollowUp(item.id),
    {
      title: '删除确认',
      confirmText: '确定删除',
      successMsg: '跟进记录删除成功',
      errorMsg: '删除跟进记录失败'
    }
  )
  if (ok) emit('follow-up-change')
}
</script>

<style scoped>
.fu-drawer {
  padding: 0 4px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.record-count {
  font-size: 13px;
  color: #64748b;
}

.record-count b {
  color: #3b82f6;
  font-size: 15px;
  margin: 0 2px;
}

/* 跟进记录列表 */
.fu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fu-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.fu-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.08);
}

/* 卡片头部：左侧操作人，右侧时间+删除 */
.fu-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.fu-operator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fu-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fu-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.fu-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fu-time {
  font-size: 12px;
  color: #94a3b8;
}

.fu-delete {
  padding: 0;
  height: auto;
  min-height: 0;
}

/* 卡片内容 */
.fu-content {
  margin: 0;
  color: #303133;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 卡片底部：下次跟进提示 */
.fu-card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
  font-size: 12px;
  color: #d97706;
}

.fu-next-icon {
  font-size: 14px;
}
</style>

