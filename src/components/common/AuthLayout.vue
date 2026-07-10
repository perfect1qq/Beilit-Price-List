<template>
  <div class="auth-fullscreen">
    <!-- 100vw x 100vh 全屏无边框双栏布局 -->
    <div class="auth-layout-grid">
      
      <!-- 左侧全屏：品牌介绍与核心产品特性体系 (占满左侧全部屏幕空间) -->
      <div class="intro-pane">
        <!-- 顶部品牌标识 -->
        <div class="intro-header">
          <div class="brand-badge">
            <span class="status-dot"></span>
            <span>BEILIT SMART WMS & ERP</span>
          </div>
        </div>

        <!-- 居中核心介绍文案与精炼三大核心特性 (克制适中、精练有力) -->
        <div class="intro-content">
          <h1 class="intro-title">武汉倍力特物流装备有限公司</h1>

          <!-- 三大核心赋能模块：精锐有力、工业深度 -->
          <div class="intro-features">
            <div class="feature-item">
              <div class="feature-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="feature-text">
                <div class="feature-head">智能报价 · 力学测算</div>
                <div class="feature-desc">针对多规格横梁及立柱进行结构承重与下料测算，快速生成规范报价单与生产工单</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="feature-text">
                <div class="feature-head">业务跟进 · 全链协同</div>
                <div class="feature-desc">定单履约及客户商务沟通全链条留痕，实现业务前台、技术核查与车间制造双向同步</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="feature-text">
                <div class="feature-head">多币种核算 · 资产安全</div>
                <div class="feature-desc">支持海内外美金汇率精算与严格的企业级职能权限体系，捍卫经营核心台账安全</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部版权信息 -->
        <div class="intro-footer">
          <span>© {{ new Date().getFullYear() }} 武汉倍力特物流装备有限公司 · 工业级智能仓储管理平台</span>
        </div>
      </div>

      <!-- 右侧全屏：登录与注册表单操作侧边栏 (宽 480px，全高沉浸) -->
      <div class="form-pane">
        <div class="form-inner">
          <!-- 移动端或小屏幕下展示的品牌名称 -->
          <div class="mobile-header">
            <span>武汉倍力特物流装备有限公司</span>
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
            <span>倍力特内部管理协同系统 · 安全稳定运行</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Connection, Lock } from '@element-plus/icons-vue'

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
</script>

<style scoped>
/* ==================== 100vw x 100vh 全屏沉浸式 ==================== */
.auth-fullscreen {
  width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
  background: #ffffff;
}

.auth-layout-grid {
  display: grid;
  grid-template-columns: 50% 50%;
  min-height: 100vh;
  width: 100%;
}

/* ==================== 左侧全屏介绍区 (完全采用 Home 左侧导航系统主色 #0b1220) ==================== */
.intro-pane {
  position: relative;
  background-color: #0b1220;
  background: linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px 72px;
  overflow: hidden;
  min-height: 100vh;
}

/* 背景精细工业排版装饰光点与网格 */
.intro-pane::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

.intro-header {
  position: relative;
  z-index: 2;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  color: #93c5fd;
  letter-spacing: 0.8px;
  backdrop-filter: blur(8px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}

.intro-content {
  position: relative;
  z-index: 2;
  max-width: 680px;
  margin: auto 0;
  padding: 36px 0;
}

.intro-title {
  font-size: 38px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 36px 0;
  line-height: 1.25;
  letter-spacing: -0.6px;
}

.intro-subtitle {
  font-size: 16.5px;
  color: #94a3b8;
  margin: 0 0 42px 0;
  line-height: 1.6;
}

.intro-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  background: rgba(30, 41, 59, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.25s ease;
}

.feature-item:hover {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(96, 165, 250, 0.4);
}

.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.feature-head {
  font-size: 15.5px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 13.5px;
  color: #94a3b8;
  line-height: 1.5;
}

.intro-footer {
  position: relative;
  z-index: 2;
  font-size: 13px;
  color: #64748b;
}

/* ==================== 右侧全屏操作栏：干净透气 ==================== */
.form-pane {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  border-left: 1px solid #e2e8f0;
  min-height: 100vh;
}

.form-inner {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 540px;
}

.mobile-header {
  display: none;
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 12px;
}

.form-heading {
  margin-bottom: 32px;
}

.pane-title {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.4px;
}

.pane-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.pane-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 统一覆盖表单输入框交互：舒适、不刺眼 */
:deep(.form .el-form-item) {
  margin-bottom: 20px;
}

:deep(.form .el-input__wrapper) {
  border-radius: 8px;
  height: 44px;
  background-color: #f8fafc;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.form .el-input__wrapper:hover) {
  background-color: #ffffff !important;
  box-shadow: 0 0 0 1px #3b82f6 inset, 0 2px 10px rgba(59, 130, 246, 0.08) !important;
}

:deep(.form .el-input__wrapper.is-focus) {
  background-color: #ffffff !important;
  box-shadow: 0 0 0 1.5px #2563eb inset !important;
}

:deep(.form .el-input__inner) {
  color: #0f172a;
  font-size: 14px;
}

:deep(.form .el-input__prefix) {
  color: #94a3b8;
  font-size: 18px;
  margin-right: 4px;
}

:deep(.login-btn) {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 10px;
  background: #2563eb;
  border: none;
  color: #ffffff;
  transition: all 0.2s ease;
}

:deep(.login-btn:hover) {
  background: #1d4ed8;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
}

:deep(.footer-links) {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #64748b;
  font-size: 14px;
}

:deep(.footer-links .el-link) {
  font-weight: 600;
  color: #2563eb;
}

.pane-footer {
  margin-top: 36px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}

/* 响应式断点适配 */
@media (max-width: 1024px) {
  .intro-pane {
    padding: 40px;
  }

  .intro-title {
    font-size: 30px;
  }
}

@media (max-width: 860px) {
  .auth-layout-grid {
    grid-template-columns: 1fr;
  }

  .intro-pane {
    display: none;
  }

  .form-pane {
    border-left: none;
    padding: 32px 24px;
  }

  .mobile-header {
    display: block;
  }
}
</style>
