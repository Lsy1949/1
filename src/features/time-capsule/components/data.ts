/**
 * 时光胶囊模块 · 列表页种子数据
 * 页面内使用浅拷贝初始化，保持每次进入页面状态重置的原有行为
 */
import type { CapsuleDetailItem, CapsuleItem } from './types'

export const capsulesSeed: CapsuleItem[] = [
  {
    id: 1,
    title: '写给一年后的自己：保持热爱',
    openDate: '2027-06-20',
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 1,
    remainingDays: 327,
    emotionEmoji: '🌟',
    openMethod: 'email'
  },
  {
    id: 2,
    title: '毕业季的告白',
    openDate: '2026-06-18',
    status: 'opened',
    sendStatus: 'success',
    auditStatus: 1,
    remainingDays: 0,
    emotionEmoji: '🤩',
    openMethod: 'email'
  },
  {
    id: 3,
    title: '关于成长的一些思考',
    openDate: '2027-01-01',
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 1,
    remainingDays: 200,
    emotionEmoji: '😌',
    openMethod: 'letter'
  },
  {
    id: 4,
    title: '致迷茫的自己',
    openDate: '2026-06-10',
    status: 'opened',
    sendStatus: 'failed',
    auditStatus: 1,
    remainingDays: 0,
    emotionEmoji: '😢',
    openMethod: 'email'
  },
  {
    id: 5,
    title: '审核中的那封信',
    openDate: '2027-03-15',
    status: 'pending',
    sendStatus: 'success',
    auditStatus: 0,
    remainingDays: 260,
    emotionEmoji: '😊',
    openMethod: 'letter'
  }
]

/** 详情页模拟数据（只读引用，与原行为一致） */
export const mockCapsules: Record<number, CapsuleDetailItem> = {
  1: {
    id: 1,
    title: '写给一年后的自己：保持热爱',
    createDate: '2026-06-20',
    content: '<p>希望一年后的你，依然能记得此刻许下的愿望。无论生活给你什么，都要勇敢地走下去。</p><p>愿你不忘初心，砥砺前行。</p>',
    images: [],
    openMethod: 'email',
    emailRecipient: 'future-me@example.com',
    isAnonymous: false,
    openDate: '2027-06-20',
    remainingDays: 327,
    emotion: 'hopeful'
  },
  2: {
    id: 2,
    title: '毕业季的告白',
    createDate: '2026-06-18',
    content: '<p>四年时光匆匆而过，感谢遇见的每一个人。这段文字将在毕业一周年时开启，愿那时的我们都能成为更好的自己。</p>',
    images: [],
    openMethod: 'email',
    emailRecipient: 'graduation@example.com',
    isAnonymous: true,
    openDate: '2026-06-18',
    remainingDays: 0,
    emotion: 'excited'
  },
  3: {
    id: 3,
    title: '关于成长的一些思考',
    createDate: '2026-06-15',
    content: '<p>成长不是一蹴而就的事情，它藏在每一个平凡的日子里。把这段话封存，等到未来再回头看看当时的自己。</p>',
    images: [],
    openMethod: 'letter',
    letterName: '张三',
    letterPhone: '138****8888',
    letterAddress: '北京市海淀区某某街道',
    isAnonymous: false,
    openDate: '2027-01-01',
    remainingDays: 200,
    emotion: 'calm'
  },
  4: {
    id: 4,
    title: '致迷茫的自己',
    createDate: '2026-06-10',
    content: '<p>如果你正在读这封信，说明时间已经过去很久了。还记得当初的迷茫吗？希望现在的你已经找到了答案。</p>',
    images: [],
    openMethod: 'email',
    emailRecipient: 'self@example.com',
    isAnonymous: false,
    openDate: '2026-06-10',
    remainingDays: 0,
    emotion: 'sad'
  }
}
