import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 与 Vue 版 vite.config.ts 保持等价：GitHub Pages 子路径、@ 别名、后端代理
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // GitHub Pages 项目站点部署在 /1/ 子路径下（仓库名即 '1'）；仅构建时启用。
    // 仓库改名 / 换自定义域时，需同步改这里、public/404.html 的 pathSegmentsToKeep。
    base: command === 'build' ? '/1/' : '/',
    plugins: [react()],
    build: {
      // vendor-antd ~1.06MB（gzip 341kB）是 antd 6 全量固有体量，无法再拆
      // （按 rc- 组件强拆会破坏内部依赖）；提高警告线消除无效噪音
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // 拆分大依赖：antd 系与 react 系各自成 chunk，
          // 主业务 chunk 不再超 500kB 警戒线（且两者版本独立缓存）
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/[\\/]node_modules[\\/](antd|@ant-design|rc-[^\\/]+)[\\/]/.test(id)) return 'vendor-antd'
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|@tanstack)[\\/]/.test(id)) {
              return 'vendor-react'
            }
          },
        },
      },
    },
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
