<template>
  <header class="memo-header">
    <div class="header-left">
      <h1 class="memo-title">{{ pageTitle }}</h1>
      <div class="memo-badge">{{ activeListScope === 'today' ? 'LIVE' : 'ARCHIVE' }}</div>
    </div>

    <div class="header-right">
      <div class="control-group">
        <el-segmented v-model="scopeModel" :options="listScopeOptions" class="custom-segmented"
          @change="$emit('scope-change')" />
      </div>

      <div class="vertical-spacer"></div>

      <div class="control-group search-container">
        <el-input v-model="keywordModel" placeholder="搜索标题或内容..." :prefix-icon="Search" clearable class="custom-search"
          @input="$emit('keyword-input')" />

        <div class="date-picker-box" :class="{ 'is-expanded': activeListScope === 'history' }">
          <el-date-picker v-model="historyCreatedOnModel" type="date" value-format="YYYY-MM-DD" placeholder="选择创建日期"
            clearable class="custom-date-picker" @change="$emit('date-change')" />
        </div>
      </div>

      <div class="vertical-spacer"></div>

      <div class="control-group">
        <el-segmented v-model="filterModel" :options="filterOptions" class="custom-segmented"
          @change="$emit('filter-change')" />
      </div>

      <div v-if="activeListScope === 'today' && !isGuest" class="action-box">
        <el-button type="primary" :icon="Plus" class="main-add-btn" @click="$emit('create')">
          新建任务
        </el-button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'

const props = defineProps({
  activeListScope: { type: String, default: 'today' },
  keyword: { type: String, default: '' },
  historyCreatedOn: { default: null },
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
  padding: 28px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.memo-title {
  font-size: 24px;
  font-weight: 850;
  letter-spacing: -0.5px;
  margin: 0;
}

.memo-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vertical-spacer {
  width: 1px;
  height: 32px;
  background: #e2e8f0;
  margin: 0 4px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 450px;
}

.custom-search {
  width: 240px;
}

.custom-search :deep(.el-input__wrapper) {
  background-color: #f8fafc;
  box-shadow: none !important;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.date-picker-box {
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.date-picker-box.is-expanded {
  width: 220px;
  opacity: 1;
}

.custom-segmented {
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
}

.main-add-btn {
  border-radius: 10px;
  font-weight: 700;
  height: 40px;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

@media (max-width: 1280px) {
  .search-container {
    min-width: 350px;
  }
  .custom-search {
    width: 180px;
  }
}

@media (max-width: 1024px) {
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  .search-container {
    width: 100%;
    min-width: auto;
  }
}
</style>
