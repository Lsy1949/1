# 字典维护规范

## Key 命名规范

遵循 IBPS 点号分层规范，按文案的来源与用途选择命名空间：

| 类型 | 命名模式 | 示例 |
|---|---|---|
| 通用 UI | `common.{button\|tip\|label}.{语义}` | `common.button.submit`、`common.tip.operationSuccess`、`common.label.status` |
| 页面级文案 | `page.{页面}.{语义}` | `page.home.systemName`、`page.notFound.title` |
| 模块级文案 | `{模块}.{子模块}.{语义}` | `main.plug.unconnected.gloveName`、`header.projectTitle` |
| 前端枚举 | `enum.{域}.{枚举名}.{成员名}` | `enum.device.runStatus.Run` |
| 异常信息 | 异常编码直接作顶层 Key | `E10001` |
| 接口级操作结果 | 方法完成名 + 语义 | `saveUser.success`、`queryDeviceList.empty` |

枚举的字典叶子 Key 必须与 TS 枚举成员名完全一致（含大小写），这是 `tEnum` 编译期校验的前提。

## 顶层命名空间一览

| 命名空间 | 内容 |
|---|---|
| `common` | 通用词汇：button（操作按钮）、tip（提示消息）、label（字段标签）、format（格式化模板） |
| `table` | 表格通用：表头（index/status/operation 等）、空数据 |
| `page` | 页面骨架：notFound、home 顶层文案、modeButton |
| `header` | 顶部栏：项目名、版本、登录、用户信息 |
| `menu` | 左侧菜单项 |
| `status` / `loading` | 状态标记与加载文案 |
| `extra` | 抽屉区：标题与各页签 |
| `content` | 主内容区公共部分 |
| `main` | 主界面各组件，体量最大的子树 |
| `enum` | 前端枚举翻译，专用命名空间 |
| `device` / `user` | 业务域消息 |
| `saveUser` / `queryDeviceList` / `E10001` 等 | 接口级消息与异常码 |

## 新增 Key 的归属决策

1. 两个以上页面会用到 → `common`
2. 单个页面独有 → 对应页面的 `page.*` 或模块子树
3. 前端状态枚举 → `enum.*`
4. 后端异常或接口结果 → 异常码 / 方法完成名
5. 格式化模板（含占位符的整句）→ `common.format.*`

归属拿不准时选 `common`——把可能复用的文案下沉到通用层，比后期跨页面迁移便宜。

## 四语同步与编译期校验

zh-CN.json 是事实来源，其余三份的 Key 树必须与它完全一致。一致性由 `src/i18n/locales/keyParityCheck.ts` 在编译期强制：

```ts
type AssertNoMissing<TMissing extends never> = TMissing;

export type EnUSKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof enUS>>>;
```

`Exclude<ZhKeys, EnKeys>` 计算出"英文缺失的 Key 集合"，`extends never` 约束要求该集合为空——非空即编译失败，且错误信息里直接列出缺失的 Key。零运行时成本。

维护流程：改 zh-CN → 同步其余三份 → `pnpm exec tsc --noEmit` 验证。报错时按错误信息补齐对应语言的 Key 即可，报错解读详见[类型体系](./04-type-system.md)。

## 翻译质量约定

- 插值占位符 `{{xxx}}` 原样保留在译文中，语句结构按语言习惯调整
- 带单位的模板整句翻译，不做单字替换：运行时长在 zh-CN 是 `{{days}}天 {{time}}`，en-US 是 `{{days}}d {{time}}`，hu-HU 是 `{{days}} nap {{time}}`（匈牙利语数字与单位间需要空格），id-ID 是 `{{days}} hari {{time}}`
- hu-HU 与 id-ID 译文目前为初稿，建议安排母语人员评审
- 语言名称（LANGUAGE_OPTIONS 的 label）用原生写法，四语下均显示"简体中文 / English / Magyar / Bahasa Indonesia"
