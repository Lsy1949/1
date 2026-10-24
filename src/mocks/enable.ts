/**
 * DEV 下启动 MSW（Mock Service Worker）。
 *
 * 开关规则：DEV 默认开启（联调真实后端时置 VITE_USE_MOCK=0 关闭）；
 * 非 DEV 仅当显式 VITE_USE_MOCK=1 才开启。
 *
 * worker 就绪后再渲染：避免首个请求（租户配置）在 worker 接管前发出去而落空。
 * 动态 import 保证 msw 与 mocks/data（含 Vite 资源导入）不进生产包。
 *
 * 独立成模块（由 main.tsx 抽出）：入口只保留一行启用调用，
 * 后续整体移除 Mock 时只动本文件与调用点，不再碰应用入口。
 */
export async function enableMocking(): Promise<void> {
  const flag = import.meta.env.VITE_USE_MOCK
  const enabled = import.meta.env.DEV ? flag !== '0' : flag === '1'
  if (!enabled) return

  const { worker } = await import('./browser')
  // 'bypass'：未命中的请求（vite HMR、静态资源等）静默放行，保持控制台干净；
  // 未 mock 的接口仍可在 Network 面板看到，便于补 handler。
  // 注意 msw v3 把该选项由 onUnhandledRequest 更名为 onUnhandledFrame。
  await worker.start({ onUnhandledFrame: 'bypass' })
}
