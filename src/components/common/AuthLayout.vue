<template>
  <div class="auth-fullscreen">
    <!-- ============ 极光渐变背景层 ============ -->
    <!-- 深蓝基底 -->
    <div class="bg-base"></div>
    <!-- 流动极光光带 -->
    <div class="aurora aurora-1"></div>
    <div class="aurora aurora-2"></div>
    <div class="aurora aurora-3"></div>
    <div class="aurora aurora-4"></div>
    <!-- 细网格纹理 -->
    <div class="bg-grid"></div>
    <!-- 噪点层:增加质感 -->
    <div class="bg-noise"></div>

    <!-- ============ 玻璃拟态卡片 ============ -->
    <div class="glass-card">
      <!-- 品牌标识 -->
      <div class="brand-row">
        <div class="brand-mark">
          <span class="brand-letter">B</span>
        </div>
        <div class="brand-name">
          <span class="brand-zh">倍力特</span>
          <span class="brand-en">BEILIT</span>
        </div>
      </div>

      <div class="form-heading">
        <h2 class="pane-title">{{ cardTitle }}</h2>
        <p class="pane-subtitle">{{ cardSubtitle }}</p>
      </div>

      <!-- 表单区域插槽 -->
      <div class="pane-slot">
        <slot></slot>
      </div>

      <div class="pane-footer">
        © {{ year }} 武汉倍力特物流装备有限公司
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineProps({
  cardTitle: {
    type: String,
    required: true
  },
  cardSubtitle: {
    type: String,
    required: true
  }
})

const year = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* ==================== 浅蓝白基底 ==================== */
.auth-fullscreen {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
}

.bg-base {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 10%, #dbeafe 0%, transparent 55%),
    radial-gradient(ellipse at 80% 90%, #e0e7ff 0%, transparent 55%),
    linear-gradient(160deg, #f8fafc 0%, #eef2fa 45%, #e8edf7 100%);
}

/* ==================== 流动浅蓝光晕 ==================== */
.aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  will-change: transform, opacity;
  mix-blend-mode: multiply;
}

.aurora-1 {
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%);
  top: -180px;
  left: -160px;
  animation: drift-1 24s ease-in-out infinite;
}

.aurora-2 {
  width: 540px;
  height: 540px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.22) 0%, transparent 70%);
  bottom: -200px;
  right: -140px;
  animation: drift-2 28s ease-in-out infinite;
}

.aurora-3 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.28) 0%, transparent 70%);
  top: 40%;
  left: 55%;
  animation: drift-3 32s ease-in-out infinite;
}

.aurora-4 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(191, 219, 254, 0.3) 0%, transparent 70%);
  top: 15%;
  right: 25%;
  animation: drift-4 26s ease-in-out infinite;
}

@keyframes drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.85; }
  50% { transform: translate(80px, 100px) scale(1.12); opacity: 1; }
}

@keyframes drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
  50% { transform: translate(-70px, -80px) scale(1.15); opacity: 1; }
}

@keyframes drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
  50% { transform: translate(-60px, 70px) scale(0.92); opacity: 0.95; }
}

@keyframes drift-4 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.75; }
  50% { transform: translate(50px, -60px) scale(1.1); opacity: 1; }
}

/* 细网格纹理 */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  mask-image: radial-gradient(ellipse at center, black 25%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 78%);
}

/* 噪点层:增加质感 */
.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ==================== 玻璃拟态卡片 ==================== */
.glass-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
  padding: 44px 40px 32px;
  /* 玻璃拟态:半透明白 + 毛玻璃模糊 */
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 20px 50px -12px rgba(37, 99, 235, 0.18),
    0 8px 24px -8px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  animation: card-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 品牌标识 */
.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 18px rgba(37, 99, 235, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
  position: relative;
}

.brand-mark::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, transparent 50%);
  pointer-events: none;
}

.brand-letter {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 1;
}

.brand-name {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-zh {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.5px;
}

.brand-en {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 2px;
  margin-top: 2px;
}

/* 标题区 */
.form-heading {
  margin-bottom: 26px;
}

.pane-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.4px;
}

.pane-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.55;
}

.pane-slot {
  flex: 1;
}

.pane-footer {
  margin-top: 28px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  letter-spacing: 0.2px;
}

/* ==================== 表单输入框 ==================== */
:deep(.form .el-form-item) {
  margin-bottom: 18px;
}

:deep(.form .el-input__wrapper) {
  border-radius: 12px;
  height: 46px;
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #e5e7eb inset;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.form .el-input__wrapper:hover) {
  background-color: #ffffff !important;
  box-shadow: 0 0 0 1px #cbd5e1 inset !important;
}

:deep(.form .el-input__wrapper.is-focus) {
  background-color: #ffffff !important;
  box-shadow:
    0 0 0 1.5px #3b82f6 inset,
    0 0 0 4px rgba(59, 130, 246, 0.12) !important;
}

:deep(.form .el-input__inner) {
  color: #0f172a;
  font-size: 14px;
}

:deep(.form .el-input__inner::placeholder) {
  color: #94a3b8;
}

:deep(.form .el-input__prefix) {
  color: #94a3b8;
  font-size: 18px;
  margin-right: 6px;
  transition: color 0.22s ease;
}

:deep(.form .el-input__wrapper.is-focus .el-input__prefix),
:deep(.form .el-input__wrapper.is-focus .el-input__prefix-inner svg) {
  color: #3b82f6;
}

:deep(.form .el-input__suffix) {
  color: #94a3b8;
}

:deep(.form .el-input__wrapper .el-input__icon:hover) {
  color: #3b82f6;
}

/* 表单校验错误信息 */
:deep(.form .el-form-item__error) {
  font-size: 12px;
  padding-top: 4px;
  color: #ef4444;
}

/* ==================== 主按钮:蓝色渐变 ==================== */
:deep(.login-btn) {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: #ffffff;
  letter-spacing: 0.5px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.32);
}

:deep(.login-btn:hover) {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #4f8ef7 0%, #2f6ef0 100%) !important;
  box-shadow: 0 8px 22px rgba(37, 99, 235, 0.42);
}

:deep(.login-btn:active) {
  transform: translateY(0);
  box-shadow: 0 3px 12px rgba(37, 99, 235, 0.32);
}

:deep(.login-btn.is-loading) {
  opacity: 0.9;
}

/* ==================== 底部链接 ==================== */
:deep(.footer-links) {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #64748b;
  font-size: 14px;
}

:deep(.footer-links .el-link) {
  font-weight: 600;
  color: #3b82f6;
  --el-link-text-color: #3b82f6;
  --el-link-hover-text-color: #2563eb;
}

:deep(.footer-links .el-link:hover) {
  color: #2563eb;
}

/* ==================== 响应式 ==================== */
@media (max-width: 520px) {
  .glass-card {
    max-width: 100%;
    margin: 16px;
    padding: 34px 24px 26px;
    border-radius: 16px;
  }

  .pane-title {
    font-size: 21px;
  }

  .aurora {
    filter: blur(60px);
  }
}

/* 尊重用户动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .aurora,
  .glass-card {
    animation: none !important;
  }
}
</style>
