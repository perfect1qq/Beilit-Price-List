<template>
  <div class="material-calculation-layout">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// Parent layout component for material calculations
</script>

<style scoped>
.material-calculation-layout {
  height: 100%;
  width: 100%;
}
</style>
