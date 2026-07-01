import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/profile.php': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/tools-api': {
        target: 'https://tools.abm48.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tools-api/, '')
      },
      '/cdn': {
        target: 'https://idol-vod.48.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn/, ''),
        headers: {
          'Origin': 'https://h5.48.cn',
          'Referer': 'https://h5.48.cn/'
        }
      }
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  }
})
