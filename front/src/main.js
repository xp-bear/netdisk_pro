import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

// 检测是否为移动端设备
function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile']
  
  // 检查 userAgent 中是否包含移动设备关键词
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
  
  // 检查屏幕宽度（小于768px视为移动设备）
  const isMobileScreen = window.innerWidth < 768
  
  // 检查是否支持触摸事件
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return isMobileUA || (isMobileScreen && isTouchDevice)
}

// 如果是移动端设备，跳转到移动端网址
if (isMobileDevice()) {
  window.location.href = 'http://m.pan.coderxp.top/'
} else {
  // PC端正常初始化应用
  const app = createApp(App)
  const pinia = createPinia()

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.use(pinia)
  app.use(router)
  app.use(ElementPlus, {
    locale: zhCn,
  })
  app.mount('#app')
}
