# API 契约文档（mock 即契约）

> 本文件由 mock 层（`src/mocks/`）反向导出，作为后端实现依据。
> 规则：mock 已实现的接口行为 = 契约；后端照此实现；若后端必须偏离，先改本文件再改 mock。

**目录**：0 全局约定（认证/租户/CORS/CSRF/状态码/信封）→ 1 认证 → 2 租户配置 → 3 内容接口 → 4 菜单 → 5 业务功能模块（广场/测评/咨询/胶囊）→ 6 旧系统遗留模块（低优先级）→ 7 SignalR → 8 部署与环境变量 → 9 待确认项

**实现优先级建议**：§1 认证 + §2 租户配置（P0，联调门槛）→ §3 内容 + §4 菜单 + §5 业务模块（P1）→ §7 SignalR（P2）→ §6 legacy（P3，页面迁移后再定）。

## 0. 全局约定

### 0.1 认证模型（cookie 会话）

| 项 | 契约 |
|---|---|
| 登录成功 | 后端 `Set-Cookie: session=...; Domain=.{主域}; HttpOnly; Secure; SameSite=Lax` |
| 前端持有 token | ❌ 不持有；不读 cookie；不注入 `Authorization` 头 |
| 跨子域共享 | `Domain=.{主域}`（如 `.psy.com`）使各子域自动携带 |
| 私有化部署 | Domain 必须是该校域名（如 `.school.edu.cn`），**不能写死 `.psy.com`** |
| 会话恢复 | `GET /api/me`（200 = 已登录，401 = 未登录） |
| 登出 | 后端清 cookie（同 Domain，过期时间置过去） |

### 0.2 mock 层的替代通道（仅 DEV）

| 真实行为 | mock 替代 | 原因 |
|---|---|---|
| Set-Cookie session | `localStorage['mock:session'] = { userId, username, tenantId }` | 浏览器 Service Worker 无法执行 Set-Cookie |
| 跨子域免重登 | **本地无法验证**（`.localhost` 域 cookie 不可用） | 标为「真实环境验证项」 |
| CSRF token | mock 可写非 HttpOnly 的 `XSRF-TOKEN` cookie | 校验逻辑由后端实现；前端仅配置 axios `xsrfCookieName/xsrfHeaderName` |

**前端代码不因 mock 妥协**：`withCredentials: true`、CSRF 头配置照写，mock 只是替代会话载体。

### 0.3 租户上下文

**前端租户解析权威链（3 级，命中即停，`resolveTenantId()`）：**

| 级 | 来源 | 说明 |
|---|---|---|
| 1 | `VITE_PRIVATE_TENANT` | 私有化部署构建期锁定（公网构建为空） |
| 2 | 子域名 | `{tenant}.{VITE_APP_DOMAIN}` 后缀匹配；裸主域 / `www.*` / 多级前缀 / IP → 不命中。**`VITE_APP_DOMAIN` 必须配到主域 eTLD+1 深度**（如 `psy.com`，不可配 `nist.psy.com`）；多级子域前缀不被视作租户 ID |
| 3 | `'default'` | 主站兜底 |

**已删除的旧通道（命中也忽略）**：`?tenant=` query 参数、`sessionStorage['tenant:id']` 会话记忆。

| 项 | 契约 |
|---|---|
| 前端传租户参数 | ❌ 禁止（URL/Body 均无 `tenantId`，防越权） |
| `X-Tenant-Id` 头 | 前端拦截器自动注入（取 `resolveTenantId()` 结果）；**仅作「当前站点租户」提示**，后端可校验或忽略 |
| 后端权威来源 | cookie 身份（登录态）或站点来源 Origin（匿名态） |
| 跨租户 cookie | nist 用户访问 tsinghua.psy.com → 后端按 cookie 判定不属于 tsinghua → `/api/me` 返回 401，前端视为未登录（**不提示归属**） |

### 0.4 CORS（子域 + cookie 前提）

| 响应头 | 契约 |
|---|---|
| `Access-Control-Allow-Origin` | **回显具体 Origin**（如 `https://nist.psy.com`），❌ 不能用 `*` |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Allow-Headers` | 需含 `Content-Type, X-Tenant-Id, X-XSRF-TOKEN` |

### 0.5 CSRF

| 项 | 契约 |
|---|---|
| token 下发 | 登录成功或首请求时，后端 `Set-Cookie: XSRF-TOKEN=...`（**非 HttpOnly**，前端需读） |
| 校验 | 写请求（POST/PUT/PATCH/DELETE）必须带 `X-XSRF-TOKEN` 头，值 = cookie 值；缺/不一致 → **403** |
| 前端实现 | axios 内置：`xsrfCookieName: 'XSRF-TOKEN'` + `xsrfHeaderName: 'X-XSRF-TOKEN'` |
| Mock 模拟 | `localStorage['mock:csrf']='1'` 开启校验；GET 请求时 mock 补种 `XSRF-TOKEN` cookie 模拟下发（默认关闭，需要验证 CSRF 链路时手动开启） |

### 0.6 状态码严格语义

| 状态码 | 语义 | 说明 |
|---|---|---|
| 400 | 参数校验失败 | 如登录缺 username/password（前端表单应提前拦截，此为协议层兜底） |
| 401 | 未登录 / 会话失效 / 跨租户 | **不区分**：跨租户与无权一律 401，不泄露归属 |
| 403 | **仅协议层拒绝** | 仅用于 CSRF 校验失败、CORS 预检拒绝等；**不用于**身份/归属/功能判定 |
| 404 | 资源不存在 | 内容接口在**当前租户数据池**内查找，找不到即 404（与 id 归属无关） |
| 500 | 服务端错误 | 错误响应统一 `{ code, message }`，不含堆栈/内部路径 |

> ⚠️ **HTTP 403 ≠ 前端 403 页面**。「路由未开通 / feature 未开启」是前端 RouteElement
> 渲染 `<ForbiddenView />`（当前依据 `tenant/config.routes` 白名单判定，UI 层行为），
> 后端**不要**为「功能未开通」返回 HTTP 403 —— 未开通的判定数据走 `enabled: false` /
> config.routes 缺项，接口本身照常 200。

### 0.7 mock 全局安全开关（仅 DEV）

| 开关 | 行为 | 验证目标 |
|---|---|---|
| `localStorage['mock:expire']='1'` | **所有接口**返回 401 | 前端「会话过期 → 清状态 → 跳登录」降级链路 |
| `localStorage['mock:csrf']='1'` | 写请求缺/错 X-XSRF-TOKEN → 403 | axios `xsrfCookieName/xsrfHeaderName` 配置 |
| `localStorage['mock:fail-me']='1'` | 仅 `/api/me` 返回 500 | 「5xx/网络错静默：不报错不重试、会话落 anonymous（三态下无乐观态可保持）」 |
| `VITE_MOCK_ERROR=1` | 所有接口 500 | error / loading 分支 |

守门顺序（`mocked()` 统一实现）：延迟 → 500 注入 → 过期 401 → CSRF 403 → 业务 resolver。

### 0.8 统一响应信封

| 项 | 契约 |
|---|---|
| 成功 | `{ code: 200, data: T, message: 'success' }` —— HTTP 200 |
| 业务失败 | `{ code: <业务码>, data: null, message: <用户可读信息> }` —— **业务码与 HTTP 状态码保持一致**（如 401/403/404），便于前端拦截器按 HTTP 状态归一化 |
| 前端解包 | `src/api/request.ts` 自动解包返回 `data`；`code !== 200` 抛错 |
| 特殊错误码 | `INVALID_CREDENTIALS`：仅登录失败专用（§1.1），前端映射「账号或密码错误」 |

---

## 1. 认证接口

### 1.1 登录

| 项 | 内容 |
|---|---|
| Method / Path | `POST /api/student/login` |
| Headers | `Content-Type: application/json`、`X-Tenant-Id: {站点租户}` |
| Body | `{ username: string, password: string, tenantId?: string }` —— 主域（psy.com）**必填**（学校选择器提交）；子域**建议显式传**（前端实现为 `tenantId=resolveTenantId()`，便于后端审计与日志）。**安全判定以 cookie/header 为准，body 里的 tenantId 仅作提示**，后端不得仅凭 body 信任目标租户 |
| 成功响应 | `200 { code: 200, data: { userInfo: { userId, name, tenantId, roleId } }, message: '登录成功' }` + `Set-Cookie`（见 0.1） |
| 参数校验 | 缺 `username`/`password` → `400 { code: 400, message: '缺少必填参数：username/password' }`（前端表单提前拦截，此为协议层兜底） |
| 失败响应 | `401 { code: 401, message: 'INVALID_CREDENTIALS' }` —— **统一错误码**，不区分账号不存在/密码错误/不属该校（防枚举） |
| 重复登录 | **待后端确认**（踢旧会话 / 拒绝新登录 / 并存）——当前 mock 未实现 |

**Mock 账号表**（`src/mocks/data/users.ts`）：

| 租户 | 用户名 | 密码 | userId |
|---|---|---|---|
| default | `social001` | `111111` | `u-social-001` |
| nist | `nist001` | `111111` | `u-nist-001` |
| tsinghua | `thu001` | `111111` | `u-thu-001` |

**Mock 校验规则**（`src/mocks/data/users.ts`）：密码统一为 `111111`，**任意用户名均可登录**（上表账号返回真实身份，未登记账号按请求租户生成临时身份）。真实后端仍需按账号表校验账号存在性与归属租户，失败统一返回 `INVALID_CREDENTIALS`（如 nist001 在 tsinghua 租户下登录 → `401`）。

### 1.2 登出

| 项 | 内容 |
|---|---|
| Method / Path | `POST /api/auth/logout` |
| Headers | （cookie 自动携带） |
| 成功响应 | `200 { code: 200, data: null, message: '已登出' }` + `Set-Cookie` 清 session（过期） |
| 备注 | 失败前端静默（本地状态照清） |

### 1.3 登录态恢复

| 项 | 内容 |
|---|---|
| Method / Path | `GET /api/me` |
| Headers | （cookie 自动携带）、`X-Tenant-Id: {站点租户}` |
| 成功响应 | `200 { code: 200, data: { userId, name, tenantId, roleId } }` |
| 未登录 | `401 { code: 401, message: '未登录' }` |
| **跨租户防御** | 会话 `tenantId` ≠ 请求 `X-Tenant-Id` → **401**（跨租户 cookie 视为未登录，不返回 403、不提示归属） |
| 前端 401 处理 | 未登录 → 完全静默（启动探测正常结果）；**已登录 → 本地清登录态**（会话中途过期，消除「显示已登录但业务接口全 401」矛盾态）。**reset 语义严格限定**：只改 userStore 状态（session=anonymous、profile 清空），**不** `emit('user:logout')`、**不** navigate、**不**停 SignalR——跳转由 ProtectedRoute 响应式判断自动处理（受保护页跳 /login，公共页静默降级） |
| 前端 5xx/网络错处理 | 静默（不报错不重试），会话落 `anonymous`。三态会话（P2）下 profile 不持久化、无乐观态可保持——探测失败即未登录，用户重新登录即可；后端接口本也会因会话失效返回 401。对后端无额外要求 |
| 前端会话三态 | `loading`（启动探测中，受保护路由显示 loading 不跳转）→ `authenticated`（200 且租户匹配）/ `anonymous`（401 / 租户不符 / 5xx / 网络错）。登录态唯一权威 = 后端会话，杜绝"陈旧已登录"闪烁 |

**Mock 错误注入**：`localStorage['mock:fail-me'] = '1'` 时 `/api/me` 返回 500，用于验证前端「5xx/网络错静默不报错不重试、会话落 anonymous 不白屏」。

---

## 2. 租户配置接口

### 2.1 租户配置（已存在，不变）

| 项 | 内容 |
|---|---|
| Method / Path | `GET /api/tenant/config?tenantId={id}` |
| 成功响应 | `200 { code: 200, data: TenantConfigDTO }`（含 `tenantId` 回填、`theme`、`features`、`routes?`、`assets?` 等） |
| 未知租户 | 回退 `default` 配置（`tenantId` 仍回填请求值） |
| 登录页背景 | `assets.loginBackground`：登录页背景图 URL（绝对 URL 或站内绝对路径 `/xxx`），**按租户下发**；缺省 / 空串 = 前端内置默认图。前端在登录页消费该字段，配置到达/刷新后热更新 |

### 2.2 站点路由快照（A 方案契约）

| 项 | 内容 |
|---|---|
| Method / Path | `GET /api/site/routes` |
| Headers | `X-Tenant-Id: {站点租户}` |
| 成功响应 | `200 { code: 200, data: [{ path, componentKey, enabled, redirect? }] }` |
| 语义 | **与 `tenant/config.routes` 同源派生**（单一数据源，两处永不分叉）。消费方区分：**RouteElement 裁剪依据 `tenant/config.routes`**（现状代码）；**`site/routes` 供动态路由表（A 方案）消费**，为路由系统单独提供带 `componentKey`/`enabled` 的快照视图 |
| componentKey 校验（fail-closed） | `componentKey` 必须在前端组件注册表内；**不在注册表内 → 前端忽略该条 + 控制台告警**（防后端配置了已删除/未上线的组件导致白屏）。后端新增 componentKey 前需与前端注册表对齐 |
| Mock 行为 | default/nist 全量 18 条 enabled；**tsinghua 裁掉 `/square*` 三条（enabled=false）**——验证 fail-closed 裁剪 |

### 2.3 学校列表（主域选择器数据源）

| 项 | 内容 |
|---|---|
| Method / Path | `GET /api/tenants/public` |
| 认证 | 无需登录 |
| 成功响应 | `200 { code: 200, data: [{ tenantId, name, logo }] }` |
| Mock 数据 | `[{ tenantId: 'default', name: '社会人士（本站）' }, { tenantId: 'nist', ... }, { tenantId: 'tsinghua', ... }]` |

**约定**：
- 第一项固定为 `default`（主站本身 / 社会人士），选中后 `tenantId=default` 登录留本站
- `name` 是**站点身份标识**（校名/站名），由后端直出，**前端不做 i18n**（多语言下一套站名只有一个正确写法，与 UI 文案分开）
- 前端策略：**完全后端驱动**——不塞兜底项、不预填默认值；成功后默认选中列表第一项。接口失败 → 选择器空 + 提示「学校列表加载失败，请刷新重试」，提交被拦截（不伪造数据）

---

## 3. 内容接口（按租户隔离）

**通用约定**：所有内容接口按 `X-Tenant-Id` 过滤；**前端不传租户参数**；空数组 → 前端区块隐藏，**不得兜底其他租户数据**。

### 3.1 首页轮播

| 项 | 内容 |
|---|---|
| Method / Path | `GET /api/home/carousel` |
| Headers | `X-Tenant-Id` |
| 成功响应 | `200 { code: 200, data: CarouselSlideDTO[] }`（`{ key, image, ctaRoute }`，文案由前端 i18n 按 key 解析） |
| Mock 差异化 | default 3 条（混合图）/ nist 2 条（全 nist 图）/ tsinghua 3 条（全 tsinghua 图）——肉眼可辨 |

### 3.2 首页动态 / 跑马灯 / 导航 / 关于

| Path | 差异化 | 备注 |
|---|---|---|
| `GET /api/home/news` | ✅ 各租户一套（id 段隔离） | 同上 |
| `GET /api/home/marquee` | ✅ + **tsinghua 返回空数组** | 验证「空数据区块隐藏」 |
| `GET /api/home/nav` | ❌ 结构数据各租户一致 | — |
| `GET /api/home/about-stats` | ❌ 同上 | — |

### 3.3 文章

| Path | 内容 |
|---|---|
| `GET /api/articles?category=&keyword=` | 列表，按租户过滤后再筛选；响应 `ArticleListItemDTO[]` |
| `GET /api/articles/:id` | 详情；**跨租户访问他校 id → 404**。语义 = 当前租户池内按 id 查找（`WHERE tenant_id = 当前租户 AND id = ?`），非「按 id 段推断归属再拒绝」；id 段隔离仅是 mock 数据编排约定，后端无需感知 |
| `GET /api/articles/:id/related?limit=4` | 相关推荐，限本租户池内 |

**Mock 数据**（`src/mocks/data/article.ts`）：

| 租户 | id 段 | 数量 | 示例标题 |
|---|---|---|---|
| default | 1-10 | 10 | 在不确定的时代，如何建立内心的秩序？ |
| nist | 101+ | 2 | 南信院心理月：把「情绪急救箱」带进每一间宿舍 |
| tsinghua | 201+ | 2 | 紫荆心旅：期中季「树洞之夜」活动回顾 |

---

## 4. 菜单接口（已存在，补充说明）

| 项 | 内容 |
|---|---|
| Method / Path | `GET /api/menu` |
| 租户维度 | 当前 mock 各租户同一份；真实后端可按 tenantId 重排/过滤（前端 `useMenu` 已做四道过滤兜底，含租户 routes 裁剪） |

---

## 5. 业务功能模块（已 mock，照此实现）

> 通用约定同 §3：按 `X-Tenant-Id` 过滤、空数组区块隐藏、跨租户资源 404。
> DTO 完整字段以前端 `src/api/modules/types.ts` / `types/` 为准（前后端共用同一类型源）。

### 5.1 心理广场（square）

| Method / Path | 说明 | 请求 / 响应 |
|---|---|---|
| `GET /api/square/info` | 广场只读聚合（feed / members / topics / 在线与今日新增） | → `SquareInfoDTO` |
| `GET /api/square/feed/:id` | 动态详情 | → `SquareFeedDTO`；他校 id → 404 |
| `POST /api/square/feed/:id/like` | 点赞/取消（幂等切换） | → `SquareLikeDTO`（最新状态） |
| `POST /api/square/feed` | 发布动态，body `SquareCreateDTO`（JSON） | → `SquareFeedDTO` |
| `GET /api/square/feed/:id/comments` | 评论列表（时间倒序） | → `SquareCommentDTO[]` |
| `POST /api/square/feed/:id/comments` | 发布评论，body `SquareCommentCreateDTO`（`parentId` 回复某条） | → `SquareCommentDTO` |
| `POST /api/square/comments/:id/like` | 评论点赞/取消 | → `SquareCommentLikeDTO` |

### 5.2 心理测评（assessment）

| Method / Path | 说明 | 请求 / 响应 |
|---|---|---|
| `GET /api/assessment/scales` | 量表目录 | → `AssessmentScaleDTO[]` |
| `GET /api/assessment/scales/:id` | 量表详情与题目 | → `AssessmentScaleDetailDTO`；不存在 → 404 |
| `POST /api/assessment/results` | 提交答案，body `AssessmentSubmitDTO`；**计分在服务端**，前端只收结果 | → `AssessmentResultDTO` |
| `GET /api/assessment/history` | 历史记录（倒序，当前用户） | → `AssessmentResultDTO[]` |
| `DELETE /api/assessment/history` | 清空当前用户历史 | → `null` |

### 5.3 心理咨询（counseling）

| Method / Path | 说明 | 请求 / 响应 |
|---|---|---|
| `GET /api/counseling/info` | 咨询中心只读聚合（类型/专长/老师/FAQ） | → `CounselingInfoDTO` |
| `GET /api/counseling/bookings` | 我的预约列表（创建时间倒序） | → `BookingDTO[]` |
| `POST /api/counseling/bookings` | 提交预约，body `BookingCreateDTO` | → `BookingDTO` |
| `PATCH /api/counseling/bookings/:id/cancel` | 取消预约 | → `BookingDTO`（更新后实体） |

### 5.4 时光胶囊（capsule）

| Method / Path | 说明 | 请求 / 响应 |
|---|---|---|
| `GET /api/capsules?status=&openDateFrom=&openDateTo=` | 列表（过滤在后端完成；status 缺省 all） | → `CapsuleListItemDTO[]` |
| `GET /api/capsules/:id` | 详情 | → `CapsuleDetailDTO`；不存在 → 404 |
| `POST /api/capsules` | 新建，body `CapsuleCreateDTO` | → `CapsuleDetailDTO` |
| `DELETE /api/capsules/:id` | 删除（仅本人） | → `null` |

> 状态与开启方式文案前端按 i18n 解析，接口不下发文案。

---

## 6. 旧系统遗留模块（legacy，低优先级）

> 来源：旧 Vue 后端接口（`src/api/modules/` 的 admin / user / schedule / reservation / lab），
> **页面尚未迁移到本前端**（无路由消费），仅 API 层就绪。
> 契约 = 旧形态（参数走 **query**，@RequestParam 风格，与 §5 的 JSON body 风格不同）。
> **预计随页面迁移重新契约化后废弃**——后端可最后实现 / 暂缓。

| Method / Path | 说明 |
|---|---|
| `GET /api/teachers` / `GET /api/users` / `GET /api/admins` | 教师 / 全部用户 / 管理员列表 → `UserInfo[]` |
| `POST /api/admin/create` | 创建用户（query 传参） |
| `DELETE /api/admin/delete?roleId=&userId=` | 删除用户 |
| `POST /api/admin/update_user` / `POST /api/admin/reset_password` | 更新用户 / 重置密码 |
| `POST /api/user/update` / `POST /api/admin/update` | 更新个人信息（按角色分流 URL） |
| `POST /api/{user\|teacher\|admin}/update_password` | 修改密码（按角色分流 URL） |
| `GET /api/usersInfo?roleId=student` | 全部学生（管理端） |
| `POST /api/user/add_student` / `DELETE /api/user/delete_student?userId=` | 新增 / 删除学生 |
| `GET /api/user/courses?roleId=&userId=` | 课表 → `Course[]` |
| `GET /api/current_term` | 当前学期 → `TermInfo` |
| `GET /api/reservations/all` | 全部预约（管理端审核） |
| `PUT /api/reservations/status?reservationId=&status=` | 更新预约状态 |
| `DELETE /api/deleteReservation?reservationId=` | 删除预约 |
| `GET /api/computer-labs` / `GET /api/computer-labs/:roomId` | 机房列表 / 详情 |
| `POST /api/computer-labs` | 创建机房（**body JSON**，唯一例外） |
| `PUT /api/computer-labs/:roomId` / `DELETE /api/computer-labs/:labId` | 更新 / 删除机房 |
| `GET /api/seats?roomId=` / `GET /api/seats/status?roomId=&date=&startTime=&endTime=` | 座位列表 / 按时段状态 |
| `POST /api/reservations`（query 传参） | 创建机房预约 |
| `GET /api/reservations/user?userId=` | 按用户查预约 |
| `DELETE /api/reservations?reservationId=&userId=` | 取消预约 |
| `PUT /api/seats/status` | 更新座位状态（单个或批量） |

---

## 7. SignalR 实时通道

| 项 | 契约 |
|---|---|
| 端点 | `VITE_SIGNALR_HUB_URL`（dev 经 vite proxy `/hubs` → 后端；生产独立配置） |
| 认证 | **cookie**（协商请求与 WebSocket 升级均带会话；前端已显式 `withCredentials: true`，无 accessTokenFactory） |
| Client → Server | `joinTenant(tenantId)` —— 连接建立与重连成功后调用，服务端按租户分组推送 |
| Server → Client | `receiveNotification(data)` —— 通知（前端计未读 + 广播） |
| Server → Client | `forceLogout(data)` —— 服务端强制下线：前端清认证态并跳登录页（对应 §9 待确认项 7 的「踢旧会话」实现载体） |
| 重连 | 前端 `withAutomaticReconnect([0, 2000, 5000, 10000])`；重连成功自动重新 `joinTenant` |

---

## 8. 部署与环境变量（前端构建期）

| 变量 | 公网 SaaS | 学校私有化 | 说明 |
|---|---|---|---|
| `VITE_API_BASE_URL` | 空（走 `/api` 同源转发） | 空 | 空值时前端回退 `'/api'`；仅前后端分域部署时填绝对地址（此时 CORS §0.4 生效） |
| `VITE_APP_DOMAIN` | 主域 eTLD+1（如 `psy.com`） | 该校主域（如 `school.edu.cn`） | 子域名租户解析依据；**必须 eTLD+1 深度**，漏配 → 前端生产断言报错且全部回退 default |
| `VITE_PRIVATE_TENANT` | 空 | 该校租户 id（如 `nist`） | 非空时构建期锁死租户（登录页不显示学校选择器） |
| `VITE_SIGNALR_HUB_URL` | SignalR 端点 | 同左 | 空值时前端静默跳过实时连接 |
| `VITE_PROXY_TARGET` | （仅 DEV）本地后端地址 | 同左 | vite dev server 的 `/api`、`/hubs` 转发目标 |

**网关/反向代理要求**：`/api/*` 与 `/hubs/*`（含 WebSocket 升级）转发到后端；其余路径走前端静态资源。

**后端 cookie 规格复述**：`Set-Cookie: session=...; Domain=.{VITE_APP_DOMAIN 对应主域}; HttpOnly; Secure; SameSite=Lax`——私有化部署 Domain 必须随环境变化（§9 待确认项 1）。

---

## 9. 待确认项（后端实现前需拍板）

| # | 项 | 说明 |
|---|---|---|
| 1 | 私有化 cookie Domain 动态配置 | 后端按部署环境生成 Domain（`.psy.com` vs `.school.edu.cn`） |
| 2 | SignalR 协商端点 cookie 认证 | 前端已删 `accessTokenFactory`；协商请求需接受 cookie |
| 3 | `/api/me` 401 vs 网络错 | 前端同处理（匿名态）；后端保证 401 语义只用于「未登录/跨租户」 |
| 4 | 校际文案差异 | 当前 mock 文案走前端 i18n key；若需校际差异，后端在 DTO 增加 `title`/`summary` 直出字段 |
| 5 | default 租户 routes 快照 | 是否显式下发（fail-open 全量 → 匿名可见全部页面壳） |
| 6 | 区块配置需求 | 是否存在「同一页面不同学校区块种类/顺序不同」；有则新增 `GET /api/site/home-sections` |
| 7 | 重复登录策略 | 同一账号多处登录：踢旧会话 / 拒绝新登录 / 并存（mock 暂未实现） |
