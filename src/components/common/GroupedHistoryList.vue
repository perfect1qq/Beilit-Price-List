<template>
  <div class="grouped-history-wrapper">
    <el-collapse v-model="activeYearPanels" class="year-collapse">
    <el-collapse-item 
      v-for="yearGroup in data" 
      :key="yearGroup.year" 
      :name="String(yearGroup.year)"
    >
      <template #title>
        <div class="group-title">
          <div class="group-title-main">
            <span class="group-company">{{ yearGroup.year }} 年</span>
            <el-tag size="small" type="primary">{{ yearGroup.count }} 笔</el-tag>
            <el-tag size="small" type="info">{{ yearGroup.companyGroups.length }} 个公司</el-tag>
          </div>
          <div class="group-title-meta">
            <span v-if="yearGroup.latestDate">最新：{{ yearGroup.latestDate }}</span>
            <span v-else>-</span>
          </div>
        </div>
      </template>

      <el-empty v-if="!yearGroup.companyGroups.length" description="该年份暂无记录" :image-size="60" />
      
      <template v-else>
        <el-collapse v-model="activeCompanyPanels" class="company-collapse-inner">
          <el-collapse-item 
            v-for="group in getPagedCompanies(yearGroup)" 
            :key="group.companyName" 
            :name="yearGroup.year + '-' + group.companyName" 
            :id="'company-panel-' + yearGroup.year + '-' + group.companyName"
          >
            <template #title>
              <div class="group-title group-title-sub">
                <div class="group-title-main">
                  <span class="group-company">{{ group.companyName || '未分配公司' }}</span>
                  <el-tag size="small">{{ group.count }} 笔</el-tag>
                </div>
                <div class="group-title-meta">
                  <span v-if="group.latestDate">最新：{{ group.latestDate }}</span>
                  <span v-else>-</span>
                </div>
              </div>
            </template>

            <el-table 
              :data="group.records" 
              stripe 
              border 
              :header-cell-style="TABLE_HEADER_STYLE" 
              class="smart-table nowrap-table" 
              style="width: 100%"
            >
              <slot :records="group.records"></slot>
            </el-table>
          </el-collapse-item>
        </el-collapse>

        <div class="year-pager-wrap" v-if="getYearTotalPages(yearGroup) > 1">
          <PagePagination
            :page="getYearPage(yearGroup.year)"
            :page-size="pageSize"
            :total="yearGroup.companyGroups.length"
            :page-sizes="[]"
            layout="prev, pager, next, jumper"
            :hide-on-single-page="true"
            @page-change="(val: number) => handlePageChange(yearGroup.year, val)"
          />
        </div>
      </template>
    </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TABLE_HEADER_STYLE } from '@/constants/table'
import type { YearGroup } from '@/utils/grouping'
import PagePagination from './PagePagination.vue'

const props = defineProps({
  data: {
    type: Array as () => YearGroup<unknown>[],
    required: true
  }
})

const pageSize = 15
const activeYearPanels = ref<string[]>([])
const activeCompanyPanels = ref<string[]>([])
const yearPages = ref<Record<number, number>>({})

// 数据加载后默认展开最新年份（data 已按年份降序排序，首项即最新）
watch(() => props.data, (groups) => {
  if (groups.length > 0) {
    const latestYear = String(groups[0].year)
    if (!activeYearPanels.value.includes(latestYear)) {
      activeYearPanels.value = [latestYear]
    }
  } else {
    activeYearPanels.value = []
  }
}, { immediate: true })

const getYearPage = (year: number) => yearPages.value[year] || 1

const handlePageChange = (year: number, page: number) => {
  yearPages.value[year] = page
  
  // 切换分页时，自动折叠所有公司面板
  activeCompanyPanels.value = []
}

const getPagedCompanies = (yearGroup: YearGroup<unknown>) => {
  const page = getYearPage(yearGroup.year)
  const start = (page - 1) * pageSize
  return yearGroup.companyGroups.slice(start, start + pageSize)
}

const getYearTotalPages = (yearGroup: YearGroup<unknown>) => {
  return Math.ceil(yearGroup.companyGroups.length / pageSize)
}
</script>

<style scoped>
.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 16px;
}
.group-title-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.group-company {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}
.group-title-meta {
  color: #909399;
  font-size: 13px;
}

.year-collapse {
  border-top: 1px solid var(--el-border-color-lighter);
}
.year-collapse :deep(.el-collapse-item__header) {
  font-size: 15px;
  background-color: #f8fafc;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.year-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.year-collapse :deep(.el-collapse-item__content) {
  padding: 0;
}

.company-collapse-inner {
  border-top: none;
  border-bottom: none;
}
.company-collapse-inner :deep(.el-collapse-item__header) {
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 0 16px;
}
.company-collapse-inner :deep(.el-collapse-item__content) {
  padding: 16px;
  background-color: #f8fafc;
}

.year-pager-wrap {
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
}
</style>
<style scoped>
/* ========== ����ڷ�ҳ ========== */
.year-pager-wrap {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

/* ========== �۵������ʽ ========== */
.year-collapse {
  border: none;
}

:deep(.year-collapse > .el-collapse-item) {
  border: none;
  margin-bottom: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

:deep(.year-collapse .el-collapse-item__header) {
  background-color: #fff;
  font-weight: 700;
  font-size: 15px;
  height: auto !important;
  min-height: 50px;
  line-height: 1.4;
  padding: 12px 16px;
  border-bottom: none;
  color: #1e293b;
}

:deep(.year-collapse .el-collapse-item__header.is-active) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.year-collapse .el-collapse-item__wrap) {
  border: none;
  background-color: #fff;
}

:deep(.year-collapse .el-collapse-item__content) {
  padding: 16px 16px;
}

.company-collapse-inner {
  border: none;
}

:deep(.company-collapse-inner > .el-collapse-item) {
  border: none;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
}

:deep(.company-collapse-inner .el-collapse-item__header) {
  background-color: transparent;
  font-size: 14px;
  height: auto !important;
  min-height: 44px;
  line-height: 1.4;
  padding: 10px 14px;
  border-bottom: none;
  color: #334155;
}

:deep(.company-collapse-inner .el-collapse-item__header.is-active) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.company-collapse-inner .el-collapse-item__wrap) {
  background-color: transparent;
  border: none;
}

:deep(.company-collapse-inner .el-collapse-item__content) {
  padding: 12px 0 4px;
}

/* ========== ���������ʽ ========== */
.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-right: 8px;
  line-height: 1.4;
}

.group-title-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.group-company {
  font-weight: 700;
  color: #1e293b;
  word-break: break-all;
}

.group-title-meta {
  color: #94a3b8;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
}

.group-title-sub {
  padding-left: 0;
}

.group-title-sub .group-company {
  font-weight: 600;
  color: #334155;
}

@media (max-width: 768px) {
  .year-pager-wrap {
    justify-content: center;
  }

  .group-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 0;
  }

  .group-title-main {
    width: 100%;
    gap: 6px;
  }

  .group-company {
    white-space: normal;
  }

  .group-title-meta {
    white-space: normal;
    font-size: 12px;
  }
}
</style>
