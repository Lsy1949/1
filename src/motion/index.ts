/**
 * 【infra】全局动效基建 —— Ant Motion 解决方案（全项目统一规范）
 *
 * 引擎：@rc-component/motion 的 CSSMotion（antd 组件内部同款动画引擎；
 * antd 6 未导出应用层 motion 组件，此为官方生态内的标准接入点）。
 *
 * ── 两层动效体系（规范核心）────────────────────────────
 *  L1 · 组件交互级：输入框 hover/focus、Tooltip、Segmented 等微交互，
 *      一律交给 antd 组件与 ConfigProvider 令牌（main.tsx 已统一
 *      motionDurationMid 等），业务代码零自研、零 JS 动画。
 *  L2 · 页面编排级：页面/区块的入场与切换编排（错落、上浮、滑入），
 *      一律 CSSMotion + feature 级 motion.ts 预设（见 features/auth/motion.ts）。
 *
 * ── 使用规则 ──────────────────────────────────────────
 *  1. 微交互 → antd 组件与 token；编排动画 → enterMotion + CSSMotion。
 *  2. 预设集中在各 feature 的 motion.ts，组件不得内联手写
 *     onAppearStart / onAppearActive（时间线只在预设文件可读、可调）。
 *  3. CSS Modules 零 keyframes（静态 hover transition 不算动画，可保留）。
 *  4. 新页面照此新增 features/<xxx>/motion.ts，基建与令牌不在业务侧复制。
 *
 * ── 用法 ──────────────────────────────────────────────
 * ```tsx
 * import CSSMotion from '@rc-component/motion'
 * import { enterMotion } from '@/motion'
 *
 * const preset = enterMotion({ duration: 300, distance: 8 })
 * <CSSMotion visible motionAppear {...preset}>
 *   {({ style }) => <div style={style}>…</div>}
 * </CSSMotion>
 * ```
 */
import type { CSSProperties } from 'react'
import type { CSSMotionProps } from '@rc-component/motion'

/** 全局统一的入场缓动（与 antd 生态入场曲线风格一致的大幅缓动） */
export const EASE_ENTER = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

/** 归位前的来向：up = 自下方浮上（默认）、left = 自左侧滑入 … */
export type EnterDirection = 'up' | 'down' | 'left' | 'right'

export interface EnterMotionOptions {
  /** 时长（ms） */
  duration: number
  /** 延迟（ms，错落入场用） */
  delay?: number
  /** 位移距离（px，0 = 纯淡入） */
  distance?: number
  /** 位移方向，默认 'up' */
  direction?: EnterDirection
  /** 缓动曲线，默认全局统一曲线 */
  easing?: string
  /** 是否伴随淡入，默认 true */
  fade?: boolean
}

/** 可直接展开进 CSSMotion 的入场动效片段 */
export type EnterMotion = Pick<
  CSSMotionProps,
  'motionName' | 'motionDeadline' | 'onAppearStart' | 'onAppearActive'
>

/**
 * 占位 motionName：CSSMotion 以其是否为空决定动效总开关
 * （isSupportTransition = !!(motionName && transitionSupport)），缺省时
 * appear 全部步骤被跳过、onAppearStart/Active 永不执行（动画静默失效）。
 * 样式完全由 JS handler 内联驱动，本 name 不对应任何 CSS 类。
 */
const MOTION_NAME = 'psy-enter'

function offsetTransform(direction: EnterDirection, distance: number): string {
  switch (direction) {
    case 'down':
      return `translateY(-${distance}px)`
    case 'left':
      return `translateX(-${distance}px)`
    case 'right':
      return `translateX(${distance}px)`
    case 'up':
    default:
      return `translateY(${distance}px)`
  }
}

/** appear 型入场动效工厂：onAppearStart 设起始态 → onAppearActive 设终态 + transition */
export function enterMotion({
  duration,
  delay = 0,
  distance = 0,
  direction = 'up',
  easing = EASE_ENTER,
  fade = true,
}: EnterMotionOptions): EnterMotion {
  const parts: string[] = []
  if (fade) parts.push(`opacity ${duration}ms ${easing} ${delay}ms`)
  if (distance > 0) parts.push(`transform ${duration}ms ${easing} ${delay}ms`)

  const start: CSSProperties = {}
  if (fade) start.opacity = 0
  if (distance > 0) start.transform = offsetTransform(direction, distance)

  const active: CSSProperties = { transition: parts.join(', ') }
  if (fade) active.opacity = 1
  if (distance > 0) active.transform = 'none'

  return {
    motionName: MOTION_NAME,
    // 兜底截止：transitionend 未触发（如标签页后台）也强制结束，避免样式卡在起始态
    motionDeadline: duration + delay + 300,
    onAppearStart: () => start,
    onAppearActive: () => active,
  }
}

/** swap 型（同容器交叉切换）动效：入场 + 离场成对，配合 CSSMotionList 使用 */
export type SwapMotion = Pick<
  CSSMotionProps,
  | 'motionName'
  | 'motionDeadline'
  | 'onAppearStart'
  | 'onAppearActive'
  | 'onEnterStart'
  | 'onEnterActive'
  | 'onLeaveStart'
  | 'onLeaveActive'
>

/**
 * 交叉切换动效工厂：入场沿用 enterMotion（淡入 + 位移归位），
 * 离场为镜像淡出（不动位移，避免与入场新内容对冲）。
 * 典型用法（新旧内容同格叠放，见消费方 CSS 的 grid-area 写法）：
 * ```tsx
 * <CSSMotionList component={false} keys={[{ key }]} visible
 *   motionAppear motionEnter motionLeave {...swapMotion({ duration: 300, distance: 8 })}>
 *   {({ key, style, className }) => <div style={style} className={className}>…</div>}
 * </CSSMotionList>
 * ```
 */
export function swapMotion(options: EnterMotionOptions): SwapMotion {
  const enter = enterMotion(options)
  const { duration, delay = 0, easing = EASE_ENTER } = options
  const transition = `opacity ${duration}ms ${easing} ${delay}ms`
  return {
    ...enter,
    onEnterStart: enter.onAppearStart,
    onEnterActive: enter.onAppearActive,
    onLeaveStart: () => ({}),
    onLeaveActive: () => ({ opacity: 0, transition }),
  }
}
