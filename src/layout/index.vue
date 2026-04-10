<template>
  <div class="app-wrapper" :class="{ hideSidebar: !sidebar.opened, mobile: isMobile, mobileSidebarOpen: mobileSidebarOpen }">
    <div v-if="isMobile && mobileSidebarOpen" class="sidebar-mask" @click="closeMobileSidebar"></div>
    <Sidebar class="sidebar-container" />
    <div class="main-container">
      <div class="fixed-header">
        <Navbar @toggle-mobile-sidebar="toggleMobileSidebar" />
      </div>
      <AppMain />
    </div>
    <button
      v-if="isMobile && !mobileSidebarOpen"
      class="mobile-menu-btn"
      type="button"
      aria-label="打开菜单"
      @click="toggleMobileSidebar"
    >
      ☰
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import AppMain from './components/AppMain.vue'

const sidebar = computed(() => ({
  opened: true,
  withoutAnimation: false
}))

const isMobile = ref(false)
const mobileSidebarOpen = ref(false)

const updateViewportState = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) mobileSidebarOpen.value = false
}

const toggleMobileSidebar = () => {
  if (!isMobile.value) return
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

const closeMobileSidebar = () => {
  mobileSidebarOpen.value = false
}

onMounted(() => {
  updateViewportState()
  window.addEventListener('resize', updateViewportState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportState)
})
</script>

<style scoped>
.app-wrapper {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
  --layout-topbar-height: 56px;
  --layout-tags-height: 42px;
  --layout-header-height: calc(var(--layout-topbar-height) + var(--layout-tags-height));
}

.sidebar-container {
  transition: width 0.28s;
  width: 240px !important;
  background-color: #0f172a;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  min-width: 0;
  transition: margin-left .28s;
  margin-left: 240px;
  position: relative;
  background-color: #f5f7fb;
  overflow-x: hidden;
  overflow-y: visible;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - 240px);
  height: var(--layout-header-height);
  transition: width 0.28s;
}

.hideSidebar .sidebar-container {
  width: 54px !important;
}

.hideSidebar .main-container {
  margin-left: 54px;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.sidebar-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
}

.mobile-menu-btn {
  position: fixed;
  right: 14px;
  bottom: 18px;
  z-index: 1003;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 21px;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.3);
}

@media (max-width: 768px) {
  .sidebar-container {
    width: 240px !important;
    transform: translateX(-100%);
    transition: transform .25s ease;
    z-index: 1002;
  }

  .mobileSidebarOpen .sidebar-container {
    transform: translateX(0);
  }

  .main-container {
    margin-left: 0 !important;
    width: 100%;
  }

  .fixed-header {
    width: 100% !important;
  }

  .hideSidebar .main-container,
  .hideSidebar .fixed-header {
    margin-left: 0;
    width: 100%;
  }
}
</style>
