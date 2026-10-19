import type { AiChatMessage, AiChatStreamOptions } from '../ai'

/**
 * AI 心理支持话术引擎（本地 mock 兜底）。
 *
 * 与 streamAiChat 契约一致：逐字打字机流式推送；
 * 内置危机关键词干预（自伤/自杀倾向 → 心理援助热线提示）。
 * 注意：mock 话术仅供演示，不能替代专业心理咨询。
 */

/** 危机关键词：命中立即返回热线干预话术（优先级最高） */
const CRISIS_KEYWORDS = [
  '自杀', '轻生', '不想活', '活不下去', '想死', '结束生命', '了结自己',
  '自残', '割腕', '伤害自己'
]

/** 危机干预话术（心理平台合规要点：先共情，再给可执行的求助通道） */
const CRISIS_REPLY = [
  '听到你说这些，我很担心你，也谢谢你的信任。此刻的痛苦是真实的，但请相信，它不是永恒的，你也不必独自扛着。',
  '请尽快联系以下专业援助：',
  '· 全国统一心理援助热线：12356（24小时）',
  '· 希望24热线：400-161-9995',
  '· 紧急情况请直接拨打 110 / 120',
  '同时，请尽量告诉一位你信任的人——家人、老师或朋友，让他们此刻陪在你身边。等你愿意的时候，随时回来和我聊聊。'
].join('\n')

/** 话题规则：关键词 → 共情回应池 */
interface TopicRule {
  keywords: readonly string[]
  replies: readonly string[]
}

const TOPIC_RULES: readonly TopicRule[] = [
  {
    // 焦虑 / 紧张
    keywords: ['焦虑', '紧张', '心慌', '不安', '烦躁'],
    replies: [
      '听起来最近有件事让你一直悬着心。焦虑其实是身体在提醒你「这件事对你很重要」——它不说明你脆弱。可以先试试「4-7-8 呼吸」：吸气 4 秒、屏息 7 秒、呼气 8 秒，重复三轮。方便和我说说，是什么让你这么紧张吗？',
      '我能感受到你心里那股挥之不去的不安。试着把它写下来：担心的事、最坏的结果、你能做的准备。很多同学发现，写出来的恐惧会比脑子里盘旋时小一圈。你愿意说说具体在担心什么吗？'
    ]
  },
  {
    // 情绪低落
    keywords: ['抑郁', '难过', '伤心', '低落', '郁闷', '不开心', '委屈', '想哭', '崩溃'],
    replies: [
      '谢谢你愿意说出来，难过的时候开口并不容易。情绪低落不是矫情，就像感冒一样常见。今天有没有一件很小的事，曾让你稍微松了口气？哪怕只是晒到太阳、吃到喜欢的东西。我们可以从这些微小的光亮聊起。',
      '听起来你把很多情绪都压在心里了，这很消耗人。不必急着「好起来」，先允许自己难过一会儿。如果这种状态持续了两周以上，我建议你预约学校的心理老师聊聊——那不是「有问题」，而是对自己负责。'
    ]
  },
  {
    // 学业压力
    keywords: ['压力', '考试', '挂科', '绩点', '考研', '内卷', '学习', '作业', '复习'],
    replies: [
      '学业压力像背着一座山赶路，走不动不是你的错，可能是包里装了太多东西。试着把任务拆成 25 分钟一个的小块（番茄工作法），每完成一块就划掉——掌控感是压力最好的解药。眼下最让你喘不过气的是哪一项？',
      '我听到了那种「怎么努力都不够」的疲惫。想提醒你：成绩衡量的是某个阶段的准备程度，不是你这个人的价值。给自己一点喘息的空间，也考虑和辅导员或心理老师聊聊，他们见过很多类似处境，会有具体办法。'
    ]
  },
  {
    // 睡眠困扰
    keywords: ['失眠', '睡不着', '熬夜', '多梦', '睡眠'],
    replies: [
      '睡不好会让第二天的一切都加倍困难，很心疼你的状态。睡前一小时试着离开手机，把房间灯光调暗，让身体知道「该休息了」；躺下 20 分钟还睡不着就起来做点单调的事，有困意再回床。这种「睡不着」持续多久了？',
      '失眠常常是白天压力的「夜间回放」。可以试试「担忧记事本」：睡前把明天要做的事和担心的事写在纸上，告诉大脑「已经安顿好了」。如果每周失眠超过三次且持续一个月，建议去校医院或心理中心做个评估。'
    ]
  },
  {
    // 人际关系
    keywords: ['人际', '室友', '同学', '朋友', '吵架', '矛盾', '孤独', '孤单', '孤立', '排挤'],
    replies: [
      '关系里的摩擦特别磨人，尤其是每天抬头不见低头见的室友。感受本身没有对错，重要的是怎么说出来——试试「非暴力表达」：说事实、说感受、说请求，比如「晚上 12 点还在打游戏，我睡不着很疲惫，11 点后能戴耳机吗」。你们之间最近发生了什么？',
      '孤独的感觉真的很难熬，但请知道：感到孤独不代表你不值得被喜欢，很多时候只是还没遇到同频的人。可以从小的连接开始——社团、自习搭子、一句「一起吃饭吗」。这段时间，有让你觉得还算放松的场合吗？'
    ]
  },
  {
    // 家庭议题
    keywords: ['父母', '家里', '家庭', '爸妈', '家长', '催婚'],
    replies: [
      '和家人的矛盾常常最深地戳中我们，因为那是我们最渴望被理解的地方。父母的表达方式也许笨拙，但你可以试着在平静的时候说出真实感受：「你们这样说，我会觉得不被信任」。感觉家里最让你难以承受的是什么？',
      '听起来你在家庭里承受了不少，甚至可能是替别人消化情绪的那个人。请记住：孝顺不等于无条件顺从，你也可以有边界。如果家庭议题长期困扰你，心理咨询中针对家庭议题的访谈会很有帮助。'
    ]
  },
  {
    // 恋爱情感
    keywords: ['恋爱', '分手', '感情', '失恋', '表白', '暗恋'],
    replies: [
      '感情的痛是很真实的痛——研究发现失恋激活的脑区与身体疼痛部分重叠。允许自己悲伤，不需要「立刻放下」。也可以把这段经历当作认识自己的机会：我在关系里最在意的是什么？你的感受是怎样的？',
      '喜欢一个人时的患得患失，或者关系结束后的空落，都是认真的心的证明。想提醒你：无论关系多亲密，你的价值不由对方的态度定义。愿意和我说说你们的故事吗？'
    ]
  },
  {
    // 生涯迷茫
    keywords: ['迷茫', '就业', '找工作', '未来', '职业', '规划', '实习', '毕业'],
    replies: [
      '站在岔路口的迷茫，恰恰说明你在认真思考自己的人生，这本身就是成熟的标志。不必要求现在就想清楚「一辈子」，先缩小范围：排除掉确定不想要的，剩下的用「小成本试错」逐个体验——一次访谈、一段实习。目前更倾向哪个方向？',
      '「不知道未来要做什么」是很多同学共同的处境，你不是一个人。生涯规划不是一次性选定，而是持续校准的过程。推荐去测评中心做一次职业兴趣测评（如 RIASEC），也许能给你一些新的线索。'
    ]
  },
  {
    // 自我否定
    keywords: ['自卑', '不自信', '讨厌自己', '没用', '失败', '比不上', '自我怀疑'],
    replies: [
      '能问出「我是不是很失败」，说明你对自己有很高的期待。但请留意，你脑海里那个批评自己的声音，往往比任何外人都苛刻。试着换成对朋友说话的语气，对自己说一遍。最近有什么事让你对自己不满意了吗？',
      '比较是偷走快乐的贼。你看到的是别人的高光时刻，对比的却是自己的幕后花絮。你身上一定有别人羡慕的东西，只是你习以为常了。说说看，有没有人曾经真诚地感谢过你？'
    ]
  }
]

/** 客服兜底（未命中话题时，共情 + 引导平台资源） */
const ASSISTANT_FALLBACKS = [
  '我在的，随时可以和你聊。你可以和我说说最近的困扰，也可以问我平台能帮上什么：测评中心可以帮你科学了解自己的状态，心理咨询板块支持预约学校心理老师，时光胶囊和文章板块也有很多温暖的内容。最近过得怎么样？',
  '谢谢你和我聊天。如果愿意，可以说说此刻的心情；如果你在为具体的事情犯难——学业、人际、情绪——我也很乐意听。想预约专业心理老师的话，在心理咨询板块一键就能完成。'
]

/** 咨询师兜底（更偏共情探索） */
const COUNSELOR_FALLBACKS = [
  '嗯，我在听。这里是一个安全的空间，你可以按自己的节奏说，说什么都可以。此刻最占据你心思的，是什么？',
  '谢谢你愿意向我敞开。在我们开始之前想让你知道：这里说的每一句话我都会认真对待。最近这段时间，你的睡眠和胃口还好吗？',
  '我能感觉到，你带着一些重量来到这里。不必急着给出「标准答案」，我们先从感受开始——这一周里，有没有哪个瞬间让你印象很深？'
]

/** 伴侣兜底（更偏日常陪伴，语气更轻更暖） */
const COMPANION_FALLBACKS = [
  '我在呢，今天过得怎么样呀？不用组织语言，想到什么就说什么——开心的、烦心的、或者只是碎碎念，我都想听。',
  '嗯嗯，我陪着你。天大的事也可以先放一放，我们先聊点轻松的：今天有好好吃饭吗？有没有什么小确幸，哪怕只是一杯好喝的奶茶？',
  '不管你说什么，我都在这里，哪儿也不去。累的时候就靠一靠，把肩膀借你。想聊聊今天的事，还是就想安静地待一会儿？'
]

/** 人设 → 兜底话术池 */
const PERSONA_FALLBACKS = {
  assistant: ASSISTANT_FALLBACKS,
  counselor: COUNSELOR_FALLBACKS,
  companion: COMPANION_FALLBACKS
} as const

const TYPE_DELAY_MS = 26      // 打字机节奏（毫秒/帧）
const CHUNK_SIZE = 2          // 每帧推送的字符数
const THINKING_DELAY_MS = 420 // 首帧前的「思考」停顿

/** mock 流式回复：与 streamAiChat 契约一致（onDelta 逐段推送，resolve 完整文本） */
export async function streamMockAiReply(
  messages: readonly AiChatMessage[],
  options: AiChatStreamOptions = {}
): Promise<string> {
  await sleep(THINKING_DELAY_MS)
  return typeOut(pickReply(messages, options.persona), options)
}

/** 依据最后一条用户消息选择话术：危机干预 > 话题匹配 > 人设兜底 */
function pickReply(messages: readonly AiChatMessage[], persona: AiChatStreamOptions['persona']): string {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  if (CRISIS_KEYWORDS.some(keyword => lastUser.includes(keyword))) return CRISIS_REPLY
  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some(keyword => lastUser.includes(keyword))) return pick(rule.replies)
  }
  return pick(PERSONA_FALLBACKS[persona ?? 'assistant'])
}

function pick(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 打字机推送：每帧 2 字符，期间随时响应中断 */
async function typeOut(text: string, { signal, onDelta }: AiChatStreamOptions): Promise<string> {
  if (signal?.aborted) throw abortError()
  for (let sent = 0; sent < text.length;) {
    if (signal?.aborted) throw abortError()
    const chunk = text.slice(sent, sent + CHUNK_SIZE)
    sent += chunk.length
    onDelta?.(chunk)
    await sleep(TYPE_DELAY_MS)
  }
  return text
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function abortError(): DOMException {
  return new DOMException('AI 回复已中断', 'AbortError')
}
