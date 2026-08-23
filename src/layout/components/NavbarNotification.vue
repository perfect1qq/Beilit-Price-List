<template>
  <el-dropdown class="right-menu-item hover-effect" trigger="click" @command="handleNoticeClick">
    <div class="notice-box" :class="{ 'has-unread': unreadApprovalCount > 0 }">
      <div v-if="unreadApprovalCount > 0" class="notice-glow"></div>
      <el-badge :value="unreadApprovalCount" :max="99" :hidden="unreadApprovalCount === 0" class="custom-badge">
        <el-icon class="notice-icon" :class="{ 'is-ringing': isBellRinging }">
          <Bell />
        </el-icon>
      </el-badge>
      <div v-if="unreadApprovalCount > 0" class="active-dot"></div>
    </div>
    <template #dropdown>
      <div class="notice-dropdown">
        <div class="notice-head">
          <div class="notice-head-left">
            <span class="title">系统消息</span>
            <span class="subtitle">最近 10 条通知</span>
          </div>
          <AppButton variant="primary" v-if="noticeList.length" size="small" @click="markAllAsRead">全部已读</AppButton>
        </div>
        <el-scrollbar max-height="320px">
          <div v-if="!noticeList.length" class="notice-empty">
            <el-empty :image-size="40" description="暂无新消息" />
          </div>
          <transition-group name="staggered-list" tag="div">
            <div v-for="(item, index) in noticeList" :key="item.id" class="notice-item"
              :class="{ 'is-read': item.read }" :style="{ '--delay': index * 0.05 + 's' }"
              @click="handleNoticeClick(item)">
              <div class="notice-item-icon" :class="item.type">
                <el-icon>
                  <InfoFilled v-if="item.type === 'quotation_submitted'" />
                  <Bell v-else-if="item.type === 'memo_reminder'" />
                  <CircleCheckFilled v-else />
                </el-icon>
              </div>
              <div class="notice-content">
                <div class="notice-text">{{ item.content }}</div>
                <div class="notice-time">
                  {{ new Date(item.createdAt as string | number | Date).toLocaleString()
                  }}
                </div>
              </div>
              <div class="notice-meta">
                <el-tag v-if="!item.read" size="small" type="danger" effect="plain" round>未读</el-tag>
                <el-icon class="notice-arrow">
                  <ArrowRight />
                </el-icon>
                <el-icon class="notice-delete-btn" title="删除通知" @click.stop="deleteNotification(item, $event)">
                  <Delete v-if="!deletingIds.has(item.id)" />
                  <el-icon v-else class="is-loading">
                    <Loading />
                  </el-icon>
                </el-icon>
              </div>
            </div>
          </transition-group>
        </el-scrollbar>
        <div class="notice-footer">
          <span @click="goNoticePage">查看全部流程通知</span>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import request from "@/utils/request";
import { useUserStore } from "@/stores/user";
import {
  Bell,
  InfoFilled,
  CircleCheckFilled,
  ArrowRight,
  Delete,
  Loading,
} from "@element-plus/icons-vue";
import { useNavbarNotifications } from "@/composables/useNavbarNotifications";

const router = useRouter();
const userStore = useUserStore();
const isAdmin = computed(() => userStore.isAdmin);

const {
  unreadApprovalCount,
  noticeList,
  deletingIds,
  isBellRinging,
  fetchUnreadCount,
  handleNoticeClick,
  markAllAsRead,
  deleteNotification,
  goNoticePage,
} = useNavbarNotifications({ request, router, isAdmin });

const NOTIFICATION_POLL_INTERVAL = 30000;

let notificationTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (userStore.isLoggedIn) fetchUnreadCount();
  notificationTimer = setInterval(() => {
    if (userStore.isLoggedIn) fetchUnreadCount();
  }, NOTIFICATION_POLL_INTERVAL);
});

onUnmounted(() => {
  if (notificationTimer) clearInterval(notificationTimer);
});
</script>

<style scoped>
.notice-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px;
  position: relative;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.notice-box:hover {
  background: #f3f6fb;
}

.notice-icon {
  font-size: 22px;
  color: #64748b;
  transition: all 0.35s ease;
  z-index: 2;
}

.has-unread .notice-icon {
  color: #3b82f6;
}

.notice-box:hover .notice-icon {
  color: #3b82f6;
  transform: scale(1.08);
}

.notice-glow {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.12);
  border-radius: 999px;
  z-index: 1;
  animation: breathing-glow 2.5s infinite ease-in-out;
}

@keyframes breathing-glow {
  0% {
    transform: scale(0.9);
    opacity: 0.12;
  }

  50% {
    transform: scale(1.25);
    opacity: 0.32;
  }

  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

.active-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 6px;
  height: 6px;
  background: #f87171;
  border-radius: 50%;
  z-index: 3;
  box-shadow: 0 0 8px #ef4444;
  animation: strobe 0.8s infinite;
}

@keyframes strobe {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.2;
  }
}

.is-ringing {
  animation: bell-ring 1s both;
}

@keyframes bell-ring {

  0%,
  100% {
    transform: rotate(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: rotate(-10deg);
  }

  20%,
  40%,
  60%,
  80% {
    transform: rotate(10deg);
  }
}

.notice-dropdown {
  width: 360px;
  background: linear-gradient(180deg,
      rgba(255, 255, 255, 0.98),
      rgba(248, 250, 252, 0.96));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
}

.notice-head {
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(135deg,
      rgba(239, 246, 255, 0.95),
      rgba(248, 250, 252, 0.95));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notice-head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notice-head .title {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
}

.notice-head .subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.notice-empty {
  padding: 26px 0 18px;
}

.notice-item {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(241, 245, 249, 0.9);
  transition: all 0.2s ease;
}

.notice-item:hover {
  background: rgba(248, 250, 252, 0.95);
}

.notice-item.is-read {
  opacity: 0.72;
}

.notice-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.notice-item-icon.quotation_submitted {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.notice-item-icon.memo_reminder {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.notice-item-icon.default {
  background: linear-gradient(135deg, #22c55e, #14b8a6);
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-text {
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
}

.notice-time {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.notice-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.notice-arrow {
  color: #cbd5e1;
  transition: transform 0.2s ease, color 0.2s ease;
}

.notice-item:hover .notice-arrow {
  color: #64748b;
  transform: translateX(2px);
}

.notice-delete-btn {
  color: #cbd5e1;
  font-size: 14px;
  opacity: 0;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.notice-item:hover .notice-delete-btn {
  opacity: 1;
}

.notice-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.notice-footer {
  padding: 10px 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  text-align: center;
  background: rgba(248, 250, 252, 0.96);
}

.notice-footer span {
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
}

.notice-footer span:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .notice-dropdown {
    width: min(92vw, 360px);
  }
}
</style>

