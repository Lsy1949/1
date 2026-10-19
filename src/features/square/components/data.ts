// 广场列表页静态数据
import type { FeedItem, MemberItem, PostItem } from './types'

export const moodMap: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', sad: '😢', hopeful: '🌟'
}

// 种子数据：FeedList 组件使用时需浅拷贝，保证每次进入页面状态重置
export const feedItemsSeed: FeedItem[] = [
  {
    id: 1, type: 'moment', author: '林晓', isAnonymous: false, mood: 'hopeful',
    content: '今天第一次去参加了心理咨询，原本很紧张，但老师特别温柔。聊完之后发现，原来一直压在心头的不是事情本身，而是我不敢面对它的那个瞬间。给自己一个拥抱。',
    photos: [], likes: 48, liked: false, commentCount: 12, createdAt: '2小时前',
    topics: ['心理咨询', '勇气'], isPinned: true
  },
  {
    id: 2, type: 'capsule', author: '匿名同学', isAnonymous: true, mood: 'calm',
    content: '写给半年后的自己：希望那时候的你，已经学会了和焦虑共处，而不是拼命想赶走它。记得多晒太阳，多喝水，别再熬夜了。',
    photos: [], likes: 92, liked: false, commentCount: 23, createdAt: '5小时前',
    topics: ['焦虑', '自我对话'], isHot: true
  },
  {
    id: 3, type: 'moment', author: '陈默', isAnonymous: false, mood: 'happy',
    content: '坚持冥想第 30 天。从一开始坐不住，到现在能安静地观察呼吸二十分钟。最大的改变不是不焦虑了，而是焦虑来的时候，我不再那么害怕它了。',
    photos: ['https://picsum.photos/seed/square-meditation/600/400'], likes: 67, liked: false, commentCount: 15, createdAt: '昨天',
    topics: ['冥想', '坚持']
  },
  {
    id: 4, type: 'moment', author: '周琳', isAnonymous: false, mood: 'sad',
    content: '考研出分了，没上岸。哭了一下午，然后去操场跑了五公里。回来洗完澡，看着镜子里红着眼的自己，突然觉得：没关系，这条路走不通，还有别的路。明天开始重新规划。',
    photos: ['https://picsum.photos/seed/square-run1/500/500', 'https://picsum.photos/seed/square-run2/500/500'], likes: 134, liked: false, commentCount: 38, createdAt: '昨天',
    topics: ['考研', '低谷'], isHot: true
  },
  {
    id: 5, type: 'capsule', author: '李华', isAnonymous: false, mood: 'excited',
    content: '给一年前的自己：那个在车库里熬夜改简历的你，那个被拒了七次还在投的你，谢谢你没有放弃。今天我签下了 dream offer。所有的坚持，都是有意义的。',
    photos: [], likes: 210, liked: false, commentCount: 46, createdAt: '2天前',
    topics: ['求职', '坚持']
  },
  {
    id: 6, type: 'moment', author: '匿名同学', isAnonymous: true, mood: 'calm',
    content: '今天和室友大吵了一架。冷静下来想想，其实我们都没有错，只是都在用自己的方式保护自己。等会儿去买杯奶茶，回去跟她道个歉。',
    photos: [], likes: 56, liked: false, commentCount: 19, createdAt: '2天前',
    topics: ['人际关系']
  },
  {
    id: 7, type: 'moment', author: '苏小北', isAnonymous: false, mood: 'hopeful',
    content: '读完了《被讨厌的勇气》。原来"课题分离"这四个字，可以解开我这么多年的结。别人的评价是别人的课题，我怎么做是我的课题。瞬间轻松了。',
    photos: ['https://picsum.photos/seed/square-book1/400/400', 'https://picsum.photos/seed/square-book2/400/400', 'https://picsum.photos/seed/square-book3/400/400'], likes: 89, liked: false, commentCount: 21, createdAt: '3天前',
    topics: ['读书', '自我成长']
  },
  {
    id: 8, type: 'capsule', author: '匿名同学', isAnonymous: true, mood: 'happy',
    content: '给未来的自己：希望你能记得今天这个瞬间——在图书馆靠窗的位置，阳光刚好落在书页上，心里没有任何烦恼。这是大学生活里最普通也最珍贵的一天。',
    photos: [], likes: 73, liked: false, commentCount: 11, createdAt: '3天前',
    topics: ['日常', '感恩']
  }
]

export const activeMembers: MemberItem[] = [
  { name: '林晓' }, { name: '陈默' }, { name: '周琳' }, { name: '李华' }, { name: '苏小北' }, { name: '匿名同学', isAnonymous: true }
]

export const trendingTopics = [
  { tag: '考研', count: 28 },
  { tag: '焦虑', count: 22 },
  { tag: '冥想', count: 15 },
  { tag: '人际关系', count: 13 },
  { tag: '自我成长', count: 11 },
  { tag: '读书', count: 9 },
  { tag: '坚持', count: 7 },
  { tag: '情绪管理', count: 6 }
]

// 详情页 mock 数据
export const mockPosts: Record<number, PostItem> = {
  1: { id: 1, type: 'moment', author: '林晓', isAnonymous: false, mood: 'hopeful', content: '今天第一次去参加了心理咨询，原本很紧张，但老师特别温柔。聊完之后发现，原来一直压在心头的不是事情本身，而是我不敢面对它的那个瞬间。给自己一个拥抱。', photos: [], likes: 48, liked: false, createdAt: '2小时前' },
  2: { id: 2, type: 'capsule', author: '匿名同学', isAnonymous: true, mood: 'calm', content: '写给半年后的自己：希望那时候的你，已经学会了和焦虑共处，而不是拼命想赶走它。记得多晒太阳，多喝水，别再熬夜了。', photos: [], likes: 92, liked: false, createdAt: '5小时前' },
  3: { id: 3, type: 'moment', author: '陈默', isAnonymous: false, mood: 'happy', content: '坚持冥想第 30 天。从一开始坐不住，到现在能安静地观察呼吸二十分钟。最大的改变不是不焦虑了，而是焦虑来的时候，我不再那么害怕它了。', photos: [], likes: 67, liked: false, createdAt: '昨天' },
  4: { id: 4, type: 'moment', author: '周琳', isAnonymous: false, mood: 'sad', content: '考研出分了，没上岸。哭了一下午，然后去操场跑了五公里。回来洗完澡，看着镜子里红着眼的自己，突然觉得：没关系，这条路走不通，还有别的路。明天开始重新规划。', photos: [], likes: 134, liked: false, createdAt: '昨天' },
  5: { id: 5, type: 'capsule', author: '李华', isAnonymous: false, mood: 'excited', content: '给一年前的自己：那个在车库里熬夜改简历的你，那个被拒了七次还在投的你，谢谢你没有放弃。今天我签下了 dream offer。所有的坚持，都是有意义的。', photos: [], likes: 210, liked: false, createdAt: '2天前' }
}

// 详情页默认评论种子（组件内浅拷贝使用）
export const defaultCommentsSeed = [
  { id: 1, author: '陈默', content: '读完很受触动，谢谢你的分享。跑步那个细节特别有力量。', time: '1小时前', likes: 8, liked: false },
  { id: 2, author: '匿名同学', content: '我也是今年考研失利，看到这段话像被理解了一样。', time: '40分钟前', likes: 15, liked: false, isAnonymous: true },
  { id: 3, author: '苏小北', content: '重新规划需要勇气，加油！', time: '20分钟前', likes: 4, liked: false }
]
