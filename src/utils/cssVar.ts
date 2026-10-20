/**
 * CSS 变量读取工具
 *
 * 适用场景：canvas 绘制、SVG 展示属性、第三方图表（ECharts）等
 * **必须拿到解析后实色**、无法直接使用 `var()` 表达式的地方。
 *
 * 实现：把颜色表达式临时挂到探针元素上，用 getComputedStyle 读回解析结果。
 * 因此 `var(--x)`、`color-mix(...)` 等表达式都能被正确求值。
 *
 * 结果按「主题签名」缓存，避免 canvas 逐帧绘制时反复创建 DOM；
 * 明暗模式 / 色板 / 租户覆写任一变化时签名改变，缓存自动失效。
 */

const cache = new Map<string, string>()
let signature = ''

/** 租户 L2 覆写样式表元素 id（见 stores/useTenantStore） */
const OVERRIDE_STYLE_ID = 'tenant-theme-overrides'

/**
 * 主题签名：明暗 + 色板 + 租户覆写内容。
 * 三者任一变化都意味着变量解析结果变化，需让缓存失效。
 */
function themeSignature(): string {
  const root = document.documentElement
  const mode = root.classList.contains('dark') ? 'dark' : 'light'
  const palette = root.dataset.palette ?? ''
  const overrides = document.getElementById(OVERRIDE_STYLE_ID)?.textContent ?? ''
  return `${mode}|${palette}|${overrides}`
}

/**
 * 解析 CSS 颜色表达式（支持 `var()` / `color-mix()`），返回实色字符串。
 * @param expr 颜色表达式，如 `var(--cat-blue)` 或 `color-mix(in srgb, var(--brand-primary) 15%, transparent)`
 * @param fallback 解析失败时的兜底色
 */
export function readCssColor(expr: string, fallback = '#000'): string {
  const sig = themeSignature()
  if (sig !== signature) {
    signature = sig
    cache.clear()
  }

  const hit = cache.get(expr)
  if (hit) return hit

  const probe = document.createElement('span')
  probe.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;color:${expr}`
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()

  const value = resolved || fallback
  cache.set(expr, value)
  return value
}
