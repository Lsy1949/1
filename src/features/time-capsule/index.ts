/**
 * time-capsule feature 对外出口：外部一律 import from '@/features/time-capsule'。
 * 组件供 pages 层组合；ListArchiveRef 为列表页归档区 imperative handle 类型。
 */
export { default as CreateForm } from './components/CreateForm'
export { default as CreateHeader } from './components/CreateHeader'
export { default as DetailBody } from './components/DetailBody'
export { default as DetailHeader } from './components/DetailHeader'
export { default as ListArchive } from './components/ListArchive'
export { default as ListHeader } from './components/ListHeader'
export type { ListArchiveRef } from './components/ListArchive'
export type {
  CapsuleCreateInput,
  CapsuleDetailItem,
  CapsuleFilterType,
  CapsuleItem,
  CapsuleStats,
} from './components/types'
