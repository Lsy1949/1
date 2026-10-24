import dayjs from 'dayjs'
import type {
  CapsuleCreateDTO,
  CapsuleDetailDTO,
  CapsuleListItemDTO,
  CapsuleListQuery,
} from '@/api/types'
// mock 图片资源：与用户上传 base64 同构（string[]），import 为构建期 URL
import imgNist from '@/assets/images/nist-bg.jpg'
import imgTsinghua from '@/assets/images/tsinghua-bg.jpg'

/**
 * 时光胶囊 mock 数据（模拟后端 `GET /api/capsules*` / `POST /api/capsules` / `DELETE /api/capsules/:id`）。
 *
 *  - 列表与详情共用同一份 `CapsuleDetailDTO[]`，避免两套种子再次分叉；
 *  - 新建与删除都会直接改写数组，并落到 localStorage —— 刷新页面后状态保持一致；
 *  - 需要恢复初始数据时，清除 localStorage 的 `mock:capsules` 即可。
 */

const STORAGE_KEY = 'mock:capsules'

const SEED: CapsuleDetailDTO[] = [
  {
    // 分支：倒计时 + email + 无图
    id: 1,
    title: '写给一年后的自己：保持热爱',
    openDate: '2027-06-20',
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 1,
    remainingDays: 327,
    emotionEmoji: '🌟',
    openMethod: 'email',
    createDate: '2026-06-20',
    content: '<p>希望一年后的你，依然能记得此刻许下的愿望。无论生活给你什么，都要勇敢地走下去。</p><p>愿你不忘初心，砥砺前行。</p>',
    images: [],
    emailRecipient: 'future-me@example.com',
    isAnonymous: false,
    emotion: 'hopeful'
  },
  {
    // 分支：已开启 + letter 三字段 + 单图
    id: 2,
    title: '毕业季寄给自己的明信片',
    openDate: '2026-06-18',
    status: 'opened',
    sendStatus: 'success',
    auditStatus: 1,
    remainingDays: 0,
    emotionEmoji: '🤩',
    openMethod: 'letter',
    createDate: '2026-06-18',
    content: '<p>四年时光匆匆而过，感谢遇见的每一个人。这张校园的照片随信一起寄到，愿那时的我们都能成为更好的自己。</p>',
    images: [imgTsinghua],
    letterName: '王同学',
    letterPhone: '137****1234',
    letterAddress: '北京市海淀区学院路 1 号',
    isAnonymous: true,
    emotion: 'excited'
  },
  {
    // 分支：三图单行 + letter
    id: 3,
    title: '关于成长的一些思考',
    openDate: '2027-01-01',
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 1,
    remainingDays: 200,
    emotionEmoji: '😌',
    openMethod: 'letter',
    createDate: '2026-06-15',
    content: '<p>成长不是一蹴而就的事情，它藏在每一个平凡的日子里。这三张照片记录了这一年的片段，等到未来再回头看看当时的自己。</p>',
    images: [imgNist, imgTsinghua, imgNist],
    letterName: '张三',
    letterPhone: '138****8888',
    letterAddress: '北京市海淀区某某街道',
    isAnonymous: false,
    emotion: 'calm'
  },
  {
    // 分支：发送失败 + 六图两行 + email
    id: 4,
    title: '致迷茫的自己',
    openDate: '2026-06-10',
    status: 'opened',
    sendStatus: 'failed',
    auditStatus: 1,
    remainingDays: 0,
    emotionEmoji: '😢',
    openMethod: 'email',
    createDate: '2026-06-10',
    content: '<p>如果你正在读这封信，说明时间已经过去很久了。还记得当初的迷茫吗？这些照片是那段日子的记录，希望现在的你已经找到了答案。</p>',
    images: [imgNist, imgTsinghua, imgNist, imgTsinghua, imgNist, imgTsinghua],
    emailRecipient: 'self@example.com',
    isAnonymous: false,
    emotion: 'sad'
  },
  {
    // 分支：审核中
    id: 5,
    title: '审核中的那封信',
    openDate: '2027-03-15',
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 0,
    remainingDays: 260,
    emotionEmoji: '😊',
    openMethod: 'letter',
    createDate: '2026-10-12',
    content: '<p>这封信正在等待审核，审核通过后会按约定的时间寄出。写下的每一个字，都值得被认真对待。</p>',
    images: [],
    letterName: '李四',
    letterPhone: '139****6666',
    letterAddress: '上海市徐汇区某某路',
    isAnonymous: true,
    emotion: 'calm'
  },
]

/** 模块级缓存：同一页面会话内共享，刷新后由 localStorage 恢复 */
let store: CapsuleDetailDTO[] | null = null

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store ?? []))
  } catch {
    /* localStorage 不可用（隐私模式等）时退化为纯内存，不影响接口行为 */
  }
}

function load(): CapsuleDetailDTO[] {
  if (store) return store

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        store = parsed as CapsuleDetailDTO[]
        return store
      }
    }
  } catch {
    /* 解析失败则回退到种子数据 */
  }

  store = SEED.map(item => ({ ...item, images: [...item.images] }))
  persist()
  return store
}

/** 详情 DTO → 列表 DTO（去掉正文/图片/收件信息） */
function toListItem(item: CapsuleDetailDTO): CapsuleListItemDTO {
  return {
    id: item.id,
    title: item.title,
    openDate: item.openDate,
    status: item.status,
    sendStatus: item.sendStatus,
    auditStatus: item.auditStatus,
    remainingDays: item.remainingDays,
    emotionEmoji: item.emotionEmoji,
    openMethod: item.openMethod,
  }
}

/** `GET /api/capsules` —— 按状态 / 开启时间区间过滤，按开启时间正序 */
export function listCapsules(query: CapsuleListQuery = {}): CapsuleListItemDTO[] {
  const { status = 'all', openDateFrom, openDateTo } = query

  return load()
    .filter(item => status === 'all' || item.status === status)
    .filter(item => !openDateFrom || item.openDate >= openDateFrom)
    .filter(item => !openDateTo || item.openDate <= openDateTo)
    .sort((a, b) => a.openDate.localeCompare(b.openDate))
    .map(toListItem)
}

/** `GET /api/capsules/:id` */
export function findCapsule(id: number): CapsuleDetailDTO | undefined {
  return load().find(item => item.id === id)
}

/** `DELETE /api/capsules/:id` —— 真实移除并持久化 */
export function removeCapsule(id: number): boolean {
  const items = load()
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return false

  items.splice(index, 1)
  persist()
  return true
}

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  calm: '😌',
  sad: '😢',
  hopeful: '🌟',
}

/** `POST /api/capsules` —— 生成新 id、补齐默认状态并持久化 */
export function createCapsule(input: CapsuleCreateDTO): CapsuleDetailDTO {
  const items = load()
  const nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1
  const isEmail = input.openMethod === 'email'
  const remainingDays = Math.max(
    0,
    dayjs(input.openDate).startOf('day').diff(dayjs().startOf('day'), 'day'),
  )

  const created: CapsuleDetailDTO = {
    id: nextId,
    title: input.title,
    openDate: input.openDate,
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 0,
    remainingDays,
    emotionEmoji: EMOTION_EMOJI[input.emotion] ?? '🌟',
    openMethod: input.openMethod,
    createDate: dayjs().format('YYYY-MM-DD'),
    content: input.content,
    images: [...input.images],
    isAnonymous: input.isAnonymous,
    emotion: input.emotion,
    isPublic: input.isPublic,
    disableComment: input.disableComment,
    emailRecipient: isEmail ? input.emailRecipient : undefined,
    letterName: isEmail ? undefined : input.letterName,
    letterPhone: isEmail ? undefined : input.letterPhone,
    letterAddress: isEmail ? undefined : input.letterAddress,
  }

  items.push(created)
  persist()
  return created
}
