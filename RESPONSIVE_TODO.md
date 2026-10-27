# RESPONSIVE_TODO —— 响应式适配迁移清单

> Phase 0（基建）产出的基线清单 **v2**，生成于 2026-10-27。
> 行号仅定位线索，**以内容匹配为准**。
> 状态取值：`pending` / `done` / `blocked`（受阻需附原因）。
> 移动端（<768）另行开发，**不在本清单范围**。

## 迁移指引（怎么改）

- **max-width 魔法数字** → `var(--container-max)`。全站内容宽度唯一来源是
  `src/styles/main.css` 的 `.container`（Phase 0 已切换为 token）；
  页面自建容器应改用 `<PageContainer>`（`src/components/PageContainer`）或引用同一 token，**禁止再写任何 max-width 字面量**。
- **阅读窄栏**（文章详情正文等）→ `<PageContainer narrow>` 或 `var(--container-narrow)`。
- **静态内联尺寸 style** → CSS Module class + `--fs-*` / `--sp-*` token。
- **动态百分比内联 style**（进度/环形等）→ 合法，保留，不算违规。
- token 定义：`src/styles/tokens.css`「流体尺寸层 L0.5」（1920 基准 / 1366 取 min / 3840 封顶）；
  antd 侧映射：`src/styles/theme.ts`。
- 原则：**antd 管结构、CSS clamp 管尺寸**；不引入 JS 断点（不用 useBreakpoint / matchMedia）。

## A. max-width 魔法数字（25 处）

| # | 文件:位置 | 问题 | Owner | 状态 |
|---|---|---|---|---|
| A1 | src/styles/main.css:156（.container） | max-width: 1200px | Scaffold | **done**（Phase 0 改为 `var(--container-max)`） |
| A2 | src/layouts/components/AppShell.css:29 | max-width: 1200px | P2-Shell | pending |
| A3 | src/layouts/components/AppShell.css:151 | max-width: 1200px | P2-Shell | pending |
| A4 | src/layouts/Navbar.css:128 | max-width: 1200px | P2-Shell | pending |
| A5 | src/pages/article/ArticleListView.css:10 | max-width: 1200px | P1-Article | pending |
| A6 | src/pages/article/ArticleDetailView.css:10 | max-width: 1200px | P1-Article | pending |
| A7 | src/pages/article/ArticleDetailView.css:21 | max-width: 1200px | P1-Article | pending |
| A8 | src/pages/article/ArticleDetailView.css:66 | max-width: 1200px | P1-Article | pending |
| A9 | src/pages/article/ArticleDetailView.css:175 | max-width: 1200px | P1-Article | pending |
| A10 | src/pages/article/ArticleCenterView.css:10 | max-width: 1200px | P1-Article | pending |
| A11 | src/pages/time-capsule/CapsuleListView.css:23 | max-width: 1200px | P1-Capsule | pending |
| A12 | src/features/article/components/Comments/Comments.module.css:3 | max-width: 1200px | P1-Article | pending |
| A13 | src/features/home/components/Carousel/Carousel.module.css:123 | max-width: 1200px | P1-Home | pending |
| A14 | src/features/time-capsule/components/ListHeader/ListHeader.module.css:7 | max-width: 1280px | P1-Capsule | pending |
| A15 | src/features/time-capsule/components/ListArchive/ListArchive.module.css:7 | max-width: 1280px | P1-Capsule | pending |
| A16 | src/features/time-capsule/components/ListArchive/ListArchive.module.css:65 | max-width: 1280px | P1-Capsule | pending |
| A17 | src/features/time-capsule/components/ListArchive/ListArchive.module.css:136 | max-width: 1280px | P1-Capsule | pending |
| A18 | src/pages/square/SquareListView.css:30 | max-width: 1280px | P1-Square | pending |
| A19 | src/features/square/components/ListHeader/ListHeader.module.css:3 | max-width: 1280px | P1-Square | pending |
| A20 | src/features/square/components/DailyPrompt/DailyPrompt.module.css:3 | max-width: 1280px | P1-Square | pending |
| A21 | src/pages/profile/ProfileView.css:2 | max-width: 1280px | P1-ProfileSettings | pending |
| A22 | src/pages/notfound/NotFoundView.css:83 | max-width: 1280px | P1-NotFound | pending |
| A23 | src/pages/ai/AiConsultView.css:2 | max-width: 1280px | P1-CounselingAI | pending |
| A24 | src/pages/ai/AiCompanionView.css:2 | max-width: 1280px | P1-CounselingAI | pending |
| A25 | src/pages/counseling/CounselingCenterView.css:7 | max-width: 1280px | P1-CounselingAI | pending |

## B. 静态内联尺寸 style（10 处）

| # | 文件:位置 | 问题 | Owner | 状态 |
|---|---|---|---|---|
| B1 | src/providers/ErrorBoundary.tsx:147 | 内联 fontSize: 20（标题） | Scaffold | **done**（落 `.eb-title` class，ErrorBoundary.css） |
| B2 | src/providers/ErrorBoundary.tsx:152 | 内联 gap: 12（按钮组） | Scaffold | **done**（落 `.eb-actions`） |
| B3 | src/providers/ErrorBoundary.tsx:165 | 内联 fontSize: 12 + color（错误编号） | Scaffold | **done**（落 `.eb-error-id`，color 本就是 var 落 CSS 即可） |
| B4 | src/pages/auth/LoginView.tsx:125 | Spin 占位内联尺寸 | P1-Auth | pending |
| B5 | src/features/profile/components/PsychSection/index.tsx:142 | 内联尺寸 | P1-ProfileSettings | pending |
| B6 | src/features/profile/components/BasicSection/index.tsx:125 | 内联尺寸 | P1-ProfileSettings | pending |
| B7 | src/features/settings/components/DataSection/index.tsx:123 | 内联尺寸 | P1-ProfileSettings | pending |
| B8 | src/features/settings/components/PreferencesSection/index.tsx:67 | 内联尺寸 | P1-ProfileSettings | pending |
| B9 | src/features/settings/components/PreferencesSection/index.tsx:80 | 内联尺寸 | P1-ProfileSettings | pending |

> 备注：附录 B 计 10 处，逐条枚举出 9 处（B1–B9），差额 1 处待 P1-ProfileSettings
> 认领时在该组文件内复查补录。

## C. 动态百分比内联 style（5 处，合法保留，不算违规）

| # | 文件:位置 | 问题 | Owner | 状态 |
|---|---|---|---|---|
| C1 | src/components/ReadProgress/index.tsx:29 | width: progress%（动态进度） | — | keep |
| C2 | src/components/CountdownRing/index.tsx:51 | 动态百分比 | — | keep |
| C3 | src/features/assessment/components/ScaleDialog/index.tsx:212 | 动态百分比 | — | keep |
| C4 | src/features/assessment/components/DashboardPanel/index.tsx:476 | 动态百分比 | — | keep |
| C5 | src/features/assessment/components/MinePanel/index.tsx:268 | 动态百分比 | — | keep |

## D. 手写 clamp（69 处 / 44 文件）—— tech-debt 区（不阻塞验收）

- 不强求收敛；后续随各页迁移逐步改写为 `var(--fs-*)` / `var(--sp-*)` /
  `var(--container-*)`，新代码禁止再新增散装 clamp。
- 排查基线（2026-10-27）：`git grep -n "clamp(" -- "src/**/*.css"` → 69 处 / 44 文件。

## E. useBreakpoint 与陈旧注释

- `useBreakpoint` 实际调用：**0 处**（无需处理；后续也禁止为响应式引入）。
- | 文件:位置 | 问题 | Owner | 状态 |
  |---|---|---|---|
  | src/features/auth/components/Propaganda/Propaganda.module.css:153 | 陈旧注释提及已删除的 antd screens.xl | P1-Auth | pending |

## F. 已 token 化（无需迁移）

- src/features/auth/components/LoginForm/LoginForm.module.css（`.loginBox` → `var(--login-card-max-width)`）—— 豁免。

## G. 冻结文件（任何人禁改，变更须上报）

- src/styles/tokens.css（既有色阶/动效区；「流体尺寸层 L0.5」同样冻结，调端点值须上报）
- src/styles/theme.ts
- src/components/PageContainer/**（index.tsx + index.module.css）
- src/styles/main.css 的 `.container` 之外的一切部分
- src/main.tsx（Phase 0 合入后）
- src/layouts/mobile/** 与 src/styles 其余全局 css

## 进度汇总（Phase 0 收口时）

- done：4（A1、B1–B3，均 Scaffold）
- pending：31（A2–A25 共 24 条 + B4–B9 共 6 条 + E 区 1 条）
- keep（合法保留）：5（C 区）
- 豁免：1（F 区）
