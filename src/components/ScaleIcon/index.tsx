import type { ComponentType } from 'react'
import {
  AimOutlined,
  ApartmentOutlined,
  BookOutlined,
  BulbOutlined,
  CompassOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  MessageOutlined,
  ReadOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'

/**
 * 原 Vue 版在 plugins/pc.ts 中把 @element-plus/icons-vue 全量注册为全局组件，
 * 模板里用 <component :is="scale.icon"> 以字符串解析图标。
 * React 没有全局组件注册，等价做法是维护「字符串 → 图标组件」注册表，
 * data.ts 中的 icon 字段保持字符串形态不变（数据层零改动）。
 */
const registry: Record<string, ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  // Element Plus 图标名 → Ant Design 图标（就近映射）
  TrendCharts: RiseOutlined,
  Odometer: DashboardOutlined,
  Compass: CompassOutlined,
  User: UserOutlined,
  Collection: BookOutlined,
  Lightning: ThunderboltOutlined,
  Cpu: DatabaseOutlined,
  Opportunity: BulbOutlined,
  Aim: AimOutlined,
  Reading: ReadOutlined,
  ChatDotRound: MessageOutlined,
  Connection: ApartmentOutlined,
}

interface ScaleIconProps {
  name?: string
  className?: string
  style?: React.CSSProperties
}

export default function ScaleIcon({ name, className, style }: ScaleIconProps) {
  const Icon = (name && registry[name]) || BookOutlined
  return <Icon className={className} style={style} />
}
