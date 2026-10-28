<template>
  <el-autocomplete
    :model-value="modelValue"
    :fetch-suggestions="queryCustomerSuggestions"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    style="width: 100%;"
    @update:model-value="handleUpdateModelValue"
    @select="handleSelect"
    @blur="emit('blur', $event)"
    @change="emit('change', $event)"
  />
</template>

<script setup lang="ts">
import customerApi from '@/api/customer'
import type { CustomerListItem } from '@/types'

export interface CustomerSuggestionItem {
  value: string
  customer: CustomerListItem
}

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '请输入公司名称，支持从已有客户中联想选择...',
    disabled: false,
    clearable: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', item: CustomerSuggestionItem): void
  (e: 'blur', event: FocusEvent): void
  (e: 'change', value: string | number): void
}>()

const queryCustomerSuggestions = async (
  queryString: string,
  cb: (results: CustomerSuggestionItem[]) => void,
) => {
  try {
    const res = await customerApi.list({
      keyword: queryString || '',
      page: 1,
      pageSize: 20,
    })
    const list = res?.list || []
    const seen = new Set<string>()
    const results: CustomerSuggestionItem[] = []
    for (const c of list) {
      const value = (c.companyName || c.customerName || '').trim()
      if (value && !seen.has(value)) {
        seen.add(value)
        results.push({
          value,
          customer: c,
        })
      }
    }
    cb(results)
  } catch {
    cb([])
  }
}

const handleUpdateModelValue = (val: string | number) => {
  emit('update:modelValue', String(val ?? ''))
}

const handleSelect = (item: Record<string, any>) => {
  const suggestion = item as CustomerSuggestionItem
  if (suggestion?.value !== undefined) {
    emit('update:modelValue', suggestion.value)
  }
  emit('select', suggestion)
}
</script>
