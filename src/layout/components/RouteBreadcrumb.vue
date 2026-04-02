<template>
  <!-- 全局动态面包屑：只根据当前路由 meta 生成，不在页面里写死 -->
  <el-breadcrumb separator="/" class="route-breadcrumb">
    <el-breadcrumb-item :to="{ path: homePath }">首页</el-breadcrumb-item>

    <el-breadcrumb-item
      v-for="(item, index) in items"
      :key="`${item.label}-${index}`"
      :to="index === items.length - 1 || !item.path ? undefined : { path: item.path }"
    >
      {{ item.label }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const homePath = '/quotation'

/**
 * 统一把 breadcrumb 配置规范化为 { label, path } 结构。
 * 兼容旧的字符串数组写法，避免一次性改动太多路由。
 */
const normalizeItem = (entry) => {
  if (typeof entry === 'string') return { label: entry, path: '' }
  if (!entry || typeof entry !== 'object') return { label: '', path: '' }
  return {
    label: entry.label || entry.title || '',
    path: entry.path || ''
  }
}

const items = computed(() => {
  const raw = route.meta?.breadcrumb
  if (Array.isArray(raw) && raw.length) {
    return raw.map(normalizeItem).filter(item => item.label)
  }

  const title = route.meta?.title
  return title ? [{ label: title, path: '' }] : []
})
</script>

<style scoped>
.route-breadcrumb {
  font-size: 14px;
  white-space: nowrap;
}

:deep(.el-breadcrumb__inner) {
  font-weight: 500;
  color: #64748b;
}
</style>
