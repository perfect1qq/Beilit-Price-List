<template>
  <!-- 统一承载右侧页面内容的外壳：圆角、阴影、内边距和滚动都在这里收口 -->
  <section class="page-shell">
    <div class="page-shell__scroll">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.page-shell {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.page-shell__scroll {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  background: #fff;
  box-sizing: border-box;
  padding: 18px;
}
</style>
