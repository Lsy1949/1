/// <reference types="vite/client" />

/**
 * 项目自定义环境变量声明（与 .env.development / .env.example 保持一致）。
 *
 * 声明为可选 string：Vite 未定义该变量时取值为 undefined，
 * 用 ?. 语义（而不是假装一定有值）能让开关判断处的分支更诚实。
 */
interface ImportMetaEnv {
  /** 后端接口根地址（空 = 同源相对路径，配合 vite proxy） */
  readonly VITE_API_BASE_URL?: string
  /** 登录是否走本地 mock 分支（VITE_USE_MOCK_LOGIN==='true'） */
  readonly VITE_USE_MOCK_LOGIN?: string
  /**
   * MSW（Mock Service Worker）开关。
   * DEV 默认开启，置 '0' 关闭以联调真实后端；非 DEV 需显式 '1' 才开启。
   */
  readonly VITE_USE_MOCK?: string
  /** 置 '1' 时所有 mock 接口返回 500，用于验证 error / loading 分支 */
  readonly VITE_MOCK_ERROR?: string
  /** AI 对话地址（空 = 本地话术引擎 mock） */
  readonly VITE_AI_CHAT_URL?: string
  /** SignalR hub 地址（空 = 实时功能静默降级） */
  readonly VITE_SIGNALR_HUB_URL?: string
  /** 应用标题 */
  readonly VITE_APP_TITLE?: string
  /** 按子域名解析租户用 */
  readonly VITE_APP_DOMAIN?: string
  /** 指定租户 ID（单校私有部署） */
  readonly VITE_TENANT_ID?: string
  /** vite dev proxy 目标（未配置时回落 http://127.0.0.1:8080） */
  readonly VITE_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
