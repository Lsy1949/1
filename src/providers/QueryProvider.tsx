import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * 全局唯一的 QueryClient：
 * - staleTime 30s：常规列表/详情 30 秒内复用缓存，避免路由往返重复请求
 * - retry 1：失败仅重试 1 次（慢接口快速暴露错误）
 * - refetchOnWindowFocus 关闭：与旧版"进页面才拉数据"的行为一致
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default QueryProvider
