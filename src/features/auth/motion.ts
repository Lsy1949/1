/**
 * 【business】登录页动效编排 —— 消费全局基建 @/motion（enterMotion 工厂）
 *
 * 本文件只定义登录页的时间线与参数（单一来源），组件侧只引用预设、
 * 不自行实现；CSS Modules 不写任何 keyframes。引擎与使用规范见 @/motion。
 *
 * 编排（登录页首屏依次入场）：
 *   0ms   背景 / 光晕缓慢淡入（bg / bgMask）
 *   0ms   内容容器整体上浮（content，原 contentRise）
 *   0ms   品牌宣传区左滑入（propaganda，原 slideInFromLeft）
 *         ├ 250ms 标题区（propagandaHero）
 *         ├ 350ms 分隔线（propagandaDivider）
 *         ├ 450ms 引言（propagandaQuote）
 *         └ 550ms 起特性条目逐条 +100ms（propagandaFeatureMotion）
 *   200ms 登录卡上浮（loginCard，原 fadeInUp）
 *   切换  卡内视图 / 登录方式页签轻量淡入（loginView / loginTab）
 */
import { enterMotion, swapMotion } from '@/motion'

/** 登录页整页动效预设（时间线见文件头编排注释） */
export const loginMotions = {
  /** 背景图层：缓慢淡入（不位移，避免背景跳动） */
  bg: enterMotion({ duration: 1000 }),
  /** 光晕装饰层：比背景更慢半拍，营造纵深 */
  bgMask: enterMotion({ duration: 1600 }),
  /** 分屏内容容器整体上浮（原 LoginView contentRise） */
  content: enterMotion({ duration: 800, distance: 20 }),
  /** 品牌宣传区整体左滑入（原 Propaganda slideInFromLeft） */
  propaganda: enterMotion({ duration: 900, distance: 50, direction: 'left' }),
  /** 宣传区标题区（原 heroTitle fadeIn + 14px 上浮 @250ms） */
  propagandaHero: enterMotion({ duration: 700, delay: 250, distance: 14 }),
  /** 宣传区分隔线（原 divider fadeIn @350ms） */
  propagandaDivider: enterMotion({ duration: 700, delay: 350, distance: 14 }),
  /** 宣传区引言（原 heroQuote fadeIn @450ms） */
  propagandaQuote: enterMotion({ duration: 700, delay: 450, distance: 14 }),
  /** 登录卡上浮（原 fadeInUp @200ms，仅首挂载一次） */
  loginCard: enterMotion({ duration: 700, delay: 200, distance: 16 }),
  /** 卡内视图切换（登录/注册/忘记密码） */
  loginView: enterMotion({ duration: 350, distance: 10 }),
  /** 登录方式页签切换（swap：旧表单淡出 + 新表单淡入上浮，CSSMotionList 交叉过渡） */
  loginTab: swapMotion({ duration: 300, distance: 8 }),
}

/** 宣传区特性条目错落：550ms 起，逐条 +100ms（原 featureStep1-3 的时间序列，含 14px 上浮） */
export function propagandaFeatureMotion(index: number) {
  return enterMotion({ duration: 700, delay: 550 + index * 100, distance: 14 })
}
