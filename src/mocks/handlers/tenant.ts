import { http } from 'msw'
import { mocked, ok } from '../utils/response'
import { TENANT_MOCKS } from '../data/tenant'
import type { TenantConfigDTO } from '@/api/types'

/**
 * 租户接口。
 *
 * `GET /api/tenant/config?tenantId=xxx`
 *  - 未知租户回退 default（与 config/tenant/loader 的静默降级约定一致）
 *  - 新增租户只需往 data/tenant.ts 追加键，本文件无需改动
 */
export const tenantHandlers = [
  http.get(
    '/api/tenant/config',
    mocked(({ request }) => {
      const tenantId = new URL(request.url).searchParams.get('tenantId') ?? ''
      const config = TENANT_MOCKS[tenantId] ?? TENANT_MOCKS.default
      return ok<TenantConfigDTO>({ ...config, tenantId })
    }),
  ),
]
