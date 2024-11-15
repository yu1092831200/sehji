import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: Home
      },
      {
        path: '/devices',
        name: 'devices',
        component: () => import('@/views/Devices.vue')
      },
      {
        path: '/device-data',
        name: 'device-data',
        component: () => import('@/views/DeviceData.vue')
      },
      {
        path: '/data-analysis',
        name: 'data-analysis',
        component: () => import('@/views/DataAnalysis.vue')
      },
      {
        path: '/alerts',
        name: 'alerts',
        component: () => import('@/views/Alerts.vue')
      },
      {
        path: '/settings',
        name: 'settings',
        component: () => import('@/views/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 