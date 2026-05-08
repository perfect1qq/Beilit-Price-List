<!--
  @file components/memo/MemoEditorDrawer.vue
  @description 备忘录编辑抽屉组件
-->

<template>
  <el-drawer :model-value="visible" @update:model-value="$emit('update:visible', $event)" :title="isCreate ? '✨ 开启新任务' : '📝 更新任务细节'" size="540px" class="custom-drawer">
    <el-form ref="elFormRef" :model="form" label-position="top">
      <el-form-item label="任务名称" prop="title" :rules="memoTitleRule" required>
        <el-input v-model="form.title" placeholder="输入核心目标" maxlength="100" show-word-limit />
      </el-form-item>

      <div class="form-row">
        <el-form-item label="分类" prop="label" :rules="memoLabelRule" required>
          <el-input v-model="form.label" placeholder="如：工作" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="主题色" style="flex: 1">
          <el-select v-model="form.color">
            <el-option v-for="c in colorOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
      </div>

      <div class="form-row toggle-row">
        <el-form-item label="置顶显示">
          <el-switch v-model="form.pinned" />
        </el-form-item>
        <el-form-item label="完成状态">
          <el-switch v-model="form.completed" />
        </el-form-item>
      </div>

      <el-form-item label="提醒时间">
        <el-date-picker v-model="form.remindAt" type="datetime" placeholder="选择提醒时间" style="width: 100%"
          format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" />
      </el-form-item>

      <el-form-item label="详细说明" prop="content" :rules="memoContentRule" required>
        <el-input v-model="form.content" type="textarea" :rows="10" placeholder="记录具体步骤或想法..." maxlength="2000"
          show-word-limit />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-btns">
        <el-button @click="$emit('update:visible', false)">舍弃修改</el-button>
        <el-button type="primary" :loading="saving" @click="$emit('save')">确 认 保 存</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { memoTitleRule, memoLabelRule, memoContentRule } from '@/utils/formRules'

const elFormRef = ref(null)

defineProps({
  visible: { type: Boolean, required: true },
  isCreate: { type: Boolean, default: true },
  form: { type: Object, required: true },
  saving: { type: Boolean, default: false },
})

defineEmits(['save', 'update:visible'])

defineExpose({ validate: () => elFormRef.value?.validate() })

const colorOptions = [
  { label: '经典蓝', value: 'blue' },
  { label: '薄荷绿', value: 'green' },
  { label: '珊瑚橙', value: 'amber' },
  { label: '丁香紫', value: 'purple' },
  { label: '玫瑰红', value: 'rose' },
]
</script>

<style scoped>
.form-row {
  display: flex;
  gap: 16px;
}
.form-row > * {
  flex: 1;
}
.toggle-row {
  align-items: flex-start;
}
.drawer-btns {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
