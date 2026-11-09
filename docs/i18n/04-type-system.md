# 类型体系实现

这套类型设计拦截三类最常见的事故，全部在编译期完成：`t()` 拼错 Key、四语字典不同步、枚举字典漏配成员。实现分布在三个文件：`src/i18n/i18n.d.ts`、`src/i18n/dataHelper.ts`、`src/i18n/locales/keyParityCheck.ts`。本文代码摘自仓库快照（2026-11），可脱离仓库阅读。

## 事实来源：JSON 即类型

tsconfig 已开启 `resolveJsonModule`，`import zhCN from './locales/zh-CN.json'` 得到的 `typeof zhCN` 是一棵每个 Key 都是字符串字面量的类型树。字典文件一改，类型自动跟着变——整个类型体系没有任何手工维护的类型清单，zh-CN.json 是唯一事实来源。

## t() 的智能提示（src/i18n/i18n.d.ts）

通过 TS 模块增强（declaration merging）向 react-i18next 注入字典类型：

```ts
import 'react-i18next';
import type zhCN from './locales/zh-CN.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    /** 单命名空间项目，默认 ns 固定为 translation */
    defaultNS: 'translation';
    /** 以 zh-CN 字典作为 Key 的唯一事实来源 */
    resources: {
      translation: typeof zhCN;
    };
  }
}
```

react-i18next 内部会把嵌套结构展平成点号 Key 联合类型来约束 `t()` 的参数。效果：输入 `t('common.button.')` 时 IDE 补全全部子 Key；拼写的 Key 不存在时直接编译报错。

## FlattenKeys 递归展平（src/i18n/dataHelper.ts）

自定义工具类型把嵌套 JSON 展平为点号 Key 联合：

```ts
/** 字典根类型 */
export type Dictionary = typeof zhCN;

/**
 * 递归展平为 IBPS 点号 Key：{ common: { button: { submit: '提交' } } } -> 'common.button.submit'。
 * JSON 经 resolveJsonModule 导入后 Key 为字面量类型，恰好满足"Key 联合类型"的推导需求。
 */
export type FlattenKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? FlattenKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>  // 对象节点：递归拼接前缀
    : Prefix extends '' ? K : `${Prefix}.${K}`;                     // 叶子节点：产出完整 Key
}[keyof T & string];

/** 全量合法 Key 联合类型，如 'common.button.submit' | 'E10001' | ... */
export type I18nKey = FlattenKeys<Dictionary>;
```

映射类型遍历每层 Key，对象则递归、叶子则用模板字面量类型拼出完整路径，最后索引访问收集所有结果。产出的 `I18nKey` 是后续所有校验的地基。

## 四语对齐校验（src/i18n/locales/keyParityCheck.ts）

```ts
import type zhCN from './zh-CN.json';
import type enUS from './en-US.json';
import type huHU from './hu-HU.json';
import type idID from './id-ID.json';
import type { FlattenKeys } from '../dataHelper';

type ZhKeys = FlattenKeys<typeof zhCN>;

/** 约束泛型：如果传入的类型不是 never，编译器会报错并显示缺失的 Key */
type AssertNoMissing<TMissing extends never> = TMissing;

export type EnUSKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof enUS>>>;
export type HuHUKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof huHU>>>;
export type IdIDKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof idID>>>;
```

原理：`Exclude<中文全部 Key, 英文全部 Key>` 得到"英文缺失的 Key 集合"；泛型约束 `TMissing extends never` 要求该集合必须为空，非空则编译失败。关键在错误信息的可读性——缺失的 Key 名会直接出现在编译错误里，定位零成本。这个"约束为 never"的技巧是整个对齐机制的核心。

## tEnum 的全覆盖校验（src/i18n/dataHelper.ts）

`tEnum(t, DeviceRunStatus, 'enum.device.runStatus', status)` 的第三个参数被约束为 `ValidEnumPrefix<E>`，完整实现：

```ts
/** 字典中所有"对象节点"的路径 */
type ObjectPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? (Prefix extends '' ? K : `${Prefix}.${K}`) |
      ObjectPaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    : never;
}[keyof T & string];

/** 枚举翻译统一约定挂在 enum.* 命名空间下（IBPS 点号分层） */
type EnumPath = Extract<ObjectPaths<Dictionary>, `enum.${string}`>;

/** 校验：枚举 E 的每个成员是否都能在字典 P 下找到翻译 Key */
type EnumMembersMapped<P extends string, E> = {
  [K in keyof E & string]: `${P}.${K}` extends I18nKey
    ? true
    : `ERR: 字典缺少翻译 Key "${P}.${K}"`; // 把缺失的 Key 写进错误信息，方便定位
}[keyof E & string];

/**
 * 合法的枚举前缀 = 既是 enum.* 下的对象节点，又完整覆盖 E 的全部成员。
 * 任一条件不满足时该类型坍缩为 never，调用处直接编译报错。
 */
export type ValidEnumPrefix<E> = {
  [P in EnumPath]: EnumMembersMapped<P, E> extends true ? P : never;
}[EnumPath];
```

推导链分四步：

1. **ObjectPaths**：收集字典中所有"对象节点"的路径（与 FlattenKeys 的区别是只到对象层，不含叶子）
2. **EnumPath**：`Extract<ObjectPaths<Dictionary>, \`enum.${string}\`>`过滤出`enum.*` 前缀
3. **EnumMembersMapped**：对候选前缀逐个检查枚举 E 的每个成员能否拼出存在的字典 Key；检查失败时不是简单剔除，而是生成 `ERR: 字典缺少翻译 Key "enum.device.runStatus.Xxx"` 这样的字符串字面量类型
4. **ValidEnumPrefix**：`EnumMembersMapped<P, E>` 结果为 `true` 的前缀才保留，其余坍缩为 `never`

叠加效果：字典漏配某个枚举成员时，所有合法前缀都被剔除，`ValidEnumPrefix<E>` 坍缩为 `never`，调用处报"参数不可为 never"，且错误链中能看到 `ERR: ...` 类型写明的缺失 Key 名。新增枚举成员而忘记配字典，代码直接编译不过。

运行时函数与两层兜底：

```ts
/** 反向查找：枚举值 -> 枚举成员名（兼容 TS enum 数字成员的反向映射键；as const 对象无此键） */
function enumKeyOf<E extends Readonly<Record<string, PropertyKey>>>(
  enumObj: E,
  value: PropertyKey,
): (keyof E & string) | undefined {
  return (Object.keys(enumObj) as Array<keyof E & string>).find(
    (key) => !/^\d+$/.test(key) && enumObj[key] === value,
  );
}

export function tEnum<E extends Readonly<Record<string, PropertyKey>>>(
  t: TFunction,
  enumObj: E,
  prefix: ValidEnumPrefix<E>,
  value: E[keyof E] | null | undefined,
  fallback = '-',
): string {
  if (value === null || value === undefined) return fallback;

  const enumKey = enumKeyOf(enumObj, value);
  if (enumKey === undefined) return fallback; // 运行时兜底：未识别的取值

  // ValidEnumPrefix 已在编译期证明该 Key 存在，此处断言是安全的（非 any）
  const i18nKey = `${prefix}.${enumKey}` as I18nKey;
  const text = t(i18nKey);
  return text === i18nKey ? String(value) : text; // 字典漏配时降级展示原始值
}
```

`enumKeyOf` 里的 `/^\d+$/` 守卫用于跳过 TS 数字 enum 的反向映射键（`'0'`），`as const` 对象没有这种键，该守卫是为了兼容将来传入真正的 TS enum。

## 常见类型报错解读

| 报错特征                                                                          | 原因                                            | 修法                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `Argument of type '"xxx.yyy"' is not assignable to parameter of type 'I18nKey'` | Key 拼错，或字典中尚无该 Key                    | 核对拼写，或先完成"新增字典 Key"流程             |
| `Type '"ERR: 字典缺少翻译 Key "enum..."' ...` 出现在错误链中                    | 枚举成员的字典翻译漏配                          | 按错误信息补齐四语字典中缺失的成员               |
| keyParityCheck 相关的 `does not satisfy the constraint 'never'`                 | 某语言字典缺少 zh-CN 已有的 Key                 | 错误信息中列出的 Key 补进对应语言文件            |
| 大量 `t()` 调用同时报错                                                         | JSON 语法损坏导致 `typeof zhCN` 推导失败      | 看 tsc 首个指向 .json 的错误，修复语法后连带消失 |
| 传给工具函数的 t 报类型不匹配                                                     | 参数类型不是 `TFunction`（如误传 `i18n.t`） | 统一从 `useTranslation()` 解构 `t` 传入      |
