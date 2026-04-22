/**
 * @module layout/components/AppMain
 * @description 主内容区域组件（增强版）
 * 
 * 功能：
 * - 路由视图渲染区域
 * - 页面切换过渡动画
 * - **keep-alive 缓存**：保留表单状态，避免重复加载
 * - 异步组件加载骨架屏
 * 
 * keep-alive 策略：
 * - 报价单编辑器、横梁载重编辑器：缓存以保留表单输入
 * - 其他页面：不缓存，每次进入重新加载最新数据
 */

<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <div :key="route.fullPath" class="main-transition-wrapper">
          <!-- 
            keep-alive: 缓存指定组件，避免重复渲染
            include: 只缓存匹配名称的组件（需组件定义 name 选项）
            max: 最大缓存实例数，超出时淘汰最久未使用的
          -->
          <keep-alive :include="cachedViews" :max="5">
            <Suspense timeout="0">
              <component :is="Component" :key="route.fullPath" />
              <template #fallback>
                <div class="route-skeleton">
                  <el-skeleton animated :rows="6" />
                  <el-skeleton animated :rows="6" />
                </div>
              </template>
            </Suspense>
          </keep-alive>
        </div>
      </transition>
    </router-view>
  </section>
</template>

<script setup>
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
  'MessageManagement'
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

.route-skeleton {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  display: grid;
  gap: 14px;
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
