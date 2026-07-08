<template>
  <div class="navbar-shell">
    <div class="navbar-top">
      <el-button class="mobile-nav-trigger" :icon="Menu" circle size="small" @click="emit('toggle-mobile-sidebar')" />
      <div class="brand-area">
        <div class="brand-mark">BT</div>
        <div class="brand-copy">
          <span class="brand-title">倍力特管理平台</span>
        </div>
      </div>

      <div class="right-menu">
        <NavbarNotification v-if="device !== 'mobile'" />

        <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
          <div class="avatar-wrapper">
            <el-avatar :size="32" class="user-avatar clickable-avatar" :src="avatarUrl" @click.stop="showAvatarDialog">
              {{ userInitial }}
            </el-avatar>
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <el-icon class="el-icon-caret-bottom">
                <CaretBottom />
              </el-icon>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goHome">首页</el-dropdown-item>
              <el-dropdown-item @click="changePassDialog.visible = true">
                <span style="display: block">修改密码</span>
              </el-dropdown-item>
              <el-dropdown-item divided @click="logout">
                <span style="display: block">退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="navbar-tags">
      <TagsView />
    </div>

    <AsyncDialog ref="changePassDialogRef" v-model="changePassDialog.visible" title="修改个人密码" :width="420"
      :append-to-body="true">
      <el-form :model="changePassDialog.form" label-position="top">
        <el-form-item label="当前密码" required>
          <el-input v-model="changePassDialog.form.oldPassword" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="设置新密码" required>
          <el-input v-model="changePassDialog.form.newPassword" type="password" show-password
            placeholder="新密码建议包含字母和数字组合" />
        </el-form-item>
        <el-form-item label="确认新密码" required>
          <el-input v-model="changePassDialog.form.confirmPassword" type="password" show-password
            placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer="{ loading }">
        <el-button @click="
          changePassDialog.form = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
          };
        changePassDialog.visible = false;
        ">取消</el-button>
        <el-button type="primary" :loading="loading" @click="confirmChangePass">提交</el-button>
      </template>
    </AsyncDialog>

    <AvatarCropDialog v-model="avatarDialogVisible" :avatar-url="avatarUrl" :user-initial="userInitial"
      @uploaded="onAvatarUploaded" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import request from "@/utils/request";
import { useUserStore } from "@/stores/user";
import TagsView from "./TagsView.vue";
import NavbarNotification from "./NavbarNotification.vue";
import { logoutByUser } from "@/utils/authSession";
import { CaretBottom, Menu } from "@element-plus/icons-vue";
import { useNavbarPasswordDialog } from "@/composables/useNavbarPasswordDialog";
import AsyncDialog from "@/components/common/AsyncDialog.vue";

const AvatarCropDialog = defineAsyncComponent(
  () => import("@/components/common/AvatarCropDialog.vue")
);

const router = useRouter();
const userStore = useUserStore();
const emit = defineEmits(["toggle-mobile-sidebar"]);
const changePassDialogRef = ref(null);
const userName = computed(() => userStore.displayName || "管理员");
const userInitial = computed(() => userName.value.charAt(0).toUpperCase() || "A");
const device = ref("desktop");
const homeRoute = "/home";

const { changePassDialog, confirmChangePass } = useNavbarPasswordDialog({
  onSuccess: () => logout(),
  dialogRef: changePassDialogRef,
});

const avatarRefreshKey = ref(0);

const getServerBase = (): string => {
  const baseURL = String(request.defaults.baseURL || "").replace(/\/+$/, "");
  if (baseURL) return baseURL;
  return "";
};

const avatarUrl = computed(() => {
  const avatar = userStore.user?.avatar;
  if (!avatar) return "";
  if (avatar.startsWith("data:")) return avatar;
  if (avatar.startsWith("http")) {
    return `${avatar}${avatar.includes("?") ? "&" : "?"}t=${avatarRefreshKey.value}`;
  }
  const path = avatar.startsWith("/") ? avatar : `/${avatar}`;
  const base = getServerBase();
  return `${base}${path}?t=${avatarRefreshKey.value}`;
});

const avatarDialogVisible = ref(false);

const showAvatarDialog = () => {
  avatarDialogVisible.value = true;
};

const onAvatarUploaded = async () => {
  avatarRefreshKey.value = Date.now();
  avatarDialogVisible.value = false;
  try {
    await userStore.refreshProfile();
    avatarRefreshKey.value = Date.now();
  } catch {
    avatarRefreshKey.value = Date.now();
  }
};

const goHome = () => router.push(homeRoute);
const logout = async () => {
  await logoutByUser();
};
</script>

<style scoped>
.navbar-shell {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
}

.navbar-top {
  height: 56px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 18px 0 20px;
}

.mobile-nav-trigger {
  display: none;
  width: 34px;
  height: 34px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  align-items: center;
  justify-content: center;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(59, 130, 246, 0.24);
  flex-shrink: 0;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.brand-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.navbar-tags {
  background: #fff;
  overflow: hidden;
}

.right-menu {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 12px;
}

.right-menu-item {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  color: #334155;
}

@media (max-width: 768px) {
  .navbar-top {
    padding: 0 10px;
    gap: 10px;
  }

  .mobile-nav-trigger {
    display: inline-flex;
    flex: 0 0 auto;
  }

  .brand-mark {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    font-size: 13px;
  }

  .brand-title {
    font-size: 13px;
  }

  .right-menu {
    gap: 8px;
  }

  .user-name {
    display: none;
  }
}

.user-avatar {
  cursor: default;
  transition: transform 0.2s ease;
}

.clickable-avatar {
  cursor: pointer;
}

.clickable-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
