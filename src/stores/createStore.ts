import { useSyncExternalStore } from 'react'

/**
 * 轻量外部 store 工厂（等价 Pinia 的模块级单例语义）。
 *
 * 为什么不用 Context：axios 拦截器 / SignalR 连接层等**非 React 代码**
 * 也需要读写 store（Context Hook 在组件外调用会抛错），因此状态必须是
 * 模块级单例；组件内通过 useSyncExternalStore 订阅，基础设施层直接
 * 调用 store 实例的 getState/setState，两条路径共享同一份数据。
 *
 * - transform：state → 对外值（拼装 getters + actions），仅在变更时重建，
 *   保证 useSyncExternalStore 的 getSnapshot 引用稳定（避免无限重渲染）。
 */
export function createStore<S extends object, V = S>(
  initial: S,
  transform?: (state: S) => V,
) {
  let state = initial
  let snapshot = (transform ? transform(state) : state) as V
  const listeners = new Set<() => void>()

  const store = {
    /** 原始 state（基础设施层直读） */
    getState: (): S => state,
    /** 对外快照（含 getters + actions，引用稳定） */
    getSnapshot: (): V => snapshot,
    /** 订阅变更，返回退订函数 */
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    /** 变更 state：先重建快照再广播，保证订阅方读到最新值 */
    setState(patch: Partial<S> | ((prev: S) => Partial<S>)): void {
      const p = typeof patch === 'function' ? patch(state) : patch
      state = { ...state, ...p }
      snapshot = transform ? transform(state) : (state as unknown as V)
      listeners.forEach((l) => l())
    },
  }

  return {
    ...store,
    /**
     * 组件内订阅入口（与 Pinia 调用形态一致的 useXxxStore 底座）。
     *
     * 传 selector 时只订阅选中值，避免无关字段变更引发重渲染；
     * selector 必须返回**稳定值**（原始值或稳定引用），
     * 每次渲染新建对象/数组会导致 useSyncExternalStore 反复判定变更。
     */
    useStore<T = V>(selector?: (value: V) => T): T {
      const getSelected = (): T =>
        selector ? selector(store.getSnapshot()) : (store.getSnapshot() as unknown as T)
      return useSyncExternalStore(store.subscribe, getSelected, getSelected)
    },
  }
}
