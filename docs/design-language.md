# 生涯心旅 · 设计语言规范（Design Language）

> 本文档是所有 UI 改动的**强制约束基线**。任何新增/修改 UI 的 MR 都须对照本文自检；
> 与本文冲突的实现视为缺陷。本文档只约束「交互品质与系统性秩序」，**不改变现有视觉识别**。

---

## 0. 定位与适用范围

- 本产品是**纯用户端（C 端）展示型产品**：无后台管理式的表格/表单密集场景。
- **antd 定位：复杂控件工具**。仅用于 DatePicker / Upload / Select / Drawer / Dropdown /
  Modal 这类自带复杂交互行为的控件；布局、导航、卡片、按钮等一律自有 CSS + 必要时
  Radix 行为层。**禁止**为「看起来统一」而把布局外壳交给 antd（Layout/Menu/FloatButton
  不作为布局基础）。
- 优先级顺序：**可访问性 > 一致性 > 视觉表现 > 开发便利**。

---

## 1. 视觉识别（不可替换项）

以下四项是本产品的视觉资产，**任何改造不得移除或稀释**：

| 识别项 | 说明 | 现状载体 |
|---|---|---|
| 印刷风硬阴影 | `4px 4px 0 color-mix(in srgb, var(--brand-primary) 22%, transparent)` 式零模糊偏移阴影，呼应品牌印刷气质 | FAB、徽章、强调块 |
| 噪点层 | `.grain-overlay` 全局颗粒纹理 | AppShell |
| 品牌色板 | `PALETTES`（blue/green/purple/orange）多租户色板体系，语义 token 全部由其派生 | `src/styles/palette.ts` / `palettes.css` |
| Mega Menu | 顶部导航 hover 展开的**多列分组面板**（非单列下拉） | Navbar |

**吸收 Apple 的交互品质 ≠ 换皮。** 交互手感（曲线、时长、热区、焦点管理、层次反馈）
向高品质对齐；视觉识别保持自有。

---

## 2. 禁止事项（红线）

1. ❌ 禁止引入**全站毛玻璃**（backdrop-filter 仅限既有的导航滚动态等局部场景，不得扩散）。
2. ❌ 禁止把暗色改成**纯黑暗色风格**（#000 底 + 高对比霓虹）；暗色表面遵循 `:root.dark`
   既有 token（antd 官方派生值体系）。
3. ❌ 禁止 **squircle / 超椭圆圆角**及任何新造圆角形制；圆角只走 `--radius-*` 谱系（§5.3）。
4. ❌ 禁止绕过语义变量直接写色值（hex/rgb/named color）；唯一例外是 token 定义文件本身
   （tokens.css / palettes.css / dark-mode.css 的变量定义区）。
5. ❌ 禁止移除键盘焦点样式（`outline: none` 必须伴随等效的 `:focus-visible` 替代，§4.3）。
6. ❌ 禁止新增 `!important` 覆写自有样式（对第三方组件样式的既有覆写维持现状，不新增）。

---

## 3. 动效规范

### 3.1 曲线与时长（唯一曲线 · 三档时长）

```css
:root {
  --ease-standard: cubic-bezier(0.32, 0.72, 0, 1);  /* 唯一交互曲线 */
  --duration-fast: 160ms;   /* 微反馈：hover、按压、开关 */
  --duration-base: 280ms;   /* 常规：面板展开、菜单、抽屉 */
  --duration-slow: 360ms;   /* 大位移：FAB 面板、页面级过渡 */
}
```

- 所有**交互反馈类**过渡：`transition: <property> var(--duration-*) var(--ease-standard)`。
  不允许出现裸 `ease` / `linear` / 其他手写 cubic-bezier。
- **叙事/氛围动画白名单**（不适用三档，见 §3.4）：scroll-reveal 显现（0.8s 级）、
  轮播横移、呼吸练习（4–6s 生理节奏）、计时环/进度条长动画（1–1.6s）、页面进场 stagger。
  白名单动画的曲线收敛到 `cubic-bezier(0.32, 0.72, 0, 1)` 或保留既有 easeOutQuint 系
  （0.22/0.16 变体在白名单内合法），但**不得再新增曲线种类**。

### 3.2 按压反馈

可点击元素（button、可点击卡片、菜单项、FAB、标签页）统一：

```css
.pressable:active { transform: scale(0.97); }
```

- 已有 hover 位移/抬升的元素（如卡片 `translateY(-4px)`），按压时在合成 transform 上
  追加 scale(0.97)，不得互相覆盖。
- 带硬阴影的元素按压时阴影偏移量同步减半（印刷风「按下」手感），属可选增强。

### 3.3 `prefers-reduced-motion`（强制）

全局兜底（main.css）：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

JS 侧平滑滚动（`scrollIntoView({behavior:'smooth'})`、`window.scrollTo({behavior:'smooth'})`）
必须先读 `matchMedia('(prefers-reduced-motion: reduce)')`，命中时降级 `behavior:'auto'`。
已知调用点：HomePageView（wheel 首屏滚动、锚点）、BackTop、NotFound 导航。

### 3.4 动效验收

- 交互反馈 ≤ 360ms 内完成；任何动画不得阻塞交互（不得用 transition 做 UI 状态锁）。
- 呼吸/氛围类循环动画在 reduced-motion 下必须静止。

---

## 4. 交互与无障碍规范

### 4.1 最小热区 44×44px

- 所有可点击目标（含图标按钮、分页点、kbd 触发器）**可视或可命中区域 ≥ 44×44px**。
- 视觉尺寸可以小于 44px（如 30px 图标），但须用透明 padding / `::before` 扩展命中区。
- 相邻热区间距 ≥ 8px，防止误触。

### 4.2 键盘可达

- 任何用 `div / li / span + onClick` 实现的交互控件，必须补齐：`role="button"`（或语义
  标签）、`tabIndex={0}`、Enter/Space 触发（或改用 `<button>`）。**优先改用原生
  `<button>` + 样式 reset，而不是补 aria**。
- 危险操作（删除面板等）必须是键盘可达的真按钮，且不得只靠 hover 呈现。

### 4.3 焦点样式不可移除

- `outline: none` 仅允许出现在**提供了等效替代**的规则里：输入框类用 `border-color` +
  焦环（现有 `--brand-primary` 3px 10% 聚焦圈即合规替代）；非输入控件用
  `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }`。
- antd 控件沿用其内置焦点环，不自定义移除。

### 4.4 浮层（Popover / Drawer / Mega Menu / FAB 面板 / 命令面板）

- 打开时焦点移入浮层；`Esc` 关闭；关闭后焦点还原到触发器。
- 焦点圈闭（focus trap）：Tab 循环不逃逸到背景。antd Drawer/Modal/Dropdown 已内置，
  **自绘浮层（mega-menu、AssistantFab 面板、BackTop 快速导航）必须自行实现或接入
  Radix Dialog/Popover 行为层**。
- 关联性：浮层与其触发器应建立 `aria-haspopup` / `aria-expanded`。

---

## 5. 视觉规范

### 5.1 颜色

- 只走语义变量（`--bg-* / --text-* / --border-* / --brand-* / --status-* / --cat-*`），
  明暗两态由 `:root.dark` 重定义自动切换，组件层禁止写暗色分支。
- 租户定制经三层模型（palette / themeOverrides 白名单 / scoped 变量），禁止注入裸 CSS。

### 5.2 阴影（两层预算 · 品牌混色）

- **浮起阴影**最多两层叠加，透明度 ≤ 0.08，颜色必须 `color-mix(品牌色)` 而非纯黑：
  ```css
  --shadow-soft:   0 2px 8px  color-mix(in srgb, var(--brand-primary) 6%, transparent);
  --shadow-medium: 0 4px 16px color-mix(in srgb, var(--brand-primary) 8%, transparent);
  ```
- **暗色例外档**：近黑表面上低透明度阴影不可见，`:root.dark` 下允许黑基阴影
  `0.3 / 0.4 / 0.5`（soft/medium/hover 三档**冻结现状，不得更重、不得新增档位**）。
- **印刷风硬阴影**（零模糊偏移、品牌色 22%）是识别符号，**不计入两层预算**、不视为
  「浮起阴影」（它表达的是「印刷层叠」而非「高度」）。禁止把它改成软阴影。

### 5.3 圆角（只走 `--radius-*`）

```css
:root {
  --radius-xs: 4px;    /* 徽标内件、小标记 */
  --radius-sm: 6px;    /* 输入框内件、小标签 */
  --radius-md: 10px;   /* 常规控件（受租户 --brand-radius 驱动的基准档） */
  --radius-lg: 14px;   /* 卡片 */
  --radius-xl: 18px;   /* 面板、浮层 */
  --radius-2xl: 22px;  /* 大型容器 */
  --radius-pill: 999px;/* 胶囊 */
  --radius-full: 50%;  /* 圆形 */
}
```

- 装饰性微圆角（1–3px 的进度条端点等）不受谱系约束，但不得用于控件。
- 租户圆角经 `--brand-radius`（L2 白名单）影响 `--radius-md` 基准，不新增映射机制。
- `50% / 999px / 0` 语义（圆、胶囊、直角）允许字面量。

### 5.4 空间（4px 网格 · 间距优先）

- 间距/内边距取 **4 的倍数**（4/8/12/16/20/24/32/40/48/64…）。
- **优先用间距分组，而非分割线**：分割线只用于「语义上必须划界」处（表单分区、
  页脚底条），列表内分组一律用间距 + 层级（字重/色阶）表达。
- 存量代码中的 2 倍数间距（10/14/18px…）允许保留；**改动所触及的行必须顺手归到网格**，
  不做一次性全站重排。

---

## 6. Token 蓝图（待落地，落地前以本文档为口头契约）

| Token | 状态 | 落点 |
|---|---|---|
| `--ease-standard` / `--duration-fast|base|slow` | ✅ 已定义（tokens.css，2026-10-21 阶段 3 动效批） | tokens.css（§3.1） |
| reduced-motion 全局兜底 | ✅ 已实现（main.css，2026-10-21 阶段 2 批） | main.css（§3.3） |
| `--radius-xs…2xl / pill / full` | ❌ 未定义（现存 315 处原生 px 圆角） | tokens.css（§5.3） |
| `--shadow-soft / medium / hover` | ✅ 已收敛 0.08（见 B6） | dark-mode.css |
| 44px 热区工具类（`.pressable` / hit-area 扩展） | ⚠️ 部分（Carousel 分界点已用 ::before 扩展；通用工具类未定义） | main.css |

---

## 附录 A · 现状偏差清单（2026-10 扫描基线）

> 扫描方式：全站 CSS/TSX 静态检索。优先级：P0 无障碍硬伤 → P1 规范统一 → P2 渐进收敛。

### P0 — 无障碍硬伤

| # | 偏差 | 证据 | 修复方向 |
|---|---|---|---|
| A1 | `prefers-reduced-motion` 全站 0 支持 | 全站 0 匹配；JS 平滑滚动 ≥3 处（HomePageView wheel/锚点、BackTop） | §3.3 兜底 + JS 侧降级 |
| A2 | 20 处 `div/li/span + onClick` 交互控件键盘不可达 | 顶部导航 `.menu-item`、`.mega-item`、`.nav-logo`；移动端 `.mobile-item`；BackTop 按钮+菜单项；**`.delete-panel`（危险操作）**；`.counselorRow`；3 处验证码图 `.captchaImage`；3 处 `.headerBack`；`.scrollDownIndicator`；`.nf-nav-logo`；GameBreath 呼吸区 | 改 `<button>` / 补 role+tabIndex+按键（§4.2） |
| A3 | 13 处 `outline: none` 待逐处确认等效焦点替代 | ChatThread:160、ArticleListView:234、ArticleCenterView:243、ScalePanel:82、Comments:88、CommandPalette:58、time-capsule CreateForm:101/326、NotFoundSlideCommunity:165、ConsultantsPanel:34、square CreateForm:173/253、DetailComments:63 | **已逐处核对（2026-10-21）**：8 处已有等效焦点替代（border-color / focus-within / box-shadow），5 处补 `:focus-visible` 或 `:focus-within` 品牌色底边；详见完成记录阶段 3 补丁批 |
| A4 | 自绘浮层无 Esc/焦点圈闭 | mega-menu、AssistantFab 面板（antd Drawer/Modal/Dropdown 已内置，不在列）；**BackTop 快速导航 ✅ 已完成（纯自绘非模态 hover 菜单；Radix 安装失败 → 降级，未引入替代库）** | BackTop 已完成：非模态 hover 菜单（Esc 关闭 + 焦点归还，不做焦点圈闭；触屏不可用快速导航）；mega-menu / AssistantFab 面板待 Radix 行为层（§4.4） |

### P1 — 规范统一

| # | 偏差 | 证据 | 修复方向 |
|---|---|---|---|
| B1 | 交互曲线 8 种 + 裸 `ease`：`(0.4,0,0.2,1)`（材料系，最多）、`(0.22,1,0.36,1)`、`(0.2,1,0.3,1)`、`(0.16,1,0.3,1)`、`(0.23,1,0.32,1)`、`(0.34,1.56,0.64,1)`（弹性）、`(0.175,0.885,0.32,1.275)`（back-out）、`(0.45,0,0.55,1)`；另有 `.icon-btn` 等 6+ 处裸 `ease` | ~~60+ 处~~ 剩余 60 行手写 cubic-bezier（已 token 化 58 处） | **部分完成（2026-10-21，高流量组件已归一：Navbar/ListArchive/FeedList/Article 列表/SpotlightCard/RowList/CardGrid/CapsuleListView）**，剩余约 35 处非白名单 cubic-bezier 与 119 行裸 ease/linear 待下一批；弹性曲线仅保留在白名单动画（DashboardPanel 弹性进度、AssistantFab fab-pop） |
| B2 | 交互时长 12+ 档（0.25/0.28/0.3/0.32/0.35/0.4/0.45/0.5/0.55/0.6/0.7s…） | 全站 transition 267 处，已 token 化 58 处，剩余 209 处 | **部分完成（2026-10-21，高流量组件已归一）**：替换为 160/280/360 三档；剩余按「白名单 / 待归一」拆解后入下一批 |
| B3 | 热区 < 44px：Navbar `.icon-btn` 40px、`.cmd-trigger` 34px、`.lang-btn` ≈30px；AssistantFab `.headerAction` 30px；AppShell `.social-icon` 36px | 各文件尺寸声明 | **已补齐（2026-10-21）**：5 处统一用 `::before` 透明伪元素扩到 44×44（视觉尺寸不变），详见完成记录阶段 3 补丁批 |
| B4 | `:active` 缩放仅 4 处且无 0.97 约定 | reveal.css / main.css / Navbar.css / CapsuleListView.css | `.pressable` 约定（§3.2） |
| B5 | 3 处游离 `!important` 纯黑大阴影未走 token：`0 20px 50px rgb(0,0,0,.5)`、`0 20px 40px rgb(0,0,0,.45)`、`0 16px 32px rgb(0,0,0,.4)` | dark-mode.css:568、ListArchive:620、RowList:250 | 收敛进 `--shadow-hover` 暗色档 |
| B6 | ~~浅色 `--shadow-hover` 0.10 > 0.08 预算~~ **已修复（2026-10-21）**：降为 0.08（用户拍板，不留例外） | dark-mode.css:36 | ✅ 完成 |

### P2 — 渐进收敛（量大，按批次）

| # | 偏差 | 证据 | 修复方向 |
|---|---|---|---|
| C1 | 315 处原生 px 圆角（6/8/10/12/14/16/18/20/22px），63 个文件 | DashboardPanel 31 处、NoticePanel 16 处、ScaleDialog 15 处、BookingPanel 17 处、ChatThread 16 处… | 定义 `--radius-*` 后分批映射（§5.3） |
| C2 | 4px 网格偏离：Input `paddingInline:15`、`.cmd-trigger-text` 13px、letter-spacing 0.3px 等 | main.tsx token、Navbar.css | 触及即改（§5.4） |
| C3 | 分割线使用密度偏高（`--border-light` 大量用于列表分组） | 全站 | 新增分组优先间距表达（§5.4） |

### 合规项（无需动）

- 颜色语义化：全站 CSS 硬编码色值 **0**（token 定义区除外）——已达标。
- antd 复杂控件（Drawer/Dropdown/Modal/Collapse）的 Esc/焦点行为——已达标。
- 印刷风硬阴影、噪点层、Mega Menu、品牌色板——识别项，保持不动。

### 完成记录

| 日期 | 批次 | 内容 |
|---|---|---|
| 2026-10-21 | 阶段 3 · motion 脱钩修复 + A4 最小试点（BackTop） | **`--navbar-h` 同频**：AppShell `.main-content` 的 `padding-top` 过渡 `0.4s cubic-bezier(0.4,0,0.2,1)` → `var(--duration-base) var(--ease-standard)`，与 `.nav-header` 高度过渡一致；全仓仅 `.nav-header`（height）与 `.main-content`（padding-top）两个 CSS 消费方，无 sticky / scroll-margin 消费。**ConsultantsPanel 归一（5 处）**：`.counselorRow`、`::before` height、`.rowTitle`、`.rowBook`、`.rowArrow` → `--duration-fast` + `--ease-standard`。**BackTop 快速导航（A4 试点）**：`@radix-ui/react-hover-card` 安装因 registry 网络失败，按预案降级为纯自绘非模态菜单（pointerenter/leave + 150/250ms 定时器 + keydown/blur），不换库；DOM 顺序改为「触发器 → 菜单」保证 Tab 顺序；`aria-expanded` / `aria-controls` / `role="group"` + `aria-label`；触发器外观恒定（删除 hover 位移/阴影变化）；入场 `--duration-fast` + 每项 30ms stagger；reduced-motion 兜底补 `transition-delay` / `animation-delay` 归零。触屏不提供快速导航（已知限制） |
| 2026-10-21 | B6 | 浅色 `--shadow-hover` 10% → 8%（对齐两层预算契约） |
| 2026-10-21 | 暗色可用性修复批 | 阶段 1 审计的底层色阶绕过收敛：time-capsule CreateForm 14 处深色文字/浅底/边框换语义 token（P0 全清）；`--danger-500/600` 30 处 → `--status-danger`（7 文件，双态自动切换，顺带将 error 文字对比度从 3.76:1 修复至 7.7:1 AA）；auth 三件套 blue-400 光晕阴影 7 处 → 品牌色 12% 预算内。残留底层数值仅 `--ink-400`（暗下 7:1 可读，P2 归一）与 auth 验证码块（已有暗色补偿，P2） |
| 2026-10-21 | 阶段 3 · 动效 token 归一（高流量组件） | **counselorRow 回归修复**：整行恢复鼠标 `onClick`（`closest('button')` 守卫，按钮区域不重复触发），键盘路径仍只走 `.rowMain` / `.rowBook` 两个兄弟按钮；`.rowMain` 内 `div/h3/p` 全部改 `span`（满足 `<button>` phrasing content 模型），`.rowDesc` 补块级 display，视觉 1:1。**motion token**：tokens.css 定义 `--ease-standard` / `--duration-fast:160ms` / `--duration-base:280ms` / `--duration-slow:360ms`。**归一（58 处）**：Navbar.css 20、ListArchive 12、FeedList 7、ArticleListView 4、ArticleCenterView 3、SpotlightCard 3、RowList 5、CardGrid 3、CapsuleListView 1；hover/按压 → fast，展开收起/状态切换 → base，整行展开/滑轨 → slow。叙事白名单（scroll-reveal、轮播横移、呼吸、计时环、页面进场、ListArchive capsule-anim）保留未动。全站 transition 共 267 处，剩余 209 处待下一批 |
| 2026-10-21 | 阶段 3 补丁批（counselorRow 修正 / A3 审计 / B3 热区） | **counselorRow 修正**：弃用上一批的 `role="button"` 整行方案（ARIA 上仍是「按钮套按钮」，违反 WCAG 4.1.2），改为两个兄弟原生按钮——行主体内容迁入 `<button class="rowMain btn-reset">`（flex 列布局，视觉与原行一致），`.rowBook` 保持独立按钮；删除自定义 `:focus-visible` 焦点环（原生 button 自带 UA 焦点环），`counselorRow` 回归纯容器（无 role/tabIndex/onClick）。**A3（13 处 outline:none 审计）**：5 处确认已有等效焦点替代不改码（time-capsule CreateForm:101 `.titleInput` border-bottom 变色；ArticleCenterView:243 / ArticleListView:234 `.search-input` 容器 focus-within；ChatThread:160 `.threadInputField` border+box-shadow；article Comments:88 与 square DetailComments:63 `.commentTextarea` border+box-shadow；square CreateForm:173 `.topicInput` 容器 focus-within；square CreateForm:253 `.contentTextarea` border+box-shadow）；5 处补焦点替代：ConsultantsPanel:34 `.ribbonSearch input` 补 `.ribbonSearch:focus-within` 底边品牌色、ScalePanel:82 同款、NotFoundSlideCommunity:165 `.nf-write-input` 补 `.nf-write-box:focus-within` 底边品牌色、CommandPalette:58 `.cmdInput` 补 `.cmdInputRow:focus-within` 底边品牌色、time-capsule CreateForm:326 `.wangEditor`（contentEditable）补 `:focus-visible` 2px 品牌色焦环。**B3（5 处热区）**：Navbar `.icon-btn`（40px）/ `.cmd-trigger`（34px）/ `.lang-btn`（≈30px）、AssistantFab `.headerAction`（30px）、AppShell `.social-icon`（36px）统一用 `::before` 透明伪元素扩到 44×44 命中区（视觉尺寸不变；父级已补 `position: relative`；`.action-items` gap 16px 无重叠）。**§6 Token 蓝图同步**：reduced-motion 兜底 → ✅ 已实现（main.css）；`--shadow-hover` → ✅ 已收敛 0.08（见 B6）；44px 热区工具类 → ⚠️ 部分（Carousel/Navbar/AssistantFab/AppShell 已用 ::before 扩展，通用 `.pressable` 未定义） |
| 2026-10-21 | 阶段 3 · 普通控件键鼠统一批 | **A2（普通控件类）**：main.css 新增 `button:where(.btn-reset)` 工具类（用 `:where()` 把特异度压到 0,0,1，避免盖掉组件自身的 border/background）。Navbar `.nav-logo` / `.mobile-center-link` / `.mobile-item` → 原生 `<button type="button">`；移动端 6 个 `.mobile-grid-item` → `<button aria-pressed>`，容器补 `role="group"` + `aria-label`（`nav.mobile.appearance` / `nav.mobile.language`）；桌面主题/语言 Dropdown 补 `selectable` + `selectedKeys`（单选态视觉/键盘高亮）。`ConsultantsPanel .counselorRow` 因内部嵌套 `.rowBook` 按钮（button 不可嵌套），改 `role="button"` + `tabIndex={0}` + `onKeyDown(Enter/Space)`（含 `e.target === e.currentTarget` 守卫），CSS 补 `:focus-visible` 焦点环。3 处 `.headerBack`、`BackTop .backToTopBtn`、3 处验证码图 `.captchaImage`、Carousel 分页圆点与 `.scrollDownIndicator`、NotFoundNav `.nf-nav-logo` 全部 → 原生 `<button type="button">`；NotFoundNav 4 个 `.nf-nav-link` → react-router `<Link>`（恢复链接语义，原 `onClick` 移除避免双重导航）。Carousel 分页点命中区用 `::before` 透明伪元素扩到 44×44（视觉仍为 40×4），补 `aria-label` / `aria-current` / `:focus-visible`。**aria-live**：新增 `src/components/LiveAnnouncer`（模块级 listener + `announce()`，AppShell 根部常驻 `role="status" aria-live="polite" aria-atomic="true"`，写入前先清空以保证同文案重复播报）；触发点为 Navbar 桌面主题/语言 Dropdown、移动端 6 个 grid-item、PreferencesSection 两个 Select。i18n 三语言新增 `a11y.themeSwitched` / `a11y.langSwitched` / `auth.captcha.refresh` / `home.carousel.gotoSlide` |
| 2026-10-21 | 阶段 2 · 无障碍 P0 批 | **A1（部分）**：main.css 全局 `prefers-reduced-motion` 兜底块；`src/utils/motion.ts`（`prefersReducedMotion`/`scrollBehavior`）；HomePageView 3 处与 BackTop 滚动 JS 降级。**A2（delete-panel 单点）**：ListArchive 删除面板 div → 原生 `<button>`（`tabIndex` 随展开状态动态切换，收起时移出 Tab 序），二次确认经核实已存在（`modal.confirm`）无需新增；CSS 补 `font: inherit` 保视觉零变化。**文档语言**：i18n useEffect 补 `document.title` 同步（lang 原已有），三语言包加 `nav.documentTitle`。**图标按钮 aria**：Navbar 主题/语言/用户三触发器补 `aria-label`（复用现有 key）；user-profile 补 `role="button"`，键盘可达留阶段 3。**A2 补全（本轮）**：`ArchiveEntry` 卡片本体补 `role="button"` + `tabIndex={0}` + `onKeyDown`（Delete/Backspace → `onDelete` 走 `deleteCapsule` 的 `modal.confirm`，Enter/Space → 打开），CSS 补 `.envelope:focus-visible` 焦点环（仅键盘触发，视觉零变化）；`.mobile-menu-btn` 补 `aria-label={t('nav.mobile.menuTitle')}`（复用现有 key）。删除键盘路径已成立两条：**滑开面板后 Tab / 卡片聚焦按 Delete** |

### A2 收口状态与遗留（2026-10-21 阶段 3 批后）

**已完成（键盘可达 + Enter/Space 触发）**：Navbar `.nav-logo` / `.mobile-center-link` / `.mobile-item` / 6 个 `.mobile-grid-item`、`ConsultantsPanel .counselorRow`、3 处 `.headerBack`、`NotFoundNav .nf-nav-logo` 与 4 个 `.nf-nav-link`（`<Link>` 原生链接语义）、`BackTop .backToTopBtn`、3 处 `.captchaImage`、Carousel 分页圆点与 `.scrollDownIndicator`、`ArchiveEntry` 卡片、ListArchive `.delete-panel`、Navbar `.mobile-menu-btn`。

**半成品状态（必须在此登记，避免后续验收误判）**：

- **`BackTop .backToTopBtn`**：按钮本体键盘可达（Tab + Enter/Space 回顶）；快速导航菜单已闭环（A4）：鼠标 150ms 展开 / 移出 250ms 收起，Tab 聚焦触发器即展开，ArrowUp 展开并聚焦第一项，菜单内 Tab/↑↓ 遍历，Esc 关闭并归还焦点；不做焦点圈闭。**触屏不提供快速导航（已知限制）**，点击仅回顶。
- **桌面主题/语言 Dropdown**：只补了 `selectable` + `selectedKeys`，提供视觉选中态与键盘上下高亮；rc-menu 的 role 固定为 `menuitem`，**AT 语义仍不是 `menuitemradio`**，待 Radix `DropdownMenuRadioGroup`。antd `items` 数组类型不接受 `role` / `aria-checked`，无法在现有栈内补齐。
- **移动端 `.mobile-grid-item`**：本批为原生 `<button>` + `aria-pressed`（容器 `role="group"`），未使用 `role="radio"`——ARIA radiogroup 要求完整的方向键导航，半实现比 button 更糟；真 radio 语义随 Radix 批次提供。

**留给 Radix 批次（本批刻意未动）**：`Navbar .menu-item` / `.mega-item`（自绘 mega-menu 触发器与内容）、`AssistantFab` 面板（同 A4）浮层行为、桌面 Dropdown 的 `menuitemradio` 语义。

**GameBreath 豁免（用户拍板）**：不补 `aria-hidden`，因为该区域承载实时呼吸相位文案，隐藏会让读屏用户丢失状态信息。键盘路径已由舞台层 Space 键分发覆盖，指针点击为补充交互，故不纳入 A2 强制按钮化清单。
