<template>
  <div class="home-page">
    <el-card class="hero-card" shadow="never">
      <template #header>
        <CardHeader title="工作台" />
      </template>

      <div class="hero">
        <h2 class="title">欢迎回来，{{ userName }}</h2>
        <p class="desc">这里是系统首页，也是左侧导航首次进入时显示的默认页面。</p>
      </div>
    </el-card>

    <div class="grid">
      <div class="quick-card" @click="router.push(quotationRoute)">
        <el-icon class="card-icon">
          <Document />
        </el-icon>
        <div class="card-title">报价单</div>
        <div class="card-desc">查看与处理普通报价单</div>
      </div>

      <div class="quick-card" @click="router.push(beamRoute)">
        <el-icon class="card-icon">
          <List />
        </el-icon>
        <div class="card-title">横梁载重单</div>
        <div class="card-desc">进入横梁载重单与历史记录</div>
      </div>

      <div class="quick-card" @click="router.push('/usd-conversion')">
        <el-icon class="card-icon">
          <Money />
        </el-icon>
        <div class="card-title">美金换算</div>
        <div class="card-desc">统一使用圆角风格的换算工具</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Document, List, Money } from '@element-plus/icons-vue'
import CardHeader from '@/components/common/CardHeader.vue'

const router = useRouter()
const userStore = useUserStore()
const userName = computed(() => userStore.displayName || '管理员')
const quotationRoute = computed(() =>
  userStore.hasPermission('quotation:write') ? '/quotation' : '/quotation/history'
)
const beamRoute = computed(() =>
  userStore.hasPermission('beam:write') ? '/beam-quotation' : '/beam-quotation/history'
)
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.hero-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.desc {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.quick-card {
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 20px;
  min-height: 150px;
  transition: all 0.2s ease;
}

.quick-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.card-icon {
  font-size: 24px;
  color: #3b82f6;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-desc {
  margin-top: 8px;
  color: #64748b;
  line-height: 1.5;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home-page {
    gap: 12px;
  }

  .title {
    font-size: 20px;
  }

  .desc {
    font-size: 13px;
  }

  .quick-card {
    min-height: 120px;
    padding: 16px;
  }
}
</style>