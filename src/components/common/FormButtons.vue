<template>
  <div class="form-buttons" :class="`is-${align}`">
    <AppButton
      v-if="!hideCancel"
      variant="cancel"
      :icon="cancelIcon === null ? null : cancelIcon"
      :label="cancelText"
      :disabled="cancelDisabled || loading"
      @click="emit('cancel')"
    />
    <AppButton
      v-if="!hideSubmit"
      :variant="submitVariant"
      :type="submitType"
      :icon="submitIcon === null ? null : submitIcon"
      :label="submitText"
      :loading="loading"
      :disabled="submitDisabled"
      :native-type="nativeType"
      @click="emit('submit')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import AppButton from './AppButton.vue'

type Variant =
  | 'add' | 'edit' | 'delete' | 'view'
  | 'save' | 'submit' | 'cancel'
  | 'refresh' | 'back' | 'reset'
  | 'search' | 'download' | 'upload'
  | 'primary' | 'default'

const props = defineProps({
  submitText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  submitVariant: { type: String as () => Variant, default: 'save' },
  submitType: { type: String as () => '' | 'primary' | 'success' | 'warning' | 'danger' | 'info', default: undefined },
  submitIcon: { type: [Object, null] as unknown as () => Component | null, default: undefined },
  cancelIcon: { type: [Object, null] as unknown as () => Component | null, default: undefined },
  loading: { type: Boolean, default: false },
  submitDisabled: { type: Boolean, default: false },
  cancelDisabled: { type: Boolean, default: false },
  hideCancel: { type: Boolean, default: false },
  hideSubmit: { type: Boolean, default: false },
  nativeType: { type: String as () => 'button' | 'submit' | 'reset', default: 'button' },
  align: { type: String as () => 'left' | 'center' | 'right', default: 'right' },
})

const emit = defineEmits<{ cancel: []; submit: [] }>()
</script>

<style scoped>
.form-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}
.form-buttons.is-left { justify-content: flex-start; }
.form-buttons.is-center { justify-content: center; }
.form-buttons.is-right { justify-content: flex-end; }
</style>
