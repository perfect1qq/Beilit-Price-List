<template>
  <div class="search-bar" :class="{ 'is-collapsed': collapsed }">
    <el-input
      v-model="keyword"
      :placeholder="placeholder"
      :clearable="clearable"
      :prefix-icon="SearchIcon"
      :size="size"
      :disabled="disabled"
      @clear="handleClear"
      @keyup.enter="handleEnter"
    />
    <slot name="extra" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'

const props = defineProps({
  /** 绑定的搜索关键词 */
  modelValue: {
    type: String,
    default: ''
  },
  /** 输入框占位文本 */
  placeholder: {
    type: String,
    default: '请输入搜索关键词...'
  },
  /** 是否可清除 */
  clearable: {
    type: Boolean,
    default: true
  },
  /** 输入框尺寸 */
  size: {
    type: String,
    default: 'default',
    validator: (val: unknown) => ['large', 'default', 'small'].includes(val as string)
  },
  /** 是否禁用 */
  disabled: {
    type: Boolean,
    default: false
  },
  /** 是否折叠模式（移动端适配） */
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

/** 内部关键词状态 */
const keyword = ref(props.modelValue)

/** 同步外部值变化 */
watch(() => props.modelValue, (newVal) => {
  keyword.value = newVal
})

let timeout: ReturnType<typeof setTimeout> | null = null;

watch(keyword, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit('update:modelValue', newVal)
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      emit('search', newVal)
    }, 400)
  }
})

const handleEnter = () => {
  if (timeout) clearTimeout(timeout)
  emit('search', keyword.value)
}

const handleClear = () => {
  keyword.value = ''
  emit('update:modelValue', '')
  emit('clear')
  if (timeout) clearTimeout(timeout)
  emit('search', '')
}

onBeforeUnmount(() => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
})
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-bar .el-input {
  flex: 1;
  min-width: 200px;
  max-width: 500px;
}

.search-bar.is-collapsed {
  flex-direction: column;
  align-items: stretch;
}

.search-bar.is-collapsed .el-input {
  max-width: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 8px;
  }

  .search-bar .el-input {
    max-width: none;
    width: 100%;
  }
}
</style>
