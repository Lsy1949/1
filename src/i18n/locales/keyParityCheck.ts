/**
 * 编译期三语 Key 对齐校验（架构见 docs/i18n/04-type-system.md）。
 * zh-CN.json 是事实来源；任一语言缺少 zh-CN 已有的 Key 时，
 * Exclude 计算出的缺失集合非空，AssertNoMissing 的 never 约束使编译失败，
 * 且缺失的 Key 名直接出现在错误信息里。零运行时成本。
 */
import type enUS from './en-US.json'
import type zhTW from './zh-TW.json'
import type zhCN from './zh-CN.json'
import type { FlattenKeys } from '../dataHelper'

type ZhKeys = FlattenKeys<typeof zhCN>

/** 约束泛型：如果传入的类型不是 never，编译器会报错并显示缺失的 Key */
type AssertNoMissing<TMissing extends never> = TMissing

export type ZhTWKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof zhTW>>>
export type EnUSKeysCheck = AssertNoMissing<Exclude<ZhKeys, FlattenKeys<typeof enUS>>>
