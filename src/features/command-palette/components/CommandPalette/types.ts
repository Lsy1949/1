/**
 * 命令面板条目契约（base 纯 UI 层，不含路由等业务语义）。
 * 组件 props 类型一并在此导出，供 index.ts 统一 re-export。
 */
export interface PaletteItem {
  /** 唯一标识（业务层据此回查跳转目标） */
  id: string
  /** 主标题 */
  title: string
  /** 副标题描述 */
  desc?: string
  /** 分组键：按 items 首现顺序展示，显示名经 groupLabels 映射 */
  group: string
  /** 展示编号，如 '01' */
  num?: string
  /** 右侧角标 */
  tag?: string
}

export interface CommandPaletteProps {
  /** 是否打开 */
  open?: boolean
  /** 面板条目（顺序即展示顺序） */
  items?: PaletteItem[]
  /** 搜索框占位文案 */
  placeholder?: string
  /** 分组键 → 显示名；未映射时直接展示分组键 */
  groupLabels?: Record<string, string>
  /** 受控显隐回调（等价 v-model:open 的 update:open） */
  onUpdateOpen?: (v: boolean) => void
  /** 选中条目回调（等价 select 事件） */
  onSelect?: (item: PaletteItem) => void
}
