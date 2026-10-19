# Vue / Element Plus → React / Ant Design 迁移对照说明

> 迁移范围：全站（170 文件 / 3.4 万行）—— 13 个视图 + 全部业务组件 + 布局/导航 + API/实时层 + 多语言 + 命令面板
> 原实现：Vue 3.5 + TypeScript + Element Plus 2.13 + Pinia + Vue Router 4 + vue-i18n + Vite
> 新实现：React 18.3 + TypeScript + Ant Design 5.27 + React Router 6 + 自研 useI18n + Vite
> 目录：`f:\React\syxl`（Vue）→ `f:\React\syxl-react`（React）
> 迁移方式：Wave 0-3 分批并行推进，每批集中 `tsc --noEmit` 验证

---

## 一、架构总览：Pinia → 模块级外部 Store（本迁移最核心的架构决策）

### 1.1 为什么不用 Context

axios 拦截器（`src/api/interceptors.ts`）与 SignalR 连接层（`src/realtime/connection.ts`）是**非 React 代码**，
也需要读写 user/tenant/realtime store（注入 token、401 清态、重连计数等）。
Context Hook 在组件外调用会直接抛错，因此状态必须是**模块级单例**。

### 1.2 createStore 工厂（`src/stores/createStore.ts`）

```
createStore(initialState, transform?) →
  { getState, getSnapshot, subscribe, setState, useStore }
```

- `setState`：先重建快照（transform 拼装 getters + actions）再广播，保证
  `useSyncExternalStore` 的 `getSnapshot` 引用稳定（避免无限重渲染）
- 双入口约定：
  - 组件内 `useUserStore()`（= `store.useStore()`，订阅变更触发重渲染）
  - 基础设施层 `getUserStore()`（= `store.getSnapshot()`，任意时机可读写，永远最新）
- 持久化：`store.subscribe(() => localStorage.setItem(...))`，与
  pinia-plugin-persistedstate 同时机、同落盘格式（localStorage key `user`），旧数据可直接继承

| Pinia | React 版 | 文件 |
|---|---|---|
| `defineStore('user')` + persist | `useUserStore` / `getUserStore` | `src/stores/useUserStore.tsx` |
| `defineStore('app')`（device/theme/locale） | `useAppStore` / `getAppStore` | `src/stores/useAppStore.tsx` |
| `defineStore('tenant')` + bootstrap() | `useTenantStore` / `getTenantStore` / `bootstrapTenant()` | `src/stores/useTenantStore.tsx` |
| `defineStore('realtime')` | `useRealtimeStore` / `getRealtimeStore`（刻意不持久化） | `src/stores/useRealtimeStore.tsx` |

### 1.3 其余模块级单例（同模式）

| Vue | React | 说明 |
|---|---|---|
| `useTheme`（VueUse useColorMode） | `src/composables/useTheme.ts` | localStorage `theme-mode` + `html.dark` + matchMedia 跟系统 + 跨标签页 storage 同步 |
| `useCommandPalette`（模块级 ref） | `src/composables/useCommandPalette.ts` | `{open: boolean, toggle, close}`，useSyncExternalStore 订阅 |
| `v-reveal` 指令 | `src/hooks/useReveal.ts` | 共享 IntersectionObserver + 1.2s 兜底；列表项抽内部子组件调用 |

---

## 二、文件结构对照（结构等价）

| Vue（原） | React（新） | 说明 |
|---|---|---|
| `src/main.ts` | `src/main.tsx` | ConfigProvider + ThemedRoot（暗色算法联动）+ bootstrapTenant |
| `src/App.vue` | `src/App.tsx` | 完整路由表（lazy 分片）+ GlobalEvents（emitter 桥） |
| `src/plugins/pc.ts`（EP 注册） | ConfigProvider（main.tsx） | 组件库注册 → Provider 树 |
| `src/router/{index,pc,mobile,guards}.ts` | `src/App.tsx`（Routes）+ `src/layouts/ProtectedRoute.tsx` + `src/layouts/useLayoutMeta.ts` | 命名路由 → 路径路由；beforeEach 守卫 → ProtectedRoute 组件；route.meta → useLayoutMeta 路径规则 |
| `src/layouts/{Navbar,AppShell,pc|mobile DefaultLayout}` | 同名 `.tsx` + `.css` | 布局 1:1；DefaultLayout 内 `<Outlet/>` 作路由出口 |
| `src/composables/useAuth.ts`（vue-request） | 同名（手写 manual 请求 hook） | 导出名不变：useAuthLogin/useRegister/useForgotPassword/sendEmailCode/logout/fetchUserInfoById |
| `src/composables/useAiChat.ts` | 同名 | 聊天流式状态 hook，函数式 setState 等价重写 |
| `src/api/**`（axios + 拦截器） | 同名 | 拦截器内 useXxxStore(pinia) → getXxxStore() |
| `src/realtime/**`（SignalR） | 同名 | `useSignalR()` 为组件内唯一入口；`on()` 返回退订函数供 useEffect cleanup |
| `src/events/**`（mitt） | 同名原样迁移 | 事件表类型零改动 |
| `src/locales/{zh-CN,zh-TW,en-US}.ts` | `src/i18n/` 同名 + `index.tsx` | 自研 useI18n：`t('a.b', {name})` 点路径 + 插值；**分组名 article（非 articles）、notFound（非 notfound）** |
| `src/config/tenant/**` | 同名原样迁移 | 防闪烁脚本移入 `index.html`；`BRAND_PRIMARY_CACHE_KEY` 由 tenant store 导出 |
| `src/styles/*` | 同名 + `#app` → `#root` | tokens/brand/reveal/base/main/dark-mode/element 全量迁移；main.css 的 EP 覆写段无宿主自动失效（无害保留） |
| `views/*.vue`（13 个） | 同名 `.tsx/.css` | 视图层 1:1 |
| `components/base/*.vue`（5 个） | 同名 `.tsx/.css` | BaseAnimatedCounter/BaseCountdownRing/BaseInitialAvatar/BaseReadProgress/BaseCommandPalette |
| `components/business/**`（~60 个） | 同名 `.tsx/.css` | 组件粒度 1:1，含子目录结构（login-way/other/notfound games 等） |
| `modules/{square,time-capsule}/**` | 同名 | 模块目录原样（components + views） |

---

## 三、组件映射表（功能 + 视觉等价）

### 3.1 弹窗与反馈

| Element Plus | Ant Design 5 | 关键差异与最佳实践 |
|---|---|---|
| `<el-dialog v-model="visible">` | `<Modal open onCancel footer={null}>` | AntD 5 属性名是 `open`（`visible` 已废弃）；关闭 = `onCancel` |
| `align-center` | `centered` | 语义一一对应 |
| `ElMessage.success(...)` | `const { message } = AntApp.useApp(); message.success(...)` | **必须用 `App.useApp()`** 而非静态方法，才能吃到 ConfigProvider 主题与上下文 |
| `ElMessageBox.confirm(type:'warning')` | `modal.confirm({ icon: <ExclamationCircleFilled/> })` | `confirmButtonText/cancelButtonText` → `okText/cancelText`；危险操作补 `okButtonProps={{danger:true}}` |
| `defineExpose({ prefill })` | `forwardRef` + `useImperativeHandle` | 父组件 `ref.current.prefill(id)` 等价调用 |

### 3.2 表单与输入

| Element Plus | Ant Design 5 | 关键差异与最佳实践 |
|---|---|---|
| `<el-input v-model :prefix-icon clearable>` | `<Input value onChange prefix allowClear>` | `v-model` 拆为受控对 |
| `<el-select>`（下划线极简外观） | `<Select>` + `.cons-select .ant-select-selector` 适配 | 视觉靠 CSS 对齐 |
| `<el-form :model :rules>` | AntD `Form`（onFinish + rules）或自定义 DOM | 视觉 1:1 优先：部分表单保留原 DOM + 手动校验（如 AI 视图），复杂表单用 AntD Form（登录/联系表单） |
| `rules.trigger: 'blur'` | `validateTrigger: 'onBlur'` | EP 事件名 → antd 事件名映射 |
| `el-date-picker daterange` | `DatePicker.RangePicker`（dayjs） | string[] → `[Dayjs, Dayjs] \| null` |
| `el-date-picker`（行内唤起 `focus()`） | DatePicker 受控 `open` + `onOpenChange` | antd 无 focus 唤起，受控开关等价 |
| `show-word-limit` | `showCount` | 计数视觉略异（组件库差异） |
| `active-color`（Switch） | CSS 覆写 `.ant-switch-checked { background: var(--brand-primary) }` | antd 无该属性 |

### 3.3 展示与导航

| Element Plus | Ant Design 5 | 关键差异与最佳实践 |
|---|---|---|
| `el-tabs` + `el-tab-pane` | `Tabs items={[...]}` + `forceRender: true` | 隐藏页签内 ref 需预挂载时必须 forceRender（咨询中心预约 prefill 依赖此） |
| `el-collapse accordion` | `Collapse accordion activeKey expandIconPosition="end" bordered={false}` | 右侧箭头对齐 |
| `el-drawer append-to-body direction="rtl"` | `Drawer placement="right"` | antd 默认 portal 到 body |
| `el-dropdown`（divided / popper 全局样式） | `Dropdown menu items`（`type:'divider'`）+ `.ant-dropdown-*` 选择器 | teleport popper → antd 内建 portal |
| `el-progress / el-tag / el-empty / el-skeleton` | `Progress / Tag / Empty / Skeleton` | `type` 语义名 → `color` 预设名（success→success, info→processing, danger→error） |
| `el-pagination` | `Pagination` | 布局参数对齐 |
| `<component :is="iconName">` | `ScaleIcon name={...}`（字符串注册表） | 数据层 icon 保持字符串不污染 |
| EP 图标 → AntD 图标 | 就近映射（全文统一） | `Sunny→SunOutlined`、`Moon→MoonOutlined`、`Monitor→DesktopOutlined`、`SwitchButton→LogoutOutlined`、`Share→ShareAltOutlined`、`Message→MailOutlined`、`School→BankOutlined`、`Postcard→FormOutlined`、`Timer→FieldTimeOutlined`、`HotWater→FireOutlined`、`Collection→AppstoreOutlined` 等（@ant-design/icons 无 SchoolOutlined/SwitchButtonOutlined，取语义最近图标） |

---

## 四、语法 / API 映射表

| Vue 3 | React 18 | 说明 |
|---|---|---|
| `<script setup>` | 函数组件 + Hooks | 逻辑顺序保持（state → computed → watch → methods → lifecycle） |
| `ref / reactive` | `useState`（+ `useRef` 镜像高频值） | 拖拽偏移等高频写值走 ref，仅活跃态进 state 驱动渲染 |
| `computed` | `useMemo` | 手写依赖数组 |
| `watch(..., {immediate})` + `onMounted` | 挂载即执行的 `useEffect` | 合并为单 effect；跳过首次用 ref 哨兵（胶囊草稿） |
| `defineProps / withDefaults` | `interface Props` + 解构默认值 | Props 接口具名导出 |
| `defineEmits` | `onXxx` 回调 props | `emit('update:open')` → `onUpdateOpen` |
| `defineModel` | 受控 `{value, onChange}` props | |
| `v-reveal` | `useReveal({delay})` 返回 ref | Hooks 不能在 map 中调用 → 抽内部子组件（FeedCard/SidebarCard/ArchiveEntry） |
| `v-html` | `dangerouslySetInnerHTML` | 数据源均为本地 i18n/静态 data，注释标明可信 |
| `v-show` | `style={{display}}`（SVG 图表区） | 保持 DOM 挂载，图表状态不丢失 |
| `<transition name="x" mode="out-in">` | `key` 重挂载 + CSS 入场动画 | 不引第三方过渡库；离场动画需要时用 `closing` 状态延迟卸载（命令面板 200ms） |
| `<TransitionGroup>` | 直接移除条目（动画类保留追溯） | React 无内置等价物且不引库 |
| `teleport` | 固定定位直接渲染 / AntD 内建 portal | |
| `nextTick`（滚动锚定） | setState 后 `useEffect` 或 flushSync 等价 | |
| `useRoute().query` | `useSearchParams()` | tab/query 直达定位一致；咨询中心 tab 读写 URL（刷新/分享保持页签） |
| `router.push({name, params})` | `` navigate(`/path/${id}`) `` | 命名路由 → 路径（全文按 pc.ts 换算表） |
| `useRequest`（vue-request） | 手写 `useManualRequest`（useState + useCallback + useRef） | run 引用稳定、错误归一化、hooks 经 ref 保最新闭包 |
| `onScopeDispose` | `useEffect(() => abort, [abort])` | useAiChat 流式中断 |
| `:deep(.el-icon)` | `.anticon` 后代选择器 | 全文统一 |

---

## 五、各模块关键实现决策（非机械直译项）

### 5.1 布局与导航（Wave 1）
- **route.meta 等价层**：React Router 无 meta，`useLayoutMeta()` 按 pc.ts 路径规则给出
  `transparentNavbar/noPadding`（`/`、`/login`）、`hideNavbar/hideFooter`（`/assessment/take/*`、404 兜底），
  内含 18 条路由模式匹配（`:xxx` 参数段通配）。
- **requiresAuth**：`ProtectedRoute`（未登录 → `<Navigate to="/login" replace/>`，不带 redirect 回跳，与原守卫一致）。
- **页面过渡**：`<transition name="page-fade">` → `<div key={pathname} className="page-fade">` + 入场 keyframes。
- **全局事件桥**：Vue 版 main.ts 的 `emitter.on('user:logout')` 与 beforeunload 清持久化 →
  App.tsx 内 `GlobalEvents` 组件（useNavigate + useEffect cleanup）。
- **useAuth 懒加载改静态**：`void import('@/realtime/connection')` 动态导入 → 静态 import（打包器自动分片，行为等价）。

### 5.2 命令面板（Wave 1）
- 全局开关模块级单例（见 1.3）；快捷键 Ctrl/⌘+K、`/`、ESC 在 AppCommandPalette 的 useEffect 注册。
- Vue 版 `emit('navigate')` 由 AppShell 跳转 → React 版组件内部 `useNavigate()` 直接跳（消除一层接线）。
- 离场动画：内部 `closing` 状态延迟 200ms 卸载 + 递增 `session` 作 key 保证重开重放进场动画。

### 5.3 业务模块（Wave 2）
- **tm() 数组文案**：React useI18n 只暴露字符串 `t` → 「点路径 + 序号」逐项探测
  （`t('home.news.items.0.title')`，缺键回退返回 key 本身作为越界哨兵），三语切换实时生效。
- **首页轮播**：保持自定义 DOM 实现（首尾克隆 + transitionend 无缝归位 + 拖拽惯性），视觉 1:1 优先于组件替换；
  拖拽逻辑值走 ref 镜像防闭包陈旧。
- **咨询中心**：`el-tab-pane` → Tabs items 全部 `forceRender: true`（保证 BookingPanel 的 prefill ref 可用）。
- **AiAssistantFab**：createPortal 到 body；首页按 Vue 源挂载。

### 5.4 时光胶囊（Wave 3）
- **wangEditor 降级**：React 版不引入 `@wangeditor/editor`（依赖最小化），改 contentEditable div +
  `document.execCommand` 工具栏（B/I/U/S/列表），内容仍为 HTML 字符串，草稿/计数/校验逻辑逐字保留。
- 隐藏日期选择器 `focus()` 唤起 → DatePicker 受控 `open`。
- keyframes `spin` → `capsule-spin`（平铺 CSS 下防跨模块同名互覆）。

### 5.5 登录 / 404（Wave 3）
- 登录三 tab 沿用旧语义（提交跳过前端校验直调 runLogin，rules 保留配 validateTrigger 复刻 EP 即时校验展示）。
- 验证码「Input + canvas」整行封装为模块级受控 `CaptchaField`（模块级定义避免每次渲染重挂载丢焦点）。
- 404 小游戏（迷宫/呼吸/记忆/星星）：非响应式状态 ref 化 + `gameLevelRef` 镜像供 setTimeout 闭包读最新关卡；
  GameStar.drawStars 显式收 `connected` 参数（Vue 同步读 vs React setState 异步）。
- `:key={activeGame}` 重挂载等价 Vue `:key` 切换游戏舞台。

### 5.6 全局样式与暗色模式
- `styles/*` 全量迁移（`#app` → `#root`）；dark-mode.css（4600 行）主体为业务真实类名，直接平移有效；
  其 el-* 覆写段（136 处）在 AntD 下无宿主、无害保留。
- AntD 组件暗色由 `ConfigProvider theme.algorithm = darkAlgorithm` 承担（ThemedRoot 订阅 useTheme().isDark），
  与 dark-mode.css 的 `html.dark` 体系并行生效。
- index.html 逐字迁移：租户防闪烁内联脚本（读 `tenant:brand-primary`）、meta/OG、Google Fonts、标题。

---

## 六、路由对照（最终接线）

| Vue Router 4 | React Router 6 | 说明 |
|---|---|---|
| `createAppRouter()` 按设备选 pc/mobile 路由表 | `isMobileUA() ? MobileDefaultLayout : PcDefaultLayout`（模块级一次判定） | 同一视图集合 + 布局分流 |
| 全部懒加载 | `React.lazy` + `<Suspense fallback={null}>` | 等价分片 |
| `meta.requiresAuth` 守卫 | `ProtectedRoute` | 不带 redirect 回跳 |
| `afterEach` 设标题 + 设备登记 | 租户 store applyConfig（标题）+ appStore.setDevice（入口判定） | |
| `scrollBehavior`（回顶/锚点平滑） | 交由各视图原实现（与 Vue 版行为一致） | |
| `/` → home；`*` 子路径 catch-all → NotFoundView | 同构 `<Route path="/" element={<DefaultLayout/>}>` + 子 `<Route path="*">` | |
| `emitter user:logout` → push login | GlobalEvents（App.tsx） | 401 与手动登出统一入口 |

---

## 七、构建与脚本对照

| 项 | Vue 版 | React 版 |
|---|---|---|
| dev | `vite --mode pc`（3000 端口） | `pnpm dev`（3000 端口） |
| build | `vue-tsc && vite build` | `tsc --noEmit && vite build` |
| 代理 | `/api`、`/hubs` | `vite.config.ts` 等价复刻 |
| base | `/101/` | `/101/` |
| 新增依赖 | — | axios ^1.7.9、mitt ^3.0.1、@microsoft/signalr ^8.0.29（声明于 package.json） |

---

## 八、已知偏差清单（等价性权衡记录）

1. **离场动画简化**：Vue `<transition mode="out-in">` 的离场半段在 key 重挂载下不表达（除命令面板用 closing 延迟卸载实现外）；视觉为「仅入场」。
2. **wangEditor → execCommand 富文本**：功能等价（HTML 字符串 + 基础格式化），工具栏交互略简。
3. **tm() → 点路径序号探测**：语义等价，多一次 key 回退判断。
4. **el-* 组件内部类选择器**：`.el-input__wrapper` 等按 antd 类名等价翻译（`.ant-input` 等），像素级细节（如 focus 阴影方案）按 antd 描边方案对齐。
5. **BaseCountdownRing 响应 props 变化**：Vue 版仅 onMounted 一次，React 版以 `[days,total]` 为依赖（初始渲染 1:1，属视觉增强）。
6. **useAuth 动态导入改静态**：懒加载优化点让位代码简洁，打包分片由构建器处理。
7. **showCount / el-empty 插图 / Tab 间距**等组件库默认视觉微差，均以 CSS 覆写对齐为主、接受微差为辅。

---

## 九、验证状态

- 全量 `tsc --noEmit` 通过（除三个待安装依赖的 TS2307）。
- 每批次子代理自验 + 批间集中验证（Wave 0-3 共 6 轮）。
- 遗留：用户终端 `pnpm install`（安装 axios/mitt/@microsoft/signalr）后 `pnpm build` 出产物。
