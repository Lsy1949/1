import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 与 Vue 版 vite.config.ts 保持等价：GitHub Pages 子路径、@ 别名、后端代理
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // GitHub Pages 项目站点部署在 /101/ 子路径下；仅构建时启用
    base: command === 'build' ? '/1/' : '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      allowedHosts: [
        'probable-skimmer-daughter.ngrok-free.dev',
        '.ngrok-free.dev',
        'springboot.free.idcfengye.com',
      ],
      host: '0.0.0.0',
      port: 3001,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
        '/hubs': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
