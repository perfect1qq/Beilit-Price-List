<template>
  <div class="card-header">
    <span class="title">{{ title }}</span>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header .title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .card-header .title {
    font-size: 16px;
    width: 100%;
  }
}
</style>
