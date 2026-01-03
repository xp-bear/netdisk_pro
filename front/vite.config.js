import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 6002,
    proxy: {
      '/api': {
        target: 'http://120.48.51.185:6001',
        changeOrigin: true
      }
    }
  }
})
