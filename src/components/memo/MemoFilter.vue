<template>
  <header class="memo-header">
    <div class="header-top">
      <div class="header-left">
        <h1 class="memo-title">待办任务</h1>
        <div class="memo-badge">LIVE</div>
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

      <div class="bottom-group">
        <el-segmented v-model="filterModel" :options="filterOptions" class="custom-segmented"
          @change="$emit('filter-change')" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'

const props = defineProps({
  keyword: { type: String, default: '' },
  activeFilter: { type: String, default: 'all' },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:keyword', 'update:activeFilter',
  'keyword-input', 'filter-change', 'create'
])

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '待办', value: 'todo' },
  { label: '完成', value: 'done' },
  { label: '置顶', value: 'pinned' }
]

const keywordModel = computed({
  get: () => props.keyword,
  set: (v) => emit('update:keyword', v)
})

const filterModel = computed({
  get: () => props.activeFilter,
  set: (v) => emit('update:activeFilter', v)
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
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
}

.memo-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  background: #eff6ff;
  color: #3b82f6;
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
  background-color: #f8fafc;
  box-shadow: none !important;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.custom-segmented {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
}

.main-add-btn {
  border-radius: 8px;
  font-weight: 600;
  height: 36px;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.18);
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
