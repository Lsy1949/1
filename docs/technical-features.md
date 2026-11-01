# 生涯心旅 · 技术功能文档

> **定位**：说明系统「做了什么、怎么实现、边界在哪」，供接手开发、前后端联调与验收使用。
> **事实来源**：本仓库代码（唯一权威）。文档与代码冲突时以代码为准，并在同一次提交内回改本文。
> **配套文档**：[api-contract.md](./api-contract.md) 接口契约 · [design-language.md](./design-language.md) UI/交互规范 · [migration-guide.md](./migration-guide.md) Vue→React 迁移对照 · [handover.md](./handover.md) 待办。

## 0. 术语

| 术语 | 含义 |
|---|---|
| 租户 | 一所学校 / 一个站点，由 `tenantId` 标识 |
| feature | 模块级开关（`TenantFeatures`），同时作用于菜单入口与路由守卫 |
| route 快照 | 路径级开关（`TenantConfig.routes`），决定路由是否可达 |
| Mock 兜底 | 后端未就绪时，DEV 下由 MSW 提供等价实现 |
| 未接通 | UI 已完成，保存/导出仅前端提示，无后端调用 |

## 1. 系统概览

面向高校的 C 端心理健康与生涯服务平台。单仓库以「多租户 + 主题注入 + 模块开关」服务多个学校站点；无后台管理端。

### 1.1 技术栈

| 层 | 选型 | 版本 |
|---|---|---|
| 框架 / 语言 | React + TypeScript | 18.3 / 5.8 |
| 构建 | Vite | 7.1 |
| 路由 | react-router-dom | 6.30 |
| UI | Ant Design（复杂控件）+ 自有 CSS | 6.6 |
| 服务端状态 | @tanstack/react-query | 5.104 |
| 请求 / 实时 | axios（AI 流式走 fetch）、@microsoft/signalr | 1.7 / 8.0 |
| 事件总线 / Mock | mitt、MSW | 3.0 / 3.0 |
| 运行时 | Node `^20.19` 或 `>=22.12`，pnpm | `package.json` |

### 1.2 代码分层

| 目录 | 职责 | 关键约束 |
|---|---|---|
| `src/api/` | 请求实例、拦截器、领域接口、DTO | 业务代码禁止直接 `import axios` |
| `src/stores/` | 模块级单例状态（user / tenant / app / realtime） | 非 React 层也要读写，故不用 Context |
| `src/realtime/` `src/events/` | SignalR 连接、mitt 事件总线 | 未配置 Hub 地址时静默降级 |
| `src/providers/` | Provider 壳与错误边界 | 壳层只保证副作用执行，状态在单例里 |
| `src/config/` | 路由表、租户配置解析/合并 | 新增页面只改 `config/routes.ts` |
| `src/layouts/` | 壳层、导航、守卫、布局 meta | 守卫顺序见 §3.2 |
| `src/pages/` | 路由页面（懒加载分片） | 页面持有数据请求 |
| `src/features/` `src/components/` | 业务组件（按模块分组）与跨模块基础组件 | feature 内不直接访问 API |
| `src/hooks/` `src/utils/` `src/i18n/` `src/styles/` `src/mocks/` | 通用 hook、工具、三语包、Token、MSW | 见 §4.3 / §7 / §9 |

### 1.3 启动时序

| 序 | 动作 | 阻塞性 |
|---|---|---|
| 1 | `index.html` 内联脚本按 `theme:mode` 与租户解析结果预置 `html.dark` / `data-palette` / `--brand-primary` | 首帧前（防闪烁） |
| 2 | `enableMocking()`：DEV 默认启动 MSW，失败降级直连 | 阻塞渲染，失败不白屏 |
| 3 | 渲染 Provider 树，首帧使用**保底租户配置** | — |
| 4 | `bootstrapTenant()`：读缓存 → 后台刷新 → 全树热更新 | 非阻塞 |
| 5 | `restoreFromMe()`：探测 `/api/me`，确定三态会话 | 非阻塞 |

## 2. 运行时架构

### 2.1 Provider 树（顺序即依赖序）

| # | Provider | 职责 |
|---|---|---|
| 1 | `GlobalErrorBoundary` | 零依赖兜底，整页替换（Provider 初始化崩溃） |
| 2 | `QueryProvider` | 唯一 `QueryClient`（`staleTime 30s` / `retry 1` / 关闭窗口聚焦重取） |
| 3 | `ThemeProvider` → `AntdThemeBridge` | 主题壳；`ConfigProvider` 负责 locale、明暗 algorithm、租户 token 桥接 |
| 4 | `TenantProvider` | 租户壳，配置在 store 单例 |
| 5 | `I18nProvider` | 真实 Context：`{ t, locale, setLocale }` |
| 6 | `PermissionProvider` | 由 user store 派生 `role` / `hasRole` |
| 7 | `BrowserRouter` | `basename` 取 Vite base 去尾斜杠 |
| 8 | `RouteErrorBoundary` → `Suspense` → `App` | 页面级兜底；懒加载占位 |

### 2.2 状态管理

`createStore(initial, transform?)` 返回 `getState` / `getSnapshot` / `subscribe` / `setState` / `useStore(selector?)`；`setState` 先重建快照再广播，保证 `useSyncExternalStore` 引用稳定。组件内用 `useXxxStore()`，非 React 层用 `getXxxStore()`。

| Store | 状态 | 持久化 |
|---|---|---|
| user | `session`（`loading`/`authenticated`/`anonymous`）、`profile`、`rememberMe` | 仅 `rememberMe` → `localStorage.user` |
| tenant | `tenantId`、`config`、`fromCache`、`loaded` | `tenant:config:{tenantId}` |
| app | `device`、`theme`、`locale` | `app`、`locale`（当前无业务消费方） |
| realtime | `status`、`reconnectAttempts`、`lastMessage`、`unreadCount` | 刻意不持久化 |

> 会话唯一权威是后端 `/api/me`；`profile` 不落盘，避免「陈旧已登录」闪烁。

### 2.3 数据流

```
页面 (src/pages/*)
  └─ <module>Query.ts         react-query：queryKey / 缓存 / 失效 / 乐观更新
       └─ api/modules/*.ts    领域函数，返回 DTO
            └─ api/request.ts 信封解包 { code, data, message } → data
                 └─ api/http.ts 唯一 axios 实例
                      └─ api/interceptors.ts X-Tenant-Id 注入、错误归一化、401 策略
                           └─ 后端 / MSW
```

- 组件不直接调 `api/modules`，一律经 `*Query.ts`；`queryKey` 以领域名开头（如 `['square','info']`）。
- 标准三态：`isPending` → `Skeleton`；`isError` → `Result` + `refetch`；空数据 → `Empty`。
- 详情类查询 `retry: false`，HTTP 404 时跳转或渲染未找到。

### 2.4 事件总线

| 事件 | 载荷 | 发布方 | 订阅方 |
|---|---|---|---|
| `user:logout` | — | 401 拦截器、`forceLogout`、手动登出 | `GlobalEvents` → 跳 `/login` |
| `signalr:message` | `{ type, data, receivedAt }` | 连接层 | `useSignalR().on` |
| `signalr:connected` / `signalr:disconnected` | — / `{ reason }` | 连接层 | 暂无 |
| `user:login` / `ui:loading` | 已声明 | — | 暂无使用 |

## 3. 路由与访问控制

### 3.1 路由表

`src/config/routes.ts` 为唯一注册处（20 条声明；`APP_ROUTE_PATHS` 派生 19 条可校验路径，`*` 除外）。全部页面 `React.lazy` 分片，统一挂在 `<Route path="/">` 布局路由下。

| 分组 | 路径 | 页面 | 登录 | feature | 租户裁剪 |
|---|---|---|---|---|---|
| 首页 | `/` | HomePageView | — | — | 豁免 |
| 时光胶囊 | `/time-capsule`、`/create`、`/:id` | Capsule{List,Create,Detail}View | — | `timeCapsule` | 生效 |
| 心事广场 | `/square`、`/create`、`/:id` | Square{List,Create,Detail}View | — | `square` | 生效 |
| 心理测评 | `/assessment`、`/take/:id` | Assessment{Center,Take}View | — | `assessment` | 生效 |
| 心晴阅读 | `/articles`、`/list`、`/:id` | Article{Center,List,Detail}View | — | `articles` | 生效 |
| 咨询中心 | `/counseling`、`/ai-chat`、`/companion` | CounselingCenter / AiConsult / AiCompanion | — | `counseling` | 生效 |
| 用户 | `/profile`、`/settings` | ProfileView / SettingsView | ✅ | — | 生效 |
| 登录 / 错误 | `/login`、`/403`、`*` | LoginView / ForbiddenView / NotFoundView | — | — | 豁免 |

设备分流：`isMobileUA()` 在模块加载时判定一次，选择 PC / Mobile 布局；两套布局是同一 `AppShell` 的包装，响应式由 CSS 承担，不走路由分流。

### 3.2 守卫组合与行为矩阵

单条路由包装顺序（外 → 内）：`ProtectedRoute` → 租户裁剪（403）→ `FeatureGuard`（403）→ 页面。

| 会话 | 需登录 | 租户已开通 | 结果 |
|---|---|---|---|
| 匿名 | 否 | 是 | 页面 |
| 匿名 | 否 | 否 | 403 |
| 匿名 | 是 | 是 / 否 | `/login?from=当前页`（先确认身份，再判可达） |
| 已登录 | 任意 | 是 | 页面 |
| 已登录 | 任意 | 否 | 403 |

- 被裁掉的 path 渲染 403 而非 404，直接输入 URL 也有可理解反馈。
- `tenantExempt`（`/`、`/login`、`/403`、`*`）跳过裁剪，否则会出现「404 全变 403」「登录跳转死锁」。
- 守卫订阅 store，租户配置热更新后立即生效。

### 3.3 布局 meta

`useLayoutMeta()` 由 `location.pathname` 推导（React Router 无 `route.meta`）：

| 条件 | 透明导航 | 隐藏导航 | 隐藏页脚 |
|---|---|---|---|
| `/` 或 `/login` | ✅ | — | — |
| `/assessment/take/*` | — | ✅ | ✅ |
| 未命中已注册路径（404） | — | ✅ | ✅ |
| 其余 | — | — | — |

### 3.4 菜单管线

`GET /api/menu` → `useQuery`（`staleTime 10min`）→ 失败用内置 `FALLBACK_MENU` → 依次过滤：

1. **path 校验**：不在前端路由表内 → 丢弃（防 404）；
2. **feature 过滤**：模块关闭 → 丢弃；
3. **租户裁剪**：不在 `config.routes` 内 → 整棵子树丢弃。

DTO 只下发 `key / path / i18nKey / feature? / iconKey? / children?`，文案与图标由前端解析；点击经 `handleNav` 映射为带 query 的 URL，未命中规则时回退 `navigate(item.path)`。

## 4. 多租户

### 4.1 租户解析（命中即停）

| 级 | 来源 | 说明 |
|---|---|---|
| 1 | `VITE_PRIVATE_TENANT` | 私有化部署构建期锁定 |
| 2 | 子域名 | `{tenant}.{VITE_APP_DOMAIN}`；裸主域、`www.*`、多级前缀、IP 均不命中 |
| 3 | `'default'` | 主站兜底 |

已删除通道（命中亦忽略）：`?tenant=`、`sessionStorage['tenant:id']`。同一规则在 `index.html` 内联脚本中复刻一份用于首帧防闪烁，两处需同步维护。

### 4.2 配置模型

`TenantConfig = { tenantId, brand, theme, routes[], assets, features }`，字段级保底后保证完整；`tenantId` 始终取前端解析结果，不信任服务端回显。

| 字段 | 作用 | 缺省行为 |
|---|---|---|
| `brand` | 名称、Logo、favicon、版权 | 回退内置默认 |
| `theme` | 品牌色 seed / 七档派生色 / 圆角 / 字体 / 白名单覆写 | 回退 `blue` 色板 |
| `routes` | 路径级快照 | **未下发 → 全量启用（fail-open）**；一旦下发 → 严格裁剪（fail-closed）；非法 path 静默丢弃 |
| `features` | 五个模块开关 | 缺省按默认值布尔化 |
| `assets` | 登录页背景、首页 Banner | 空串 = 内置默认图 |

加载策略：有缓存先用缓存（`fromCache: true`）并后台刷新；无缓存等接口最多 1.5s（`AbortController` + 实例超时双保险），失败回退默认配置；`finally` 置 `loaded: true`。

### 4.3 主题注入与防闪烁

| 层 | 内容 | 载体 |
|---|---|---|
| L1 | 预置色板 key（blue/green/purple/orange）或自定义 6 位 hex seed，派生七档 | `data-palette` / `<html>` 内联变量 |
| L2 | 白名单语义 token 覆写（`--bg-*`/`--text-*`/`--border-*`/`--shadow-*` 等） | 作用域 `html:not(.dark)` 的 style 标签，暗色优先 |
| L3 | 组件级局部变量 | 组件 CSS |

明暗：`theme:mode`（`light`/`dark`/`system`）+ `html.dark` + `color-scheme`；antd 侧由 `algorithm` 切换，组件 token 绑定 CSS 变量而非色值。用户偏好（`theme:palette:{tenantId}`）> 租户默认 > `blue`；首帧防闪烁由 `index.html` 内联脚本完成。

### 4.4 两套开关的关系

`feature` 是模块级合同开关（粗粒度，菜单 + 路由双用），`routes` 是路径级快照（细粒度，可达性 + 入口同步过滤）。两者正交并存，同时生效。

## 5. 数据访问层

### 5.1 实例配置

`baseURL = VITE_API_BASE_URL || '/api'`，`timeout 10s`，`withCredentials`，CSRF 头 `XSRF-TOKEN` → `X-XSRF-TOKEN`（`withXSRFToken: true`）。身份凭证为 HttpOnly cookie，前端不持有 token、不注入 `Authorization`；请求统一注入 `X-Tenant-Id`。

租户配置接口使用独立裸 axios 实例（避免 store ↔ loader ↔ api 循环引用），显式传 `tenantId` 查询参数。

### 5.2 错误归一化

| 场景 | 处理 |
|---|---|
| HTTP 401 | 已登录 → `reset()`；非 `/api/me` 探测 → 广播 `user:logout`。`INVALID_CREDENTIALS` → 「账号或密码错误」，其余 → 「登录已过期」 |
| HTTP ≥ 500 | 「服务器暂时不可用」 |
| 其他 4xx | 透传服务端 `message`，否则「请求失败 (status)」 |
| 超时 / 断网 | 「请求超时」/「网络错误」 |

`ApiError` 保留 `status` 供调用方分支；业务码非 200 由 `request.ts` 解包时抛出（见 §11）。

### 5.3 查询与写操作约定

- 全局默认：`staleTime 30s`、`retry 1`、不随窗口聚焦重取；低频数据单独放长（菜单 10 分钟）。
- 关键词搜索走 `useDebouncedValue`（300ms）+ `keepPreviousData`，避免翻页闪烁。
- 失效以领域前缀批量执行（`invalidateQueries({ queryKey: ['square'] })`）。
- 乐观更新范式（以广场点赞为模板）：`cancelQueries` → 快照两份缓存（列表 + 详情）→ 立即翻转 UI → `onError` 回滚并提示 → `onSettled` 统一失效对齐后端。

## 6. 实时通道

| 项 | 实现 |
|---|---|
| 连接 | 懒加载单例，`withUrl(VITE_SIGNALR_HUB_URL, { withCredentials: true })`；地址为空则整体跳过 |
| 重连 | `withAutomaticReconnect([0, 2000, 5000, 10000])`，重连成功自动重新 `joinTenant` |
| 心跳 | `serverTimeout 30s` / `keepAlive 15s` |
| Client → Server | `joinTenant(tenantId)`、`leaveTenant` |
| Server → Client | `receiveNotification`（未读 +1 并广播）、`forceLogout`（清态 + 广播登出） |
| 启停 | 仅由登录 / 登出流程触发（见 §11 第 6 条） |

## 7. 国际化与无障碍

### 7.1 i18n

| 项 | 约定 |
|---|---|
| 语言 | `zh-CN`（默认）/ `zh-TW` / `en-US`，键结构一一对应 |
| 取值 | `t('a.b.c')` 点路径；当前语言缺键 → 回退 `zh-CN` → 仍缺 → 返回 key 本身 |
| 插值 | `{name}` 字面替换，无格式化与转义 |
| 持久化 | `localStorage.locale`；切换时同步 `<html lang>` 与 `document.title` |
| 限制 | `t()` 只返回字符串，数组类文案由本地助手直接读语言包；少量文案仍为硬编码中文 |

### 7.2 无障碍基线

- **热区**：可点击目标命中区 ≥ 44×44px（视觉尺寸可更小，用透明伪元素扩展）。
- **键盘**：`div/span + onClick` 改原生 `<button>` 或补 `role`/`tabIndex`/Enter·Space；危险操作不得只靠 hover 呈现。
- **焦点**：`outline: none` 必须伴随等效替代（`border-color` / `:focus-visible` 焦点环）。
- **播报**：`LiveAnnouncer` 提供全局 `role="status" aria-live="polite"`，用于主题 / 语言等无焦点变化的状态切换。
- **动效**：`prefers-reduced-motion` 全局兜底 + JS 侧 `scrollBehavior()` 降级为 `auto`。

## 8. 功能模块

| 模块 | 路由 | 数据与状态 | 关键机制 | 边界 |
|---|---|---|---|---|
| 首页 | `/` | 仅轮播走 `GET /api/home/carousel`（页面内直接 `get`）；新闻、跑马灯、关于、联系方式为 i18n + 静态 | 首尾克隆无缝轮播 + 拖拽惯性（位移 >100px 或速度 >0.5 切换）+ `transitionend` 双 rAF 归位；自动播放 5s；滚轮 800ms 锁后滚到 `#news`；BackTop 节流且非模态（Esc 关闭并归还焦点）；数字滚动由 IntersectionObserver 触发一次 | 轮播失败/空显示重试；联系表单仅前端成功提示 |
| 心晴阅读 | `/articles`、`/list`、`/:id` | 列表（分类 + 关键词）、详情、相关推荐（限 4 条）；`?category` 与本地分类双向同步；详情点赞/收藏为本地态 | 关键词 300ms 防抖 + 保留上一页；中心页首屏 6 条 + 展开全部；合集卡片写入搜索词；详情页顶部阅读进度条（`scrollY / (scrollHeight - innerHeight)`）；`useReveal` 分档入场；404 跳转 | 评论为组件内种子数据；合集数量与图标硬编码 |
| 心事广场 | `/square`、`/create`、`/:id` | `square/info` 聚合、`feed/:id`、评论列表与发布、点赞、发布动态；筛选 tab / 草稿 / 表单为本地 | 点赞与评论点赞走乐观更新（跨列表 + 详情两份缓存，见 §5.3）；写成功失效对应查询；发帖校验：正文 500 字、≤6 图（`FileReader` → dataURL）、≤3 话题，正文与图片至少其一；话题去前导 `#` | 分享/话题操作仅提示；每日一问与社区公约为静态文案 |
| 心理测评 | `/assessment`、`/take/:id` | 量表目录/详情、提交答案（**计分在服务端**）、历史、清空历史；`?scale=&view=result\|intro` 驱动结果弹窗 | 作答页 1s 计时，选择后 300ms 自动下一题，全部作答才可提交（`{ scaleKey, answers[], duration }`）；题目按索引重挂载做入场动画；退出二次确认；成长面板手绘 SVG 雷达/环形（含整圆特例）、CSV 导出（Blob + BOM）；积分 = 历史条数 ×10 | 报告下载/分享为提示桩；雷达组均值与 AI 洞察为静态 |
| 咨询中心 | `/counseling`、`/ai-chat`、`/companion` | `counseling/info` 聚合（类型/专长/老师/FAQ）、我的预约、提交/取消预约；`?tab=` ↔ 面板映射（未知值回落并 `replace`） | Tabs 全部 `forceRender`，`BookingPanel` 经 `forwardRef` + `useImperativeHandle` 暴露 `prefill(counselorId)`，实现「老师卡片 → 预约表单」跨 tab 预填；单页表单 4 步 + `Form.useWatch` 实时摘要；可选日期 T+1 ~ T+7 | 时段表硬编码（含两个禁用时段）；公告、FAQ、流程为静态 i18n |
| 时光胶囊 | `/time-capsule`、`/create`、`/:id` | 列表（按状态过滤）、详情、新建、删除；列表额外常驻 `filter=all` 查询用于统计（共享缓存） | 草稿持久化于 `localStorage.capsule_draft`（1s 防抖，成功后清除，不含图片）；富文本 `contentEditable` + `execCommand`（`mousedown` 阻止默认保选区，`innerHTML` 仅在偏离时写回以保光标）；滑动删除用 pointer capture（8px 阈值 + 横向判定 + 橡皮筋 ×0.3 + 单开约束）；卡片键盘 Enter/Space 打开、Delete 删除；倒计时环仅剩余天数 > 0 显示；正文 HTML 注入 + 首字下沉 + 图片 lightbox | 状态/开启方式文案由 `auditStatus`/`status`/`sendStatus` 前端映射 |
| AI 对话 | FAB、`/counseling/ai-chat`、`/companion` | 无 react-query；`streamAiChat` 配置 `VITE_AI_CHAT_URL` 走真实 SSE，未配置或异常回落本地话术引擎；会话内存态不持久化，卸载即中断 | `fetch` + `ReadableStream` 读取（axios 不支持流式）；按空行分帧、残帧留缓冲、兼容 OpenAI `choices[0].delta.content` 与纯文本、忽略 `[DONE]`；发送期间禁止并发；中断保留已生成内容；气泡自动滚动 | 本地引擎含危机关键词兜底与预设话术，非真实模型输出 |
| 用户中心 | `/profile`、`/settings`（均需登录） | **无接口**，读 `userStore.profile` 快照；注销走登出流程；编辑保留备份副本 | 偏好项绑定真实 `useTheme` / `useLocale` 并触发无障碍播报；联系方式换绑为 3 步弹窗 + 60s 重发倒计时；设置页 `IntersectionObserver` 同步目录高亮（`rootMargin: -20% 0px -60% 0px`） | 保存均为**未接通**；统计、成长时间线、设备列表为静态；隐私/通知为本地开关 |
| 登录 | `/login` | `POST /api/student/login`；主域学校列表 `GET /api/tenants/public`（无兜底，失败阻断提交）；记住我 → `localStorage.user` | antd Form + `validateTrigger: 'onBlur'`；学校选择器仅主域且未锁定私有化租户时出现，默认选第一项；跨租户登录整页跳子域；登录成功启动实时连接并按 `from` 回跳（同源 + 路由可达双校验）；已登录访问显示加载并只跳转一次 | 账号登录暂无图形验证码；第三方登录为提示桩 |
| 403 / 404 | `/403`、`*` | 403：租户裁剪或 feature 关闭；404：`*` catch-all | 404 为 4 屏幻灯片 + 4 个小游戏，支持滚轮/触摸/键盘翻页（800ms 动画锁）；游戏舞台按 `key` 重挂载并接管键盘；迷宫 DFS 生成 + canvas（DPR 缩放、主题色经 `color-mix`）；星星拒绝采样；呼吸 rAF 相位循环；记忆 Fisher–Yates 洗牌 | 幻灯片图片外链；游戏文案硬编码中文 |

## 9. Mock 与联调

- **门控**：DEV 默认开启（`VITE_USE_MOCK=0` 关闭）；非 DEV 仅 `VITE_USE_MOCK=1` 强制开启。`msw` 与 fixture 动态 import 隔离，不进生产包。
- **守门顺序**（所有 handler 统一）：300ms 模拟延迟 → 500 注入 → 过期 401 → 写请求 CSRF 校验 → 业务 resolver。
- **信封**：成功 `{ code: 200, data, message }`；业务失败的业务码与 HTTP 状态码保持一致。

| 注入开关 | 行为 |
|---|---|
| `localStorage['mock:expire'] = '1'` | 所有接口 401（验证会话过期链路） |
| `localStorage['mock:csrf'] = '1'` | 写请求缺/错 `X-XSRF-TOKEN` → 403 |
| `localStorage['mock:fail-me'] = '1'` | 仅 `/api/me` 返回 500 |
| `VITE_MOCK_ERROR = '1'` | 所有接口 500 |

- handler 分 11 组（tenant、home、article、capsule、counseling、square、assessment、auth、menu、site、legacy）；持久化键 `mock:session`、`mock:capsules`、`mock:square-feed`、`mock:square-comments`、`mock:assessment-history`、`mock:counseling-bookings`，legacy 仅内存态。
- 登录：任意用户名 + 密码 `111111`；已登记账号返回真实身份，否则按请求租户生成临时身份。
- 租户差异：`default` / `nist` 全量开通，`tsinghua` 裁掉 `/square*`，用于验证 fail-closed 裁剪。

## 10. 构建与部署

### 10.1 命令与产物

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务器 `0.0.0.0:3001`，`/api`、`/hubs`(ws) 代理到 `VITE_PROXY_TARGET`（默认 `http://127.0.0.1:8080`） |
| `pnpm build` | `tsc --noEmit && vite build`，产物 base 为 `/1/`（GitHub Pages 子路径） |
| `pnpm preview` / `pnpm typecheck` | 预览产物 / 仅类型检查 |

构建分块：`vendor-antd`、`vendor-react` 独立成 chunk，`chunkSizeWarningLimit: 1200`。

### 10.2 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_API_BASE_URL` | 业务接口根地址；空则回退 `/api`（同源转发） |
| `VITE_APP_DOMAIN` | 子域名租户解析主域，须 eTLD+1 深度（dev `localhost`，生产必填） |
| `VITE_PRIVATE_TENANT` | 私有化构建期锁定租户；公网留空 |
| `VITE_SIGNALR_HUB_URL` | 实时端点；空则静默跳过 |
| `VITE_AI_CHAT_URL` | AI 流式端点；空则本地引擎 |
| `VITE_USE_MOCK` / `VITE_MOCK_ERROR` | Mock 开关 / 全量 500 注入 |
| `VITE_APP_TITLE` | 站点标题默认值 |

### 10.3 部署要点

- 网关需转发 `/api/*` 与 `/hubs/*`（含 WebSocket 升级），其余走静态资源 + SPA fallback。
- 子路径部署时 `base`、`public/404.html` 的 `pathSegmentsToKeep`、`BrowserRouter basename` 三者必须一致。
- GitHub Pages：push `main` 触发 `.github/workflows/deploy.yml`（`pnpm install --frozen-lockfile` → `pnpm build` → `upload-pages-artifact` → `deploy-pages`）；生产未启用 MSW，接口 404 属预期。
- 后端需按 `api-contract.md` 提供 cookie 会话、`X-Tenant-Id` 与 CSRF 响应头。

## 11. 已知偏差与约束

> 只列影响功能与联调的项；完整待办见 [handover.md](./handover.md)。

| # | 现象 | 影响 |
|---|---|---|
| 1 | `/api/me` 探测比较 `'/api/me'`，实际 `config.url` 为相对 `'me'` | 已登录时探测 401 会 reset + 广播登出，与「探测口不做导航决策」的注释不一致 |
| 2 | 业务码非 200 抛普通 `Error`，非 `ApiError` | 依赖 `ApiError.status === 404` 的分支只对 HTTP 404 生效 |
| 3 | 两套请求契约并存：新模块信封解包，legacy 直连 `http` 取 `res.data` | 联调需按模块区分；`http.put` 未在 `request.ts` 暴露 |
| 4 | 租户配置实例 `baseURL = VITE_API_BASE_URL` 且路径写死 `/api/tenant/config` | 该变量填成 `.../api` 时会拼出 `/api/api/...` |
| 5 | 首帧脚本硬编码 `tsinghua`/`nist` 品牌色；`tenant:brand-primary` 缓存无读取方 | 新增租户需同时改 `index.html` 与 `resolve.ts` |
| 6 | 实时连接仅由登录流程启动，`/api/me` 恢复的会话不连接；`useSignalR()` 无调用方 | 刷新页面后收不到实时推送 |
| 7 | `useLayoutMeta` 路由模式表为手写副本且缺 `/403`；`noPadding` 未被消费 | 403 页无导航/页脚；与路由表存在漂移风险 |
| 8 | `useMenu` 过滤时就地改写 react-query 缓存中的 `children` | 缓存被副作用修改，后续读取拿到已裁剪结果 |
| 9 | 命令面板 13 个入口硬编码，绕过租户裁剪与 i18n | 关闭模块的租户仍可见入口 |
| 10 | 页脚、404 游戏、设置页部分文案硬编码；个人中心/设置保存未接通 | 多语言与持久化不完整 |

## 附录 A · 文档维护规则

| 变更 | 需同步 |
|---|---|
| 新增 / 删除页面 | `config/routes.ts`、本文 §3.1、§8、`layouts/useLayoutMeta.ts` 的路由模式表 |
| 新增接口或改 DTO | [api-contract.md](./api-contract.md)、`src/api/types/` |
| 新增租户或改裁剪语义 | 本文 §4、`config/tenant/`、`index.html` 内联脚本 |
| 新增 UI 模式或动效 | [design-language.md](./design-language.md) |
| 遗留缺陷 / 待办 | [handover.md](./handover.md)、本文 §11 |
