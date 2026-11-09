# 开发任务指南

按开发中会遇到的场景组织，每个任务给出前置条件、步骤与预期结果。代码摘自仓库快照（2026-11），涉及文件路径以 `src/` 为根。Key 命名规范见[字典维护规范](./03-dictionary-guide.md)，报错解读见[类型体系](./04-type-system.md)。

## 在组件里显示翻译

前置条件：函数组件（Hook 写法）。

1. 引入 Hook：`import { useTranslation } from 'react-i18next';`
2. 组件体内获取翻译函数：`const { t } = useTranslation();`
3. 渲染处调用：`t('common.button.submit')`

预期结果：显示当前语言文案；切换语言后该组件自动更新。

`t()` 必须从 Hook 获取。直接调用 `i18next.t()` 拿到的是调用瞬间的译文，语言切换后不会触发重渲染。组件订阅是刷新的驱动源。事件回调里使用组件作用域内的 `t`（如 `message.success(t('common.tip.operationSuccess'))`）是安全的，因为回调触发时组件仍持有有效订阅。

## 新增一条字典 Key

前置条件：已确定 Key 的命名空间归属（决策表见[命名规范](./03-dictionary-guide.md#key-命名规范)）。

1. 在 `src/i18n/locales/zh-CN.json` 对应子树添加键值对
2. 在 en-US / hu-HU / id-ID 三份 JSON 的相同路径下同步添加（Key 完全一致，Value 为对应语言）
3. 代码中使用 `t('你的.新.key')`

预期结果：`pnpm exec tsc --noEmit` 无新增错误。任一语言漏配时 keyParityCheck 报编译错误，错误信息中直接列出缺失的 Key。

顺序建议：先加四份字典再写代码。反过来也能编译（写代码时 tsc 会提示 Key 不存在，起到待办提醒的作用），但提交前必须补齐。

## 给文案加变量（插值）

字典中写占位符，代码中传值：

```json
"runDuration": "已运行 {{duration}}"
```

```tsx
t('page.home.runDuration', { duration: formatRunDuration(seconds, t) })
```

工具函数需要产出文案时，把 `t` 作为参数传入。仓库中的完整范例 `src/utils/format.ts`：

```ts
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import type { TFunction } from 'i18next';

dayjs.extend(duration);

/**
 * 将运行时长（秒）格式化为 x天 HH:mm:ss（"天"单位随当前语言显示，见 common.format.runDuration）
 */
export const formatRunDuration = (seconds: number, t: TFunction) => {
  const d = dayjs.duration(Math.max(0, Math.floor(seconds || 0)), 'second');
  const days = Math.floor(d.asDays());
  const time = d.format('HH:mm:ss');
  return days > 0 ? t('common.format.runDuration', { days, time }) : time;
};
```

对应字典（四语模板各自翻译，含单位写法差异）：

| 语言  | `common.format.runDuration` |
| ----- | ----------------------------- |
| zh-CN | `{{days}}天 {{time}}`       |
| en-US | `{{days}}d {{time}}`        |
| hu-HU | `{{days}} nap {{time}}`     |
| id-ID | `{{days}} hari {{time}}`    |

不要在工具函数内部直接调 `i18next.t()`——显式传参让语言订阅关系留在组件层，避免出现"某处文案不随语言切换"的隐患。

## 翻译前端枚举

前置条件：该枚举参与前端逻辑判断或由前端产生状态值。纯展示且后端已返回译文的字段不需要此流程。

1. 在 `src/const/enumConst.ts` 定义 `as const` 对象，成员名用语义英文，Value 为原始值：

```ts
export const DeviceRunStatus = {
  Run: 'Run',
  Stop: 'Stop',
  Alarm: 'Alarm',
  InitAlarm: 'InitAlarm',
  FirstInspection: 'FirstInspection',
  Simulate: 'Simulate',
  AlarmRun: 'AlarmRun',
  FirstInspectionAlarm: 'FirstInspectionAlarm',
  Init: 'Init',
} as const;

export type DeviceRunStatusValue = (typeof DeviceRunStatus)[keyof typeof DeviceRunStatus];
```

2. 四份字典在 `enum.*` 命名空间下建立同名叶子（成员名与字典 Key 完全一致，含大小写）：

```json
"enum": {
  "device": {
    "runStatus": {
      "Run": "运行",
      "Stop": "停止",
      "Alarm": "报警"
    }
  }
}
```

3. 调用处：`tEnum(t, DeviceRunStatus, 'enum.device.runStatus', status)`

预期结果：漏配某个成员的翻译、前缀写错、传入其他枚举的值，全部在编译期报错。运行时有两层兜底：接口返回未识别值显示 `-`，字典意外缺失时降级显示原始值。

## 新增一门语言

以新增 ja-JP 为例，共五处改动（+ 号处为新加内容）：

```ts
// 1. src/i18n/index.ts —— 语言元信息
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US', 'hu-HU', 'id-ID', 'ja-JP'] as const;

export const LANGUAGE_OPTIONS = [
  // ...原有四项
  { value: 'ja-JP', label: '日本語', short: 'JA' },  // label 用该语言原生名
] as const satisfies ReadonlyArray<{ value: AppLanguage; label: string; short: string }>;

// 1. 同文件 —— dayjs 映射（有对应 locale 时）
import 'dayjs/locale/ja';
const DAYJS_LOCALE_MAP = { /* ... */ 'ja-JP': 'ja' };

// 1. 同文件 —— 资源注册
import jaJP from './locales/ja-JP.json';
const resources = { /* ... */ 'ja-JP': { translation: jaJP } };
```

```ts
// 2. src/i18n/index.ts —— normalizeLanguage 加前缀分支
if (lower.startsWith('ja')) return 'ja-JP';
```

```ts
// 3. 新建 src/i18n/locales/ja-JP.json：从 zh-CN.json 复制后翻译
```

```tsx
// 4. src/App.tsx —— antd 语言包映射（antd 无官方包时可暂用 zh_CN 过渡）
import ja_JP from 'antd/locale/ja_JP';
const ANTD_LOCALE = { /* ... */ 'ja-JP': ja_JP };
```

```ts
// 5. src/i18n/locales/keyParityCheck.ts —— 加对齐校验
import type jaJP from './ja-JP.json';
export type JaJPKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof jaJP>>>;
```

预期结果：tsc 通过即表示新语言与 zh-CN 的 Key 完全对齐。

**前置条件（设备端）**：语言列表与切换由设备端进程管理（`GET/POST /api/app/Common/Sensor/Language`，见[架构 · 语言切换链路](./01-architecture.md#语言切换链路)），后端不认识的语言码 POST 会返回 1001。所以新增语言必须先在设备端注册，再改前端上述五处；前端内置 `LANGUAGE_OPTIONS` 仅在下拉列表拉取失败时兜底显示。

## 不翻译的内容

以下内容保持原样，写了会被 code review 打回：

- 代码注释、console.log
- 提交给后端的原始值（如操作确认框中不良原因的 value——label 走 `t()`，提交值不翻译）
- 后端返回的业务数据（后端已负责翻译）
- `LANGUAGE_OPTIONS` 中的语言名称（始终用原生名）
- props 传入的界面文字（如 settingsJSON 配置的 name 字段优先于字典文案，这是配置驱动组件的约定）
