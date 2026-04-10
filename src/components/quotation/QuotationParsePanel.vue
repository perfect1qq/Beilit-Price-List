<template>
  <el-card v-if="!isViewMode" shadow="never" class="inner-card">
    <template #header>
      <div class="section-title">粘贴 Word 内容</div>
    </template>
    <el-input
      :model-value="rawText"
      type="textarea"
      :rows="8"
      resize="vertical"
      placeholder="把 Word 里复制出来的表格直接粘贴到这里，再点击“解析粘贴内容”"
      @update:model-value="$emit('update:rawText', $event)"
    />
    <div class="hint-row">
      支持名称/规格/数量/单价/总价的任意组合，缺少的列会自动隐藏；总价缺失时会用 数量 × 单价 自动计算。
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  isViewMode: { type: Boolean, default: false },
  rawText: { type: String, default: '' }
})

defineEmits(['update:rawText'])
</script>

<style scoped>
.inner-card { border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
.section-title { font-size: 15px; font-weight: 700; color: #1e293b; border-left: 4px solid #6366f1; padding-left: 10px; line-height: 1; margin-bottom: 4px; }
.hint-row { margin-top: 10px; color: #64748b; font-size: 13px; line-height: 1.6; }
</style>
