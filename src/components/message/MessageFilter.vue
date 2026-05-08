<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ pageTitle }}</div>
      <div class="page-subtitle">{{ pageSubtitle }}</div>
    </div>

    <div class="header-tools">
      <SearchBar v-model="keywordModel" placeholder="搜索联系方式或留言内容" @search="$emit('search')">
        <template #extra>
          <el-tag :type="isAdmin ? 'success' : 'info'" effect="plain">
            {{ isAdmin ? '管理员视图' : '测试账号视图' }}
          </el-tag>
        </template>
      </SearchBar>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SearchBar from '@/components/common/SearchBar.vue'

const props = defineProps({
  pageTitle: { type: String, default: '' },
  pageSubtitle: { type: String, default: '' },
  keyword: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false }
})

const emit = defineEmits(['update:keyword', 'search'])

const keywordModel = computed({
  get: () => props.keyword,
  set: (v) => emit('update:keyword', v)
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 16px;
  }

  .page-subtitle {
    font-size: 12px;
    line-height: 1.6;
  }

  .header-tools {
    width: 100%;
  }
}
</style>
