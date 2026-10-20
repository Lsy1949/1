import type { AnyHandler } from 'msw'
import { tenantHandlers } from './handlers/tenant'
import { homeHandlers } from './handlers/home'

/**
 * 全部 mock handler 汇总。
 *
 * 新增域时：在 handlers/ 下建文件并在此追加一行 —— browser.ts 无需改动。
 */
export const handlers: AnyHandler[] = [...tenantHandlers, ...homeHandlers]
