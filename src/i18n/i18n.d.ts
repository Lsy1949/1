/**
 * react-i18next / i18next 类型增强：t() Key 智能提示与编译期校验。
 *
 * react-i18next v18 起 t() 类型由 i18next 核心提供，CustomTypeOptions 挂在
 * 'i18next' 模块上（旧版挂 'react-i18next' 的写法已失效）。
 */
import 'i18next'
import type zhCN from './locales/zh-CN.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    /** 单命名空间项目，默认 ns 固定为 translation */
    defaultNS: 'translation'
    /** 以 zh-CN 字典作为 Key 的唯一事实来源 */
    resources: {
      translation: typeof zhCN
    }
  }
}
