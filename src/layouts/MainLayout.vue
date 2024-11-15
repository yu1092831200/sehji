<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Location, 
  Monitor, 
  DataLine, 
  PieChart, 
  Warning, 
  Setting,
  Bell,
  User,
  CaretBottom,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const activeMenu = ref(route.name)

// 计算当前路由名称
const currentRoute = computed(() => {
  const routeMap = {
    home: '首页',
    devices: '设备管理',
    'device-data': '设备数据',
    'data-analysis': '数据分析',
    alerts: '预警信息',
    settings: '系统设置'
  }
  return routeMap[route.name] || ''
})

const handleSelect = (index) => {
  router.push({ name: index })
}
</script>

<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="logo">
        <span class="logo-text">北斗星物联云</span>
        <div class="logo-decoration"></div>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#409EFF"
        @select="handleSelect"
        class="tech-menu"
      >
        <el-menu-item index="home" class="menu-item">
          <div class="menu-item-content">
            <el-icon><Location /></el-icon>
            <span>首页</span>
            <div class="hover-indicator"></div>
          </div>
        </el-menu-item>
        <el-menu-item index="devices" class="menu-item">
          <div class="menu-item-content">
            <el-icon><Monitor /></el-icon>
            <span>设备管理</span>
            <div class="hover-indicator"></div>
          </div>
        </el-menu-item>
        <el-menu-item index="device-data" class="menu-item">
          <div class="menu-item-content">
            <el-icon><DataLine /></el-icon>
            <span>设备数据</span>
            <div class="hover-indicator"></div>
          </div>
        </el-menu-item>
        <el-menu-item index="data-analysis" class="menu-item">
          <div class="menu-item-content">
            <el-icon><PieChart /></el-icon>
            <span>数据分析</span>
            <div class="hover-indicator"></div>
          </div>
        </el-menu-item>
        <el-menu-item index="alerts" class="menu-item">
          <div class="menu-item-content">
            <el-icon><Warning /></el-icon>
            <span>预警信息</span>
            <div class="hover-indicator"></div>
          </div>
        </el-menu-item>
        <el-menu-item index="settings" class="menu-item">
          <div class="menu-item-content">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
            <div class="hover-indicator"></div>
          </div>
        </el-menu-item>
      </el-menu>
    </div>
    
    <div class="main-content">
      <div class="top-header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRoute }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="header-item">
            <el-badge :value="3" class="notice-badge">
              <el-button class="notice-btn" text>
                <el-icon :size="20"><Bell /></el-icon>
              </el-button>
            </el-badge>
          </div>
          <div class="header-item">
            <el-dropdown trigger="click">
              <div class="user-info">
                <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <span class="username">管理员</span>
                <el-icon><CaretBottom /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <el-icon><User /></el-icon>个人信息
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-icon><Setting /></el-icon>账号设置
                  </el-dropdown-item>
                  <el-dropdown-item divided>
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
      
      <div class="page-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  min-width: 1200px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f7fa;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #001529 0%, #003366 100%);
  color: white;
  flex-shrink: 0;
  box-shadow: 4px 0 10px rgba(0,0,0,0.1);
  height: 100%;
  z-index: 1000;
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(0,150,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0,150,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo-text {
  position: relative;
  z-index: 1;
  background: linear-gradient(90deg, #fff, #409EFF);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 0 10px rgba(64,158,255,0.5);
}

.logo-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 45%, rgba(64,158,255,0.1) 50%, transparent 55%);
  transform: translate(-50%, -50%) rotate(45deg);
  animation: shine 3s infinite;
}

.tech-menu {
  margin-top: 10px;
  background: transparent !important;
}

.menu-item {
  position: relative;
  height: 56px !important;
  line-height: 56px !important;
  margin: 4px 0;
  padding: 0 16px !important;
}

.menu-item-content {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.menu-item:hover .menu-item-content {
  background: rgba(64,158,255,0.1);
}

.menu-item.is-active .menu-item-content {
  background: rgba(64,158,255,0.2);
}

.menu-item :deep(.el-icon) {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  transition: all 0.3s;
}

.menu-item:hover :deep(.el-icon) {
  transform: scale(1.1);
  color: #409EFF;
}

.hover-indicator {
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: #409EFF;
  transition: height 0.3s;
  box-shadow: 0 0 10px #409EFF;
}

.menu-item:hover .hover-indicator,
.menu-item.is-active .hover-indicator {
  height: 24px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - 220px);
  height: 100%;
  overflow: hidden;
}

.top-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-item {
  display: flex;
  align-items: center;
}

.notice-btn {
  padding: 8px;
  color: #606266;
}

.notice-btn:hover {
  color: #409EFF;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.page-container {
  flex: 1;
  overflow: auto;
  padding: 24px;
  position: relative;
  background: #f5f7fa;
  height: calc(100vh - 60px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown-menu__item i) {
  margin-right: 4px;
}

:deep(.el-badge__content) {
  border: none;
}

.page-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.page-container::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.page-container::-webkit-scrollbar-track {
  background: #f5f7fa;
}

@keyframes shine {
  0% {
    transform: translate(-50%, -50%) rotate(45deg) translateX(-100%);
  }
  100% {
    transform: translate(-50%, -50%) rotate(45deg) translateX(100%);
  }
}

:deep(.el-menu) {
  border-right: none;
  height: calc(100% - 60px);
}

:deep(.el-menu-item) {
  border-left: 3px solid transparent;
}

:deep(.el-menu-item.is-active) {
  border-left-color: #409EFF;
  background: rgba(64,158,255,0.1) !important;
}
</style> 