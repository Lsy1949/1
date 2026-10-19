// I18n 上下文的统一出口：实现见 @/i18n（等价 vue-i18n 的轻量方案，
// 含 zh-CN 缺键回退与 {name} 占位插值），组件内用 useI18n() 消费。
export { I18nProvider, useI18n, type AppLocale } from '@/i18n'
