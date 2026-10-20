import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * 浏览器端 MSW worker。
 *
 * 由 src/main.tsx 在 DEV + 开关命中时动态 import ——
 * 这样 msw 与 mocks/data（含 Vite 资源导入）都不会进入生产包。
 */
export const worker = setupWorker(...handlers)
