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
  // --- 新增下面这部分 server 配置 ---
  server: {
    proxy: {
      '/profile.php': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})