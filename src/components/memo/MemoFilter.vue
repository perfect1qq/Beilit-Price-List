<template>
  <header class="memo-header">
    <div class="header-top">
      <div class="header-left">
        <h1 class="memo-title">{{ pageTitle }}</h1>
        <div class="memo-badge">{{ activeListScope === 'today' ? 'LIVE' : 'ARCHIVE' }}</div>
      </div>

      <div v-if="activeListScope === 'today' && !isGuest" class="header-actions">
        <el-button type="primary" :icon="Plus" class="main-add-btn" @click="$emit('create')">
          新建任务
        </el-button>
      </div>
    </div>

    <div class="header-bottom">
      <div class="bottom-group">
        <el-segmented v-model="scopeModel" :options="listScopeOptions" class="custom-segmented"
          @change="$emit('scope-change')" />
      </div>

      <div class="bottom-group">
        <el-input v-model="keywordModel" placeholder="搜索标题或内容..." :prefix-icon="Search" clearable class="custom-search"
          @input="$emit('keyword-input')" />

        <div class="date-picker-box" :class="{ 'is-expanded': activeListScope === 'history' }">
          <el-date-picker v-model="historyCreatedOnModel" type="date" value-format="YYYY-MM-DD" placeholder="选择创建日期"
            clearable class="custom-date-picker" @change="$emit('date-change')" />
        </div>
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
  activeListScope: { type: String, default: 'today' },
  keyword: { type: String, default: '' },
  historyCreatedOn: { type: String, default: null },
  activeFilter: { type: String, default: 'all' },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:keyword', 'update:historyCreatedOn', 'update:activeFilter', 'update:activeListScope',
  'scope-change', 'keyword-input', 'date-change', 'filter-change', 'create'
])

const listScopeOptions = [
  { label: '今日任务', value: 'today' },
  { label: '往期回顾', value: 'history' }
]

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '待办', value: 'todo' },
  { label: '完成', value: 'done' },
  { label: '置顶', value: 'pinned' }
]

const pageTitle = computed(() => (props.activeListScope === 'today' ? '今日任务' : '往期任务'))

const scopeModel = computed({
  get: () => props.activeListScope,
  set: (v) => emit('update:activeListScope', v)
})

const keywordModel = computed({
  get: () => props.keyword,
  set: (v) => emit('update:keyword', v)
})

const historyCreatedOnModel = computed({
  get: () => props.historyCreatedOn,
  set: (v) => emit('update:historyCreatedOn', v)
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
}

.bottom-group:first-child,
.bottom-group:last-child {
  flex-shrink: 0;
}

.bottom-group:nth-child(2) {
  flex: 1;
  min-width: 200px;
}

.bottom-group .custom-segmented {
  width: auto;
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

.date-picker-box {
  display: none;
}

.date-picker-box.is-expanded {
  display: block;
  flex-shrink: 0;
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
