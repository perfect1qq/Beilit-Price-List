<template>
  <el-drawer :model-value="visible" @update:model-value="$emit('update:visible', $event)"
    :title="isCreate ? '开启新任务' : '更新任务细节'" size="540px" class="custom-drawer">
    <el-form ref="elFormRef" :model="localForm" label-position="top">
      <el-form-item label="任务名称" prop="title" :rules="memoTitleRule" required>
        <el-input v-model="localForm.title" placeholder="输入核心目标" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="主题色">
        <el-select v-model="localForm.color" style="width: 100%">
          <el-option v-for="c in colorOptions" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="提醒时间">
        <el-date-picker v-model="localForm.remindAt" type="datetime" placeholder="选择提醒时间" style="width: 100%"
          format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" />
      </el-form-item>

      <el-form-item label="详细说明" prop="content" :rules="memoContentRule" required>
        <el-input v-model="localForm.content" type="textarea" :rows="10" placeholder="记录具体步骤或想法..." maxlength="2000"
          show-word-limit />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-btns">
        <AppButton variant="cancel" @click="$emit('update:visible', false)">舍弃修改</AppButton>
        <AppButton variant="submit" :loading="saving" @click="$emit('save')">确 认 保 存</AppButton>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { PropType } from "vue";
import type { FormInstance } from "element-plus";
import { memoTitleRule, memoContentRule } from "@/utils/formRules";
import type { MemoCreatePayload } from "@/types";

const elFormRef = ref<FormInstance | null>(null);

const props = defineProps({
  visible: { type: Boolean, required: true },
  isCreate: { type: Boolean, default: true },
  form: { type: Object as PropType<MemoCreatePayload>, required: true },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(["save", "update:visible", "update:form"]);

const localForm = computed({
  get: () => props.form,
  set: (val) => emit("update:form", val),
});

defineExpose({ validate: () => elFormRef.value?.validate() });

const colorOptions = [
  { label: "经典蓝", value: "blue" },
  { label: "薄荷绿", value: "green" },
  { label: "珊瑚橙", value: "amber" },
  { label: "丁香紫", value: "purple" },
  { label: "玫瑰红", value: "rose" },
];
</script>

<style scoped>
</style>

