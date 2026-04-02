<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <div :key="route.path" class="main-transition-wrapper">
          <component :is="Component" />
        </div>
      </transition>
    </router-view>
  </section>
</template>
<script setup>
// router-view
</script>

<style scoped>
.app-main {
  min-height: calc(100vh - 60px);
  width: 100%;
  min-width: 0;
  position: relative;
  overflow-x: hidden;
  overflow-y: visible;
  padding: 80px 20px 20px;
  box-sizing: border-box;
}

.main-transition-wrapper {
  min-width: 0;
  width: 100%;
}


/* 若依标准 fade-transform 动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
