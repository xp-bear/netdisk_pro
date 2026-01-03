import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 检查路由是否需要登录
  if (to.meta.requiresAuth !== false) {
    // 需要登录
    if (!userStore.isLoggedIn) {
      // 未登录，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
      // 已登录，允许访问
      next()
    }
  } else {
    // 不需要登录
    if (to.name === 'Login' && userStore.isLoggedIn) {
      // 已登录用户访问登录页，重定向到首页
      next({ name: 'Home' })
    } else {
      next()
    }
  }
})

export default router
