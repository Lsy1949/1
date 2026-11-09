/**
 * Key 类型推导与枚举翻译（架构见 docs/i18n/04-type-system.md）。
 * zh-CN.json 是唯一事实来源，此文件不维护任何手工 Key 清单。
 */
import type { TFunction } from 'i18next'
import type zhCN from './locales/zh-CN.json'

/** 字典根类型 */
export type Dictionary = typeof zhCN

/**
 * 递归展平为点号 Key：{ common: { button: { submit: '提交' } } } -> 'common.button.submit'。
 * JSON 经 resolveJsonModule 导入后 Key 为字面量类型，恰好满足"Key 联合类型"的推导需求。
 *
 * 数组节点跳过子键：i18next 类型体系下数组索引子键（items.0.xxx）不在 t() 合法
 * Key 集合内，数组应通过 t(key, { returnObjects: true }) 整段获取。
 */
export type FlattenKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? never
    : T[K] extends object
      ? FlattenKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`> // 对象节点：递归拼接前缀
      : Prefix extends '' ? K : `${Prefix}.${K}` // 叶子节点：产出完整 Key
}[keyof T & string]

/** 全量合法 Key 联合类型，如 'common.back' | 'nav.brand' | ... */
export type I18nKey = FlattenKeys<Dictionary>

/** 字典中所有"对象节点"的路径 */
type ObjectPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? (Prefix extends '' ? K : `${Prefix}.${K}`) | ObjectPaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    : never
}[keyof T & string]

/** 枚举翻译统一约定挂在 enum.* 命名空间下（IBPS 点号分层） */
type EnumPath = Extract<ObjectPaths<Dictionary>, `enum.${string}`>

/** 校验：枚举 E 的每个成员是否都能在字典 P 下找到翻译 Key */
type EnumMembersMapped<P extends string, E> = {
  [K in keyof E & string]: `${P}.${K}` extends I18nKey
    ? true
    : `ERR: 字典缺少翻译 Key "${P}.${K}"` // 把缺失的 Key 写进错误信息，方便定位
}[keyof E & string]

/**
 * 合法的枚举前缀 = 既是 enum.* 下的对象节点，又完整覆盖 E 的全部成员。
 * 任一条件不满足时该类型坍缩为 never，调用处直接编译报错。
 */
export type ValidEnumPrefix<E> = {
  [P in EnumPath]: EnumMembersMapped<P, E> extends true ? P : never
}[EnumPath]

/** 反向查找：枚举值 -> 枚举成员名（兼容 TS enum 数字成员的反向映射键；as const 对象无此键） */
function enumKeyOf<E extends Readonly<Record<string, PropertyKey>>>(
  enumObj: E,
  value: PropertyKey,
): (keyof E & string) | undefined {
  return (Object.keys(enumObj) as Array<keyof E & string>).find(
    (key) => !/^\d+$/.test(key) && enumObj[key] === value,
  )
}

/**
 * 翻译前端自有枚举：tEnum(t, SomeEnum, 'enum.xxx.yyy', value)。
 * 编译期校验前缀与成员全覆盖；运行时两层兜底 —— 未识别值显示 '-'，
 * 字典意外缺失时降级显示原始值。
 */
export function tEnum<E extends Readonly<Record<string, PropertyKey>>>(
  t: TFunction,
  enumObj: E,
  prefix: ValidEnumPrefix<E>,
  value: E[keyof E] | null | undefined,
  fallback = '-',
): string {
  if (value === null || value === undefined) return fallback

  const enumKey = enumKeyOf(enumObj, value)
  if (enumKey === undefined) return fallback // 运行时兜底：未识别的取值

  // ValidEnumPrefix 已在编译期证明该 Key 存在，此处断言是安全的
  const i18nKey = `${prefix}.${enumKey}` as I18nKey
  const text = t(i18nKey)
  return text === i18nKey ? String(value) : text // 字典漏配时降级展示原始值
}
