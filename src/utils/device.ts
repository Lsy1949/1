export type DeviceType = 'pc' | 'mobile'

/**
 * 移动端 UA 特征。
 * 本项目唯一的 UA 检测，仅用于「入口分包」这一同步决策：
 * main.tsx 加载前必须确定下载哪套 bundle，而 iPad 横屏时视口宽度
 * 与 PC 相同，纯视口判断会误判。组件内响应式适配一律用 isMobile。
 */
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

/** 同步判断：入口处调用一次，决定加载哪套 bundle（切换设备需刷新生效） */
export function isMobileUA(): boolean {
  if (typeof window === 'undefined') return false
  return MOBILE_UA.test(window.navigator.userAgent)
}

/**
 * 等价改写说明（Vue → React）：
 * 原实现为 VueUse useMediaQuery + Vue computed，React 侧改为框架无关的
 * 只读 ref（matchMedia 模块级监听替代 useMediaQuery）。
 * 组件内响应式消费：useSyncExternalStore(isMobile.subscribe, () => isMobile.value)。
 */

/** 只读 ref：.value 读取当前值；subscribe 供 useSyncExternalStore 订阅变更 */
interface DeviceRef<T> {
  readonly value: T
  subscribe(listener: () => void): () => void
}

/** 响应式视口检测（等价 VueUse useMediaQuery，matchMedia 模块级监听） */
const viewportQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 768px)')
    : null

function createDeviceRef<T>(compute: () => T): DeviceRef<T> {
  let value = compute()
  const listeners = new Set<() => void>()
  const refresh = (): void => {
    const next = compute()
    if (next === value) return
    value = next
    listeners.forEach((listener) => listener())
  }
  viewportQuery?.addEventListener('change', refresh)
  return {
    get value(): T {
      return value
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** 响应式设备标识：组件内细粒度适配用 */
export const isMobile: DeviceRef<boolean> = createDeviceRef(
  () => (viewportQuery?.matches ?? false) || isMobileUA(),
)

export const deviceType: DeviceRef<DeviceType> = createDeviceRef(() =>
  isMobile.value ? 'mobile' : 'pc',
)
