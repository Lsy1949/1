import type { TenantConfigDTO } from '@/api/types'

/**
 * 租户配置 mock（模拟后端 `GET /api/tenant/config` 的返回）。
 *
 * 演示多租户三层定制：
 *  - default  生涯蓝：无覆写
 *  - tsinghua 紫荆心旅：L1 紫色色板 + L2 覆写（圆角加大、卡片底色偏紫、紫色阴影）
 *  - nist     青野心旅：L1 绿色色板 + L2 覆写（导航底色偏绿、嵌入块底色偏绿）
 *
 * 新增租户只需在此追加一个键，handler 会按 tenantId 自动分发（无需改 handler）。
 *
 * 覆写值只允许引用语义 token（`var(--brand-primary-faint)` 等）或 palette 派生的
 * 表达式，不下发任何十六进制 / rgb 色值 —— 确保主题色始终由 tokens.css + palette.ts 决定。
 */
export const TENANT_MOCKS: Record<string, TenantConfigDTO> = {
  default: {
    brand: {
      name: '生涯心旅',
      logo: '',
      favicon: '/favicon.svg',
      copyright: `© ${new Date().getFullYear()} 生涯心旅`,
    },
    theme: {
      // 七档色值省略时由 palette 派生；显式给值可覆盖派生（向后兼容）
      defaultPalette: 'blue',
      radius: '6px',
      fontFamily: '',
    },
  },
  tsinghua: {
    brand: {
      name: '紫荆心旅 · 清华大学',
      logo: '',
      favicon: '/favicon.svg',
      copyright: `© ${new Date().getFullYear()} 清华大学学生心理发展指导中心`,
    },
    theme: {
      defaultPalette: 'purple',
      radius: '10px',
      fontFamily: '',
      themeOverrides: {
        '--brand-radius': '10px',
        '--bg-soft': 'var(--brand-primary-faint)',
        '--shadow-soft': '0 2px 8px color-mix(in srgb, var(--brand-primary) 6%, transparent)',
        '--shadow-medium': '0 4px 16px color-mix(in srgb, var(--brand-primary) 8%, transparent)',
      },
    },
  },
  nist: {
    brand: {
      name: '青野心旅 · 南信院',
      logo: '',
      favicon: '/favicon.svg',
      copyright: `© ${new Date().getFullYear()} 南京信息职业技术学院`,
    },
    theme: {
      defaultPalette: 'green',
      radius: '8px',
      fontFamily: '',
      themeOverrides: {
        '--navbar-bg': 'color-mix(in srgb, var(--brand-primary-wash) 98%, transparent)',
        '--navbar-bg-blur': 'color-mix(in srgb, var(--brand-primary-wash) 80%, transparent)',
        '--bg-mute': 'var(--brand-primary-wash)',
      },
    },
  },
}
