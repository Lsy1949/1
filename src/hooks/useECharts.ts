/**
 * ECharts React 绑定（项目内统一入口）
 *
 * - echarts/core 按需注册：仅引入本站用到的图表与组件，控制包体
 * - 挂载后 ResizeObserver 自适应容器尺寸（侧栏折叠 / 窗口缩放均生效）
 * - option 变化时以 notMerge 全量替换，避免残留 series
 * - 卸载时 dispose，防止内存泄漏
 *
 * 配色：option 中不要写死色值，用 `readCssColor('var(--xxx)')`
 * 解析语义 token 后传入；组件依赖 `theme` 重建 option 即可联动暗色。
 */
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, RadarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

export type { EChartsCoreOption }

/** 返回容器 ref；传入 null（数据未就绪）时暂时跳过渲染 */
export function useECharts(option: EChartsCoreOption | null) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const optionRef = useRef(option)

  // 初始化与销毁（仅一次）
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 容器初始隐藏（display:none）时零尺寸 init 会触发 ECharts 警告并塌缩，
    // 因此延迟到首次具备尺寸再初始化；挂载即可见则立即初始化
    const ensureChart = (): void => {
      if (chartRef.current) return
      const { width, height } = container.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      const chart = echarts.init(container)
      chartRef.current = chart
      if (optionRef.current) chart.setOption(optionRef.current, true)
    }

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        ensureChart()
        chartRef.current?.resize()
      }
    })
    observer.observe(container)
    ensureChart()

    return () => {
      observer.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  // 数据 / 主题变化时全量替换；图表尚未初始化（容器仍隐藏）时暂存，待初始化后应用
  useEffect(() => {
    optionRef.current = option
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true)
    }
  }, [option])

  return containerRef
}
