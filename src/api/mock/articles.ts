// 文章共享数据（TS 版，供 ArticleCenter / ArticleList / ArticleDetail 使用）
export interface ArticleItem {
  id: number
  title: string
  summary: string
  content: string
  category: string
  categoryLabel: string
  author: string
  authorTitle: string
  date: string
  views: number
  readTime: string
  image?: string
  featured: boolean
}

export interface ArticleCategory {
  label: string
  key: string
}

export const categories: ArticleCategory[] = [
  { label: '精选推荐', key: 'all' },
  { label: '每日精选', key: 'daily' },
  { label: '专题报道', key: 'featured' },
  { label: '心理科普', key: 'psychology' },
  { label: '生涯导航', key: 'career' },
  { label: '成长故事', key: 'stories' }
]

export const categoryLabel = (key: string): string => {
  const c = categories.find(c => c.key === key)
  return c ? c.label : key
}

export const articles: ArticleItem[] = [
  {
    id: 1,
    title: '在不确定的时代，如何建立内心的秩序？',
    summary: '探索如何在纷乱的外界环境中，通过心理学的工具与自省，找回属于自己的节奏与宁静。在这个快速变化的时代，内心的安定是我们最宝贵的资产。',
    content: `
      <p>在这个信息爆炸、变化迅速的时代，我们常常感到焦虑、迷茫和无助。外部环境的不确定性似乎正在侵蚀我们内心的宁静。</p>
      <h3>1. 认清焦虑的本质</h3>
      <p>焦虑往往源于对未来的失控感。当我们试图掌控那些无法掌控的事情时，焦虑就会随之而来。心理学上有一个概念叫做"控制点"——内控型的人相信自己的行为能影响结果，外控型的人则认为结果由外部力量决定。研究表明，倾向于内控的人在面对不确定性时，焦虑水平明显更低。</p>
      <p>这并非要求我们盲目乐观，而是提醒自己：把注意力放回自己能掌控的范围。你无法决定明天会发生什么，但可以决定今晚几点入睡、明天读什么书、给谁打一个电话。</p>
      <h3>2. 建立微小的秩序</h3>
      <p>从整理房间、规律作息开始。这些看似微不足道的小事，实际上是在向我们的大脑传递一个信号：我依然拥有掌控生活的能力。心理学家威廉·詹姆斯曾说，行为塑造情绪。当你整理好一张书桌，你的内心也会随之被整理。</p>
      <p>试着为自己设定三个"微小而确定"的日常仪式：清晨的一杯水、午后的十分钟散步、睡前的三行日记。它们将成为你在风浪中的锚点。</p>
      <h3>3. 练习正念与冥想</h3>
      <p>关注当下，而不是过去或未来。通过呼吸练习，我们可以快速将思绪拉回此时此刻。正念并不是要消除杂念，而是学会观察它们而不被裹挟。</p>
      <p>从一个简单的练习开始：闭上眼睛，感受呼吸的进出，持续五分钟。当思绪飘走时，温柔地将它带回。每一次"带回"，都是对专注力的一次锻炼。</p>
      <h3>4. 与他人建立真实的连接</h3>
      <p>孤独会放大不确定性带来的焦虑。找到你可以坦诚对话的人——不必是心理咨询师，可以是朋友、家人，或是一个同频的社群。表达本身就是一种疗愈。</p>
      <p>内心的秩序不是一蹴而就的，它需要我们在每一个日常里，反复练习回到自己的能力。愿你在纷乱的世界里，依然能听见自己内心的声音。</p>
    `,
    category: 'psychology',
    categoryLabel: '心理科普',
    author: '陈默老师',
    authorTitle: '资深心理咨询师',
    date: '2026-01-05',
    views: 4520,
    readTime: '12 min',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
    featured: true
  },
  {
    id: 2,
    title: 'MBTI 16种人格类型详解：找到你的职业天赋',
    summary: '深入了解每种人格类型的核心特征、优势与挑战，找到最适合自己的职业发展方向。',
    content: `
      <p>MBTI（Myers-Briggs Type Indicator）是一种广泛应用的人格测评工具，它基于荣格的心理类型理论，将人格分为四个维度，组合出16种类型。每一种类型都有其独特的认知方式、决策风格与职业倾向。</p>
      <h3>四个维度，看见自己</h3>
      <p>第一个维度是能量方向：外向（E）与内向（I）。外向者从外界获取能量，内向者则在独处中充电。第二个维度是信息收集：感觉（S）与直觉（N），前者关注具体细节，后者善于捕捉可能性。</p>
      <p>第三个维度是决策方式：思考（T）与情感（F）。思考型重视逻辑与公平，情感型则更看重关系与和谐。第四个维度是生活方式：判断（J）与感知（P），前者喜欢计划与秩序，后者则更灵活开放。</p>
      <h3>不同类型的职业天赋</h3>
      <p>INTJ 常被称为"建筑师"，他们擅长战略思考，适合从事分析、规划类工作。ENFP 则是"竞选者"，充满热情与创造力，在创意、传播领域如鱼得水。没有哪种类型更好，只有更适合的场景。</p>
      <p>了解自己的类型，不是为了被标签定义，而是为了更好地认识自己的优势与盲区，从而做出更明智的选择。</p>
    `,
    category: 'career',
    categoryLabel: '生涯导航',
    author: '王悦',
    authorTitle: '职业规划专家',
    date: '2026-01-04',
    views: 3420,
    readTime: '15 min',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    featured: true
  },
  {
    id: 3,
    title: '从迷茫到坚定：我的跨专业保研之路',
    summary: '一个真实的学生成长故事，记录了如何在困惑中寻找方向，并最终实现梦想的心路历程。',
    content: `
      <p>大二那年，我开始思考自己的未来。虽然现在的专业很稳妥，但我内心始终渴望做一些更贴近人心的事情。那段时间，我常常在深夜里问自己：我到底想要什么样的生活？</p>
      <h3>迷茫，是成长的开始</h3>
      <p>迷茫不可怕，可怕的是逃避迷茫。我开始旁听心理学的课程，读相关的书，主动找老师聊天。每一次探索都让我更清楚地看见自己——看见自己真正在意的是什么。</p>
      <h3>行动，是最好的解药</h3>
      <p>大三上学期，我决定跨专业保研到心理学方向。这意味着我要在半年内补完大量基础课，还要准备材料、联系导师。那是我大学生活里最累也最充实的一段时光。</p>
      <p>最终收到录取通知的那一刻，我没有想象中那么激动。因为我知道，真正让我成长的，不是那个结果，而是那个全力以赴的过程。愿每一个迷茫中的你，都能勇敢迈出第一步。</p>
    `,
    category: 'stories',
    categoryLabel: '成长故事',
    author: '李华',
    authorTitle: '优秀学长',
    date: '2026-01-03',
    views: 890,
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
    featured: false
  },
  {
    id: 4,
    title: '大学生如何高效管理自己的时间？',
    summary: '时间管理不是要把每一分钟都填满，而是要学会有序地安排优先级，提升学习效率。',
    content: `
      <p>你是否经常感到时间不够用？明明忙了一整天，却发现重要的工作一点没动。问题不在于你不够努力，而在于你缺少一套科学的时间管理方法。</p>
      <h3>艾森豪威尔矩阵：分清轻重缓急</h3>
      <p>把任务按照"重要"与"紧急"两个维度分为四类：重要且紧急、重要不紧急、紧急不重要、不紧急不重要。真正高效的人，会把大部分精力放在"重要不紧急"的事上——因为那才是决定长期成长的关键。</p>
      <h3>番茄工作法：专注的力量</h3>
      <p>设定25分钟的专注时间，期间不查看手机、不回复消息，然后休息5分钟。四个番茄钟后休息长一些。这个简单的方法能显著提升你的专注度与产出。</p>
      <h3>留白，是更高阶的效率</h3>
      <p>不要把日程排得太满。给自己留出思考、休息和应对突发事件的时间。时间管理的终极目标不是做更多的事，而是做更对的事。</p>
    `,
    category: 'career',
    categoryLabel: '生涯导航',
    author: '周琳',
    authorTitle: '效率管理专家',
    date: '2026-01-02',
    views: 2100,
    readTime: '12 min',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800',
    featured: false
  },
  {
    id: 5,
    title: '深夜食堂：那些藏在文字里的温暖',
    summary: '文学不仅仅是纸上的墨迹，更是孤独灵魂的避风港。让我们一起走进那些治愈系的文学作品。',
    content: `
      <p>文字是有温度的。当你在深夜感到孤独时，翻开一本书，那些字句就像一双温柔的手，轻轻握住你。文学从来不只是消遣，它是一种陪伴，一种疗愈。</p>
      <h3>在故事里，看见自己</h3>
      <p>读《小王子》，我们看见纯真如何被世故侵蚀，又如何被爱重新唤醒。读《人间失格》，我们触碰到一个灵魂最深处的脆弱与渴望。每一本好书，都是一面镜子。</p>
      <h3>文字如何治愈我们</h3>
      <p>心理学研究发现，阅读文学作品能显著提升我们的共情能力。当我们走进一个角色的内心，我们也在练习理解他人、理解自己。这种"叙事疗法"已被广泛应用于心理辅导。</p>
      <p>今晚，不妨放下手机，给自己半小时的阅读时光。让文字带你去一个更广阔、更温柔的世界。</p>
    `,
    category: 'daily',
    categoryLabel: '每日精选',
    author: '苏小北',
    authorTitle: '专栏作家',
    date: '2026-01-01',
    views: 1560,
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800',
    featured: true
  },
  {
    id: 6,
    title: '认知觉醒：如何开启自我驱动的进化？',
    summary: '通过理解大脑的运作机制，打破固有的思维枷锁，实现从被动学习到主动进化的跨越。',
    content: `
      <p>为什么我们总是习惯性拖延？为什么注意力难以集中？答案可能藏在我们的进化基因里。理解大脑的运作机制，是开启自我驱动的第一步。</p>
      <h3>三重脑：本能、情绪与理性</h3>
      <p>神经科学家保罗·麦克林提出"三重脑"模型：爬行脑负责本能生存，边缘系统处理情绪，新皮层负责理性思考。当我们感到焦虑时，往往是爬行脑在主导。要做出理性决策，需要让新皮层重新掌权。</p>
      <h3>多巴胺与习惯回路</h3>
      <p>每一个习惯都由"提示—行为—奖励"构成。刷短视频之所以让人上瘾，是因为它提供了即时、密集的多巴胺奖励。要改变坏习惯，不是靠意志力对抗，而是重新设计习惯回路。</p>
      <h3>从被动到主动的觉醒</h3>
      <p>真正的成长，发生在你开始觉察自己的思维过程的那一刻。当你能观察自己的情绪而不被它控制，你就已经迈出了觉醒的第一步。</p>
    `,
    category: 'psychology',
    categoryLabel: '心理科普',
    author: '阿何',
    authorTitle: '知名博主',
    date: '2025-12-30',
    views: 5600,
    readTime: '18 min',
    image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&q=80&w=800',
    featured: true
  },
  {
    id: 7,
    title: '面试避坑指南：HR最看重的五个特质',
    summary: '在面试中，除了专业技能，你的沟通能力、抗压能力和学习潜力同样关键。',
    content: `
      <p>很多同学在面试时只关注技术细节，却忽视了软实力的展现。作为多年面试官，我想告诉你：决定你是否被录用的，往往不是你会做什么，而是你是一个怎样的人。</p>
      <h3>1. 沟通的清晰度</h3>
      <p>能否把一个复杂的问题讲得简单明了，是衡量沟通能力的核心。回答问题时，先讲结论，再讲理由，最后给例子。这个"金字塔"结构能让你的表达更有逻辑。</p>
      <h3>2. 抗压能力</h3>
      <p>面试官会故意问一些尖锐的问题，观察你的反应。遇到难题时，不要慌张，可以先思考几秒，再坦诚表达你的思路。承认不知道，比胡编乱造要好得多。</p>
      <h3>3. 学习潜力</h3>
      <p>比起你现在会什么，面试官更在意你未来能学会什么。展示你过去主动学习的经历，会比堆砌技能更有说服力。</p>
      <h3>4. 团队协作意识</h3>
      <p>用"我们"而非"我"来描述成就，体现你的协作意识。同时也要诚实地说出你在团队中遇到过的冲突，以及你是如何处理的。</p>
      <h3>5. 真实与真诚</h3>
      <p>最打动人的，永远是真诚。不要试图扮演一个"完美候选人"，展示真实的自己，包括你的热情与不足。</p>
    `,
    category: 'career',
    categoryLabel: '生涯导航',
    author: '李经理',
    authorTitle: '大厂HRBP',
    date: '2025-12-28',
    views: 2800,
    readTime: '9 min',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
    featured: false
  },
  {
    id: 8,
    title: '被讨厌的勇气：阿德勒心理学带给我的改变',
    summary: '每个人都想获得他人的认可，但过度在意他人的评价只会让你失去自由。',
    content: `
      <p>阿德勒心理学告诉我们，所有的烦恼都来自人际关系。当我们过度在意他人的评价，我们就交出了自己人生的主导权。</p>
      <h3>课题分离：分清这是谁的事</h3>
      <p>阿德勒提出"课题分离"——一件事的结果由谁承担，就是谁的课题。你努力工作是自己的课题，别人如何评价你是他人的课题。我们只能为自己的课题负责，无法也无需干涉他人的课题。</p>
      <h3>目的论，而非原因论</h3>
      <p>我们常以为是过去的经历决定了现在的自己。但阿德勒认为，是我们"现在的目的"决定了我们如何使用过去的经历。你选择焦虑，可能是因为焦虑能让你逃避某些挑战。</p>
      <h3>被讨厌的勇气</h3>
      <p>真正的自由，是有被讨厌的勇气。这不是鼓励你做一个讨人厌的人，而是说：不要为了不被讨厌而委屈自己。当你不再依赖他人的认可，你才真正属于自己。</p>
    `,
    category: 'psychology',
    categoryLabel: '心理科普',
    author: '哲学家',
    authorTitle: '特约作者',
    date: '2025-12-25',
    views: 4200,
    readTime: '14 min',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    featured: false
  },
  {
    id: 9,
    title: '创业日记：在车库里诞生的梦想',
    summary: '一个关于坚持、失败与重生的故事，献给每一个正在路上的创业者。',
    content: `
      <p>那是2020年的春天，我们三个人挤在一个不足十平米的车库里，盯着一块白板讨论产品方向。没有融资，没有用户，只有一腔热血和一台旧电脑。</p>
      <h3>第一次失败</h3>
      <p>我们的第一个产品做的是校园二手交易，上线三个月只有不到一百个用户。我们复盘后发现，问题不在产品本身，而在于我们根本没搞清楚用户真正需要什么。</p>
      <h3> Pivot 的勇气</h3>
      <p>我们决定转型，做一个更小的工具——课程表同步。这个决定很痛苦，因为它意味着推翻之前的全部努力。但正是这次转型，让我们找到了真正的市场。</p>
      <h3>给创业者的三句话</h3>
      <p>第一，不要爱上你的方案，要爱上你的问题。第二，最快的学习方式是发布。第三，活下去，比什么都重要。献给每一个正在路上的你。</p>
    `,
    category: 'stories',
    categoryLabel: '成长故事',
    author: '小明',
    authorTitle: '连续创业者',
    date: '2025-12-20',
    views: 1100,
    readTime: '20 min',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
    featured: false
  },
  {
    id: 10,
    title: '极简主义生活：少即是多',
    summary: '当我们开始清理物理空间时，内心也随之变得清晰。',
    content: `
      <p>极简主义不代表苦行，而是一种对生活的主动选择。它让我们从"拥有更多"的执念中解放出来，专注于真正重要的事。</p>
      <h3>从物品开始</h3>
      <p>把家里所有的物品摊开，问自己两个问题：它对我有用吗？它让我快乐吗？如果两个答案都是否定的，就放手。你会惊讶地发现，我们真正需要的东西其实很少。</p>
      <h3>清理数字空间</h3>
      <p>取消订阅不需要的邮件列表，删除半年没打开过的App，整理桌面的文件。数字空间的清爽，同样能带来内心的宁静。</p>
      <h3>留白，是一种丰盛</h3>
      <p>极简的终极目的，是为重要的事留出空间——为阅读、为思考、为与爱的人相处。少即是多，因为剩下的，都是你真正珍视的。</p>
    `,
    category: 'daily',
    categoryLabel: '每日精选',
    author: '林溪',
    authorTitle: '生活方式博主',
    date: '2025-12-15',
    views: 3100,
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=800',
    featured: false
  }
]

export const getArticleById = (id: string | number | string[]): ArticleItem | null => {
  const numId = Number(id)
  return articles.find(a => a.id === numId) || null
}

export const getRelatedArticles = (article: ArticleItem | null, limit = 3): ArticleItem[] => {
  if (!article) return []
  return articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, limit)
    .concat(
      articles.filter(a => a.id !== article.id && a.category !== article.category).slice(0, limit)
    )
    .slice(0, limit)
}
