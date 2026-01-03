import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userId = computed(() => user.value?.id || null)
  const username = computed(() => user.value?.username || '')
  const nickname = computed(() => user.value?.nickname || '')
  const avatar = computed(() => user.value?.avatar || '')
  const storageLimit = computed(() => user.value?.storage_limit || 0)
  const storageUsed = computed(() => user.value?.storage_used || 0)
  const storagePercent = computed(() => {
    if (storageLimit.value === 0) return 0
    return Math.round((storageUsed.value / storageLimit.value) * 100)
  })

  // 操作
  function setUser(userData) {
    user.value = userData
    // 保存到 localStorage
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  function setToken(tokenValue) {
    token.value = tokenValue
    // 保存到 localStorage
    if (tokenValue) {
      localStorage.setItem('token', tokenValue)
    } else {
      localStorage.removeItem('token')
    }
  }

  function updateStorageUsed(used) {
    if (user.value) {
      user.value.storage_used = used
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // 从 localStorage 恢复用户信息
  function restoreUser() {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      try {
        user.value = JSON.parse(savedUser)
        token.value = savedToken
      } catch (error) {
        console.error('恢复用户信息失败:', error)
        logout()
      }
    }
  }

  // 初始化时恢复用户信息
  restoreUser()

  return {
    // 状态
    user,
    token,
    // 计算属性
    isLoggedIn,
    userId,
    username,
    nickname,
    avatar,
    storageLimit,
    storageUsed,
    storagePercent,
    // 方法
    setUser,
    setToken,
    updateStorageUsed,
    logout,
    restoreUser
  }
})
