

<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <div :key="route.fullPath" class="main-transition-wrapper">

          <keep-alive :include="cachedViews" :max="5">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </div>
      </transition>
    </router-view>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * 需要缓存的视图组件名称列表
 *
 * 这些页面使用 keep-alive 缓存：
 * - QuotationList / BeamQuotationList: 编辑器表单状态保留
 * - 用户在这些页面填写数据后切换再回来，数据不会丢失
 *
 * 注意：组件必须定义 name 属性才能被缓存匹配
 */
const cachedViews = ref([
  'QuotationList',
  'BeamQuotationList',
  'QuotationHistory',
  'BeamQuotationHistory',
  'MessageManagement',
  'NotepadView'
])
</script>

<style scoped>
.app-main {
  min-height: calc(100vh - var(--layout-header-height));
  width: 100%;
  min-width: 0;
  position: relative;
  overflow-x: hidden;
  overflow-y: visible;
  padding: calc(var(--layout-header-height) + 12px) 20px 20px;
  box-sizing: border-box;
}

.main-transition-wrapper {
  min-width: 0;
  width: 100%;
}

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

@media (max-width: 768px) {
  .app-main {
    padding: calc(var(--layout-header-height) + 10px) 10px 12px;
  }
}
</style>
