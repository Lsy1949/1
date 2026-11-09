# 架构与职责边界

本文档自包含核心代码，可脱离仓库阅读。代码摘自仓库路径 `src/i18n/`（快照日期 2026-11），若与最新源码不一致，以源码为准。

## 三类文案的归属

| 内容类型              | 归属         | 处理方式             | 示例                                                         |
| --------------------- | ------------ | -------------------- | ------------------------------------------------------------ |
| UI 静态文案           | 前端本地字典 | `t()`              | 按钮、表头、菜单、通用提示                                   |
| 前端自有枚举 / 状态码 | 前端本地字典 | `tEnum()`          | 设备运行状态——这类值参与前端逻辑判断，原始值必须由前端掌握 |
| 后端业务数据          | 后端         | 原样展示，前端零处理 | 列表内容、详情文本、已翻译的枚举展示值                       |

边界调整记录：最初设计为"后端返回原始值或多语言对象，由前端 dataHelper 适配"，后确认后端直接返回翻译后文本，`getLocaleField` 及相关类型已从 `src/i18n/dataHelper.ts` 删除。当前该文件只保留 Key 类型推导与 `tEnum`。提交给后端的原始值（如操作原因的 value）同样不翻译——翻译只作用于界面展示的 label。

## 文件清单

| 文件                                          | 职责                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/i18n/index.ts`                         | i18next 初始化、语言元信息（SUPPORTED_LANGUAGES / LANGUAGE_OPTIONS）、语言归一化与切换入口、dayjs 联动 |
| `src/i18n/dataHelper.ts`                    | Key 类型推导（FlattenKeys / I18nKey）与 `tEnum` 枚举翻译                                             |
| `src/i18n/i18n.d.ts`                        | react-i18next 模块增强，赋予 `t()` Key 智能提示与编译期校验                                          |
| `src/i18n/locales/zh-CN.json`               | 中文字典，全项目的 Key 事实来源                                                                        |
| `src/i18n/locales/{en-US,hu-HU,id-ID}.json` | 其余三语字典，Key 树必须与 zh-CN 完全一致                                                              |
| `src/i18n/locales/keyParityCheck.ts`        | 编译期四语 Key 对齐校验                                                                                |
| `src/const/enumConst.ts`                    | 前端枚举定义（DeviceRunStatus 等），成员名与字典叶子 Key 一致                                          |

## 初始化

`src/main.tsx` 中 i18n 必须最先 import，保证首次渲染前初始化已完成：

```tsx
import '@/i18n';          // 必须置于 import App 之前
import App from './App.tsx';
```

`src/i18n/index.ts` 的 init 完整配置：

```ts
void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,                             // 四份 JSON 静态 import，见下方资源注册
    supportedLngs: SUPPORTED_LANGUAGES,    // ['zh-CN', 'en-US', 'hu-HU', 'id-ID']
    load: 'currentOnly',
    fallbackLng: 'zh-CN',                  // 漏配时回退中文而不是显示 Key
    interpolation: { escapeValue: false }, // React 已做 XSS 转义，双重转义会显示 & 之类文本
    returnNull: false,                     // t() 返回类型固定为 string
    react: { useSuspense: false },         // 同步资源，不依赖 Suspense，无翻译闪烁
    detection: {
      order: ['localStorage', 'navigator'], // 优先用户上次选择，其次浏览器语言
      lookupLocalStorage: 'vision.app.language',
      caches: ['localStorage'],             // 切换后自动持久化
    },
  });
```

资源注册与语言元信息（同在 `src/i18n/index.ts`）：

```ts
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US', 'hu-HU', 'id-ID'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** 语言选项（label/short 用各语言原生名称，不随当前语言变化） */
export const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文', short: '中' },
  { value: 'en-US', label: 'English', short: 'EN' },
  { value: 'hu-HU', label: 'Magyar', short: 'HU' },
  { value: 'id-ID', label: 'Bahasa Indonesia', short: 'ID' },
] as const satisfies ReadonlyArray<{ value: AppLanguage; label: string; short: string }>;

/** 本地字典：静态 import 打进主 bundle，init 同步完成 */
export const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
  'hu-HU': { translation: huHU },
  'id-ID': { translation: idID },
} as const;

/** 浏览器语言归一化到受支持语言：zh* -> zh-CN、en* -> en-US、hu* -> hu-HU、id* -> id-ID */
export function normalizeLanguage(lng: string | undefined): AppLanguage {
  if (!lng) return 'zh-CN';
  const lower = lng.toLowerCase();
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('en')) return 'en-US';
  if (lower.startsWith('hu')) return 'hu-HU';
  if (lower.startsWith('id')) return 'id-ID';
  return 'zh-CN';
}
```

init 配置中有一项禁用约定：不要添加 `nonExplicitSupportedLngs: true`。该配置曾导致全站 `t()` 返回 Key 的故障，机理与修复见[故障排查](./05-troubleshooting.md)。

## 语言切换链路

语言是**设备端进程级全局状态**：所有客户端共用一份语言，软件重启恢复默认 zh-CN。前端纯本地切换已改为"设备端接口 + SignalR 广播"联动（接口定义在 `src/service/sensor.ts`）：

| 后端接口 | 作用 |
|---|---|
| `GET /api/app/Common/Sensor/Language` | 查询当前语言与可选列表（下拉选项数据源，前端内置四语仅作拉取失败兜底） |
| `POST /api/app/Common/Sensor/Language?code=xx` | 切换语言；成功后设备端向所有 SignalR 客户端广播 `LanguageChanged` |
| SignalR `LanguageChanged` 事件 | 任一客户端切换后，其余客户端同步刷新界面文案 |

切换入口是首页的 `src/pages/Home/LanguageButton/index.tsx`：挂载时拉取语言列表（`matchLanguage` 过滤出受支持语言，`matchLanguage` 无法识别时返回 null，区别于 `normalizeLanguage` 的回退 zh-CN），点击后先调 POST 接口、成功才本地生效：

```tsx
/** 切换语言：先调设备端接口（进程级状态），成功后本地立即生效；广播到达时为 no-op */
const handleSelect = async (code: AppLanguage) => {
  try {
    const res = await switchLanguage(code);
    if (isBackendSuccess(res)) {
      changeAppLanguage(code);
    }
    // 失败由拦截器统一提示，本地语言不变
  } catch { /* HTTP 层错误已由拦截器提示 */ }
};
```

`src/utils/SignalRClientV2.ts` 订阅广播（payload 形状未定，`extractLanguageCode` 兼容字符串与 `{code}`/`{current}` 对象，识别失败仅告警不切换）：

```ts
this.connection.on('LanguageChanged', this.onLanguageChanged);
// onLanguageChanged: matchLanguage 提取受支持语言码 -> changeAppLanguage
```

`src/i18n/index.ts` 提供的统一入口与 dayjs 联动监听：

```ts
// dayjs 联动：语言一变，同步切换 dayjs locale
const DAYJS_LOCALE_MAP: Readonly<Record<AppLanguage, string>> = {
  'zh-CN': 'zh-cn',
  'en-US': 'en',
  'hu-HU': 'hu',
  'id-ID': 'id',
};

i18next.on('languageChanged', (lng) => {
  dayjs.locale(DAYJS_LOCALE_MAP[normalizeLanguage(lng)]);
});

/** 切换语言：无需刷新页面（react-i18next 触发重渲染，上方 listener 同步 dayjs） */
export function changeAppLanguage(lng: AppLanguage): void {
  void i18next.changeLanguage(lng);
}
```

完整链路：

```
用户选择语言
  → POST /Language?code=xx             // 设备端进程级状态，所有客户端共用
  → changeAppLanguage(lng)             // 接口成功后本地立即生效
  → i18next.changeLanguage(lng)
      ├─ localStorage 持久化           // detection.caches 自动完成（设备不可达时的本地兜底）
      ├─ languageChanged 事件
      │    └─ dayjs.locale(...)       // 日期格式同步切换
      └─ react-i18next 触发重渲染      // 所有 useTranslation 订阅组件更新

设备端广播 LanguageChanged（含其他客户端发起的切换）
  → SignalRClientV2.onLanguageChanged
  → changeAppLanguage(next)            // 与当前语言相同则 i18next 内部 no-op
```

启动同步在 `src/App.tsx`：挂载时 `GET /Language`，以设备端当前语言覆盖本地缓存（设备重启恢复 zh-CN 后前端能自动跟随）；设备未连接时保持浏览器检测/本地缓存的语言。

Antd 组件库（DatePicker、Pagination 等）的 locale 由 `src/App.tsx` 处理，`ConfigProvider` 的配置随语言实时切换：

```tsx
import zh_CN from 'antd/locale/zh_CN';
import en_US from 'antd/locale/en_US';
import hu_HU from 'antd/locale/hu_HU';
import id_ID from 'antd/locale/id_ID';
import { normalizeLanguage, type AppLanguage } from './i18n';

// 语言 -> antd 语言包映射
const ANTD_LOCALE: Readonly<Record<AppLanguage, typeof zh_CN>> = {
  'zh-CN': zh_CN,
  'en-US': en_US,
  'hu-HU': hu_HU,
  'id-ID': id_ID,
};

function App() {
  // useTranslation 订阅 languageChanged：语言切换 -> 重渲染 -> 新 locale 实时生效
  const { i18n } = useTranslation();
  const lang = normalizeLanguage(i18n.language);

  return (
    <ConfigProvider locale={ANTD_LOCALE[lang]} /* theme... */>
      {/* ... */}
    </ConfigProvider>
  );
}
```

新增语言时 `ANTD_LOCALE` 与 `DAYJS_LOCALE_MAP` 都要补一行。

## 打包行为

四份字典全部静态打包进主 bundle，无语言包网络请求。当前字典体量下这是最优解——同步、无闪烁、无加载态。若未来字典膨胀到影响首屏，再考虑 i18next-resources-to-backend 按语言懒加载，代价是首次切换语言时出现短暂等待。
