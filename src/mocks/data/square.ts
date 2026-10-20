import type {
  SquareCommentCreateDTO,
  SquareCommentDTO,
  SquareCommentLikeDTO,
  SquareCreateDTO,
  SquareFeedDTO,
  SquareInfoDTO,
  SquareLikeDTO,
  SquareMemberDTO,
  SquareTopicDTO,
} from '@/api/types'

/**
 * 广场 mock 数据（模拟 `GET /api/square/info` / 详情 / 点赞 / 发布 / 评论）。
 *
 * - feed 存 `localStorage('mock:square-feed')`；
 * - 评论存 `localStorage('mock:square-comments')`；
 * - 发布评论会同步累加对应 feed 的 `commentCount`；
 * - 首次访问自动播种，删除 key 即可重置。
 */

const FEED_STORAGE_KEY = 'mock:square-feed'
const COMMENT_STORAGE_KEY = 'mock:square-comments'

const FEED_SEED: SquareFeedDTO[] = [
  {
    id: 1, type: 'moment', author: '林晓', isAnonymous: false, mood: 'hopeful',
    content: '今天第一次去参加了心理咨询，原本很紧张，但老师特别温柔。聊完之后发现，原来一直压在心头的不是事情本身，而是我不敢面对它的那个瞬间。给自己一个拥抱。',
    photos: [], likes: 48, liked: false, commentCount: 12, createdAt: '2小时前',
    topics: ['心理咨询', '勇气'], isPinned: true,
  },
  {
    id: 2, type: 'capsule', author: '匿名同学', isAnonymous: true, mood: 'calm',
    content: '写给半年后的自己：希望那时候的你，已经学会了和焦虑共处，而不是拼命想赶走它。记得多晒太阳，多喝水，别再熬夜了。',
    photos: [], likes: 92, liked: false, commentCount: 23, createdAt: '5小时前',
    topics: ['焦虑', '自我对话'], isHot: true,
  },
  {
    id: 3, type: 'moment', author: '陈默', isAnonymous: false, mood: 'happy',
    content: '坚持冥想第 30 天。从一开始坐不住，到现在能安静地观察呼吸二十分钟。最大的改变不是不焦虑了，而是焦虑来的时候，我不再那么害怕它了。',
    photos: ['https://picsum.photos/seed/square-meditation/600/400'], likes: 67, liked: false,
    commentCount: 15, createdAt: '昨天', topics: ['冥想', '坚持'],
  },
  {
    id: 4, type: 'moment', author: '周琳', isAnonymous: false, mood: 'sad',
    content: '考研出分了，没上岸。哭了一下午，然后去操场跑了五公里。回来洗完澡，看着镜子里红着眼的自己，突然觉得：没关系，这条路走不通，还有别的路。明天开始重新规划。',
    photos: [
      'https://picsum.photos/seed/square-run1/500/500',
      'https://picsum.photos/seed/square-run2/500/500',
    ],
    likes: 134, liked: false, commentCount: 38, createdAt: '昨天',
    topics: ['考研', '低谷'], isHot: true,
  },
  {
    id: 5, type: 'capsule', author: '李华', isAnonymous: false, mood: 'excited',
    content: '给一年前的自己：那个在车库里熬夜改简历的你，那个被拒了七次还在投的你，谢谢你没有放弃。今天我签下了 dream offer。所有的坚持，都是有意义的。',
    photos: [], likes: 210, liked: false, commentCount: 46, createdAt: '2天前',
    topics: ['求职', '坚持'],
  },
  {
    id: 6, type: 'moment', author: '匿名同学', isAnonymous: true, mood: 'calm',
    content: '今天和室友大吵了一架。冷静下来想想，其实我们都没有错，只是都在用自己的方式保护自己。等会儿去买杯奶茶，回去跟她道个歉。',
    photos: [], likes: 56, liked: false, commentCount: 19, createdAt: '2天前',
    topics: ['人际关系'],
  },
  {
    id: 7, type: 'moment', author: '苏小北', isAnonymous: false, mood: 'hopeful',
    content: '读完了《被讨厌的勇气》。原来"课题分离"这四个字，可以解开我这么多年的结。别人的评价是别人的课题，我怎么做是我的课题。瞬间轻松了。',
    photos: [
      'https://picsum.photos/seed/square-book1/400/400',
      'https://picsum.photos/seed/square-book2/400/400',
      'https://picsum.photos/seed/square-book3/400/400',
    ],
    likes: 89, liked: false, commentCount: 21, createdAt: '3天前',
    topics: ['读书', '自我成长'],
  },
  {
    id: 8, type: 'capsule', author: '匿名同学', isAnonymous: true, mood: 'happy',
    content: '给未来的自己：希望你能记得今天这个瞬间——在图书馆靠窗的位置，阳光刚好落在书页上，心里没有任何烦恼。这是大学生活里最普通也最珍贵的一天。',
    photos: [], likes: 73, liked: false, commentCount: 11, createdAt: '3天前',
    topics: ['日常', '感恩'],
  },
]

const MEMBERS: SquareMemberDTO[] = [
  { name: '林晓' },
  { name: '陈默' },
  { name: '周琳' },
  { name: '李华' },
  { name: '苏小北' },
  { name: '匿名同学', isAnonymous: true },
]

const TOPICS: SquareTopicDTO[] = [
  { tag: '考研', count: 28 },
  { tag: '焦虑', count: 22 },
  { tag: '冥想', count: 15 },
  { tag: '人际关系', count: 13 },
  { tag: '自我成长', count: 11 },
  { tag: '读书', count: 9 },
  { tag: '坚持', count: 7 },
  { tag: '情绪管理', count: 6 },
]

function loadFeed(): SquareFeedDTO[] {
  try {
    const raw = localStorage.getItem(FEED_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as SquareFeedDTO[]) : []
    }
  } catch {
    /* 解析失败回退种子 */
  }

  persistFeed(FEED_SEED)
  return [...FEED_SEED]
}

function persistFeed(list: SquareFeedDTO[]): void {
  try {
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* localStorage 不可用时退化为纯内存 */
  }
}

/** `GET /api/square/info` */
export function getSquareInfo(): SquareInfoDTO {
  return {
    feedItems: loadFeed(),
    members: MEMBERS,
    topics: TOPICS,
    onlineCount: 23,
    todayNewCount: 5,
  }
}

/** `GET /api/square/feed/:id` */
export function findFeed(id: number): SquareFeedDTO | undefined {
  return loadFeed().find(item => item.id === id)
}

/** `POST /api/square/feed/:id/like` —— 切换点赞并持久化 */
export function toggleFeedLike(id: number): SquareLikeDTO | undefined {
  const list = loadFeed()
  const target = list.find(item => item.id === id)
  if (!target) return undefined

  target.liked = !target.liked
  target.likes = Math.max(0, target.likes + (target.liked ? 1 : -1))
  persistFeed(list)

  return { id: target.id, liked: target.liked, likes: target.likes }
}

/** `POST /api/square/feed` —— 新动态置顶 */
export function createFeed(input: SquareCreateDTO): SquareFeedDTO {
  const list = loadFeed()
  const nextId = list.reduce((max, item) => Math.max(max, item.id), 0) + 1

  const feed: SquareFeedDTO = {
    id: nextId,
    type: 'moment',
    author: input.isAnonymous ? '匿名同学' : '王同学',
    isAnonymous: input.isAnonymous,
    mood: input.mood,
    content: input.content,
    photos: [...input.photos],
    likes: 0,
    liked: false,
    commentCount: 0,
    createdAt: '刚刚',
    topics: [...input.topics],
    allowComment: input.allowComment,
  }

  persistFeed([feed, ...list])
  return feed
}

/** 评论种子：绑定首条动态；其余动态为空，便于直接观察空态 */
const COMMENT_SEED: SquareCommentDTO[] = [
  {
    id: 1, feedId: 1, author: '陈默', isAnonymous: false,
    content: '读完很受触动，谢谢你的分享。跑步那个细节特别有力量。',
    likes: 8, liked: false, createdAt: '1小时前',
  },
  {
    id: 2, feedId: 1, author: '匿名同学', isAnonymous: true,
    content: '我也是今年考研失利，看到这段话像被理解了一样。',
    likes: 15, liked: false, createdAt: '40分钟前',
  },
  {
    id: 3, feedId: 1, author: '苏小北', isAnonymous: false,
    content: '重新规划需要勇气，加油！',
    likes: 4, liked: false, createdAt: '20分钟前',
  },
]

function loadComments(): SquareCommentDTO[] {
  try {
    const raw = localStorage.getItem(COMMENT_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as SquareCommentDTO[]) : []
    }
  } catch {
    /* 解析失败回退种子 */
  }

  persistComments(COMMENT_SEED)
  return [...COMMENT_SEED]
}

function persistComments(list: SquareCommentDTO[]): void {
  try {
    localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* localStorage 不可用时退化为纯内存 */
  }
}

/** `GET /api/square/feed/:id/comments` —— 按时间倒序（新评论在前） */
export function listComments(feedId: number): SquareCommentDTO[] {
  return loadComments()
    .filter(item => item.feedId === feedId)
    .sort((a, b) => b.id - a.id)
}

/** `POST /api/square/feed/:id/comments` —— 写入评论并同步帖子 commentCount */
export function createComment(
  feedId: number,
  input: SquareCommentCreateDTO,
): SquareCommentDTO | undefined {
  const feed = findFeed(feedId)
  if (!feed) return undefined

  const comments = loadComments()
  const nextId = comments.reduce((max, item) => Math.max(max, item.id), 0) + 1

  const comment: SquareCommentDTO = {
    id: nextId,
    feedId,
    parentId: input.parentId,
    author: '王同学',
    isAnonymous: false,
    content: input.content,
    likes: 0,
    liked: false,
    createdAt: '刚刚',
  }

  persistComments([comment, ...comments])

  // 帖子上的评论数同步 +1
  const feedList = loadFeed()
  const target = feedList.find(item => item.id === feedId)
  if (target) {
    target.commentCount += 1
    persistFeed(feedList)
  }

  return comment
}

/** `POST /api/square/comments/:id/like` —— 切换点赞并持久化 */
export function toggleCommentLike(id: number): SquareCommentLikeDTO | undefined {
  const list = loadComments()
  const target = list.find(item => item.id === id)
  if (!target) return undefined

  target.liked = !target.liked
  target.likes = Math.max(0, target.likes + (target.liked ? 1 : -1))
  persistComments(list)

  return { id: target.id, liked: target.liked, likes: target.likes }
}
