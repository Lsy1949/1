# 生涯心旅（syxl-react）

心理健康与生涯测评平台前端。React 18 + TypeScript + Vite 7 + Ant Design 6，内置多租户（子域名解析 / 私有化锁定）、MSW Mock、实时通道（SignalR）与三语国际化（zh-CN / zh-TW / en-US）。

项目文档见 [docs/README.md](./docs/README.md)（技术功能、接口契约、设计规范、交接清单）。

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- pnpm（`packageManager` 字段锁定了精确版本，Corepack 会自动对齐）

## 快速开始

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发服务器 http://localhost:3001（/api、/hubs 代理到后端）
pnpm build        # tsc --noEmit && vite build（产物 base 为 /1/，GitHub Pages 子路径）
pnpm preview      # 本地预览构建产物（base 仅构建期生效，preview 默认挂在根路径；
                  # 要模拟 Pages 的 /1/ 路径托管需加 --base=/1/）
pnpm typecheck    # 仅类型检查
```

开发默认由 MSW 接管全部接口（无需后端即可运行）；联调真实后端时在 `.env.development`（或 `.env.development.local`）把 `VITE_USE_MOCK` 置 `0`。GitHub Pages 线上同理：`deploy.yml` 构建期注入 `VITE_USE_MOCK=1`，线上接口由 MSW 提供演示数据。

## 环境变量

### 文件分层与优先级

按 Vite 约定分层加载，**后者覆盖前者**；`*.local` 已被 `.gitignore` 排除，用于本机个人覆盖：

| 文件 | 加载时机 | 是否入库 | 用途 |
|---|---|---|---|
| `.env` | 所有模式（dev / build / preview） | ✅ | 全局默认值（如 `VITE_APP_TITLE`） |
| `.env.development` | 仅 `pnpm dev` | ✅ | 开发环境专属值（Mock 开关、代理目标、`localhost` 主域） |
| `.env.production` | 仅 `pnpm build` / `preview` | ✅ | 生产环境专属值（公网主域、私有化租户） |
| `.env.local` | 所有模式 | ❌ | 本地全局覆盖 |
| `.env.development.local` | 仅 `pnpm dev` | ❌ | 本地开发专属覆盖（联调地址等，最常用） |
| `.env.production.local` | 仅 `pnpm build` / `preview` | ❌ | 本地打包验证专属覆盖 |
| `.env.example` | 不加载 | ✅ | 变量总清单与模板（文档用途） |

### 变量清单

全部变量及默认行为见 [.env.example](./.env.example)。要点：

| 变量 | 空值时的行为 | 典型取值 |
|---|---|---|
| `VITE_API_BASE_URL` | 回退 `/api` 同源转发（经 dev proxy） | `http://localhost:8080/api` |
| `VITE_PROXY_TARGET` | dev 代理回退 `http://127.0.0.1:8080`（仅 dev server 生效） | 后端地址 |
| `VITE_USE_MOCK` | DEV 默认开启 MSW；非 DEV 不启用 | `'0'` 联调关闭 / `'1'` 非 DEV 强制开启 |
| `VITE_MOCK_ERROR` | 正常 mock | `'1'` 全量返回 500（验证 error/loading 分支） |
| `VITE_AI_CHAT_URL` | 本地话术引擎 mock | OpenAI 风格 SSE 地址 |
| `VITE_SIGNALR_HUB_URL` | 实时功能静默降级 | hub 地址 |
| `VITE_APP_TITLE` | 代码兜底 `生涯心旅`（默认值已写在 `.env`） | 站点标题 |
| `VITE_APP_DOMAIN` | 子域名租户解析整级跳过 | dev `localhost`；生产主域（eTLD+1，必填） |
| `VITE_PRIVATE_TENANT` | 公网多租户模式 | 私有化填租户 id（如 `nist`） |

### 安全约定

- 只有 `VITE_` 前缀的变量会静态打进客户端产物，**任何 env 文件禁止存放密钥**；密钥类配置一律由后端持有。
- 生产构建必须覆写 `VITE_APP_DOMAIN` 为真实主域，否则子域名租户解析跳过、全站回退 default 租户（`config/tenant/resolve.ts` 有防呆告警）。

## 目录速览

```
src/
├── api/            # http 基础设施 + 业务接口模块（契约见 docs/api-contract.md）
├── config/tenant/  # 多租户：解析（子域名/私有化锁定）与租户配置
├── features/       # 业务模块（auth / home / assessment / ai / ...）
├── i18n/           # i18next 三语配置与字典（docs/i18n/）
├── mocks/          # MSW handlers 与 fixtures（仅按需动态加载）
├── realtime/       # SignalR 连接管理
├── stores/         # 全局状态
└── styles/         # 三层设计 token（tokens / semantic / palettes）
```
