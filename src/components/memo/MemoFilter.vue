<template>
  <header class="memo-header">
    <div class="header-top">
      <div class="header-left">
        <h1 class="memo-title">待办任务</h1>
      </div>

      <div v-if="!isGuest" class="header-actions">
        <el-button type="primary" :icon="Plus" class="main-add-btn" @click="$emit('create')">
          新建任务
        </el-button>
      </div>
    </div>

    <div class="header-bottom">
      <div class="bottom-group search-group">
        <el-input v-model="keywordModel" placeholder="搜索标题或内容..." :prefix-icon="Search" clearable class="custom-search"
          @input="$emit('keyword-input')" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'

const props = defineProps({
  keyword: { type: String, default: '' },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:keyword', 'keyword-input', 'create'])

const keywordModel = computed({
  get: () => props.keyword,
  set: (v) => emit('update:keyword', v)
})
</script>

<style scoped>
.memo-header {
  padding: 24px 28px;
  border-bottom: 1px solid #f1f5f9;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.memo-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-bottom {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bottom-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.custom-search {
  flex: 1;
  min-width: 140px;
}

.custom-search :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  box-shadow: none !important;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.main-add-btn {
  border-radius: 8px;
  font-weight: 600;
  height: 36px;
  padding: 0 20px;
}

@media (max-width: 1024px) {
  .header-bottom {
    flex-direction: column;
    gap: 12px;
  }

  .bottom-group {
    width: 100%;
  }
}
</style>
