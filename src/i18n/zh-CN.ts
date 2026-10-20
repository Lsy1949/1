/* i18n 文案（简体中文）—— 全量迁移自 Vue 版 locales/zh-CN.ts，键名结构为各批次共用契约 */

export default {
  nav: {
    brand: '生涯心旅',
    menu: {
      evaluation: '测评中心',
      articles: '文章资讯',
      activities: '活动中心',
      counseling: '心理咨询'
    },
    group: {
      mentalScales: '心理量表',
      careerScales: '职业量表',
      hotPicks: '热门推荐',
      browseByCategory: '分类浏览',
      featuredActivities: '特色活动',
      professionalService: '专业服务',
      aiColumn: 'AI 专栏',
      counselingSupport: '咨询辅助'
    },
    item: {
      phq9: '抑郁自评 (PHQ-9)',
      gad7: '焦虑自评 (GAD-7)',
      pss: '压力感量表 (PSS)',
      riasec: '霍兰德兴趣 (RIASEC)',
      mbti: '性格测试 (MBTI)',
      daily: '每日精选',
      featured: '专题报道',
      articleList: '全部文章',
      psychology: '心理健康',
      career: '生涯导航',
      stories: '成长故事',
      timeCapsule: '时光胶囊',
      square: '交流广场',
      booking: '预约咨询',
      aiConsult: 'AI 咨询师',
      aiCompanion: 'AI 伴侣',
      consultants: '咨询师简介',
      notice: '咨询须知',
      faq: '常见问题'
    },
    search: '搜索',
    theme: { light: '浅色', dark: '深色', auto: '跟随系统' },
    user: { login: '登录', guest: '游客', profile: '个人中心', settings: '账号设置', logout: '退出登录' },
    mobile: { menuTitle: '菜单导航', enterCenter: '进入测评中心首页', appearance: '外观主题', language: '语言设置' }
  },
  common: {
    back: '返回', confirm: '确认', cancel: '取消', submit: '提交', save: '保存',
    delete: '删除', edit: '编辑', view: '查看', loading: '加载中...', noData: '暂无数据',
    loadFailed: '加载失败', retry: '重试',
    deleteConfirm: '确定要删除吗？删除后无法恢复。',
    deleteTitle: '删除确认', deleteOk: '确定删除',
    searchPlaceholder: '搜索…',
    optional: '选填', required: '带 * 为必填',
    detail: '详情', close: '关闭', all: '全部'
  },
  home: {
    carousel: {
      exploreTag: '探索发现',
      learnMore: '了解详情',
      scrollDown: 'Scroll Down',
      preparing: '准备：{text}',
      slide1: { title: '专业心理健康服务', tag: '心灵呵护', desc: '我们提供专业的心理健康服务，帮助您解决情绪困扰、人际关系、压力管理等问题', btn: '了解更多' },
      slide2: { title: '丰富多彩活动中心', tag: '精彩体验', desc: '参与心理沙龙、讲座与团辅活动，在互动中探索自我，在交流中收获成长', btn: '查看活动' },
      slide3: { title: '智能匹配咨询师', tag: '智慧匹配', desc: '根据您的需求和偏好，智能匹配最适合的咨询师，提供个性化服务', btn: '立即匹配' }
    },
    marquee: { users: '10,000+ 服务用户', experts: '50+ 专家团队', satisfaction: '98% 满意度', aiPsych: 'AI + 心理学', support: '7×24h 在线支持', slogan: '阅读，看见更广阔的自己' },
    news: { badge: 'NEWS & UPDATES', title: '最新动态', subtitle: '洞察行业前沿，把握成长机遇', jumpTip: '正在跳转到文章中心',
      items: [
        { category: '平台更新', title: '生涯心旅推出全新 AI 心理评估系统', summary: '引入基于人工智能技术的心理评估系统，更精准地了解你的心理状态与需求。', date: '2026-01-04' },
        { category: '健康指南', title: '冬季心理健康指南：如何应对季节性情绪波动', summary: '实用的方法帮助你在寒冷季节里保持心理健康，走出季节性低落。', date: '2025-12-28' },
        { category: '服务报告', title: '线上心理咨询服务满意度调查结果公布', summary: '95% 的用户对我们的线上心理咨询服务表示满意，我们将继续努力提供优质服务。', date: '2025-12-20' },
        { category: '团队动态', title: '心理健康专家团队扩大：欢迎新成员加入', summary: '三位资深心理健康专家加入生涯心旅团队，提供更专业、多元化的心理支持。', date: '2025-12-15' }
      ]
    },
    about: {
      badge: 'ABOUT US',
      title1: '科技赋能', title2: '用心呵护每一份成长',
      p1: '生涯心旅致力于为用户提供专业的心理健康服务。我们结合人工智能大数据与专业心理学知识，构建精准的心理支持模型。',
      p2: '我们的使命是通过科技的力量，打破时间和空间的限制，让每个人都能享受高质量、个性化的心理健康服务。',
      statUsers: '服务用户', statExperts: '专家团队', statSatisfaction: '满意度', alt: '关于我们'
    },
    services: { badge: 'OUR SERVICES', title: '我们的服务', subtitle: '全方位的心理健康与生涯发展支持体系', learnMore: '了解详情',
      items: [
        { icon: 'DataAnalysis', title: '测评中心', desc: 'PHQ-9、GAD-7、MBTI 等权威量表，多维度科学认知真实的自我。' },
        { icon: 'ChatLineRound', title: '心理咨询', desc: '专业咨询师一对一服务，守护你的情绪与心理健康。' },
        { icon: 'Clock', title: '时光胶囊', desc: '记录此刻心路，与未来的自己对话，让成长有迹可循。' },
        { icon: 'Reading', title: '文章资讯', desc: '精选心理健康与生涯发展内容，阅读，看见更广阔的自己。' }
      ]
    },
    features: { badge: 'FEATURES', title: '平台特色功能', subtitle: '前沿科技驱动，助您更好成长',
      items: [
        { icon: 'DataAnalysis', title: '专业量表', desc: 'PHQ-9、GAD-7、MBTI 等权威量表，科学评估心理状态。' },
        { icon: 'Connection', title: '智能匹配', desc: '根据需求与偏好，智能匹配最适合的咨询师。' },
        { icon: 'Clock', title: '时光记录', desc: '时光胶囊记录成长心路，与未来开启对话。' },
        { icon: 'TrendCharts', title: '成长追踪', desc: '成长看板追踪测评轨迹与情绪趋势，可视化成长。' },
        { icon: 'ChatDotRound', title: '社区交流', desc: '交流广场与同路人分享心得，共同成长。' },
        { icon: 'Lock', title: '隐私保护', desc: '严格保护用户隐私，确保信息安全无虞。' }
      ]
    },
    contact: {
      title: '联系我们', desc: '无论是建议、反馈还是咨询，我们都乐意倾听。',
      phone: '电话', email: '邮箱', formTitle: '留言咨询',
      name: '姓名', namePlaceholder: '您的姓名',
      emailLabel: '邮箱', emailPlaceholder: '您的邮箱',
      message: '留言内容', messagePlaceholder: '请留下您的问题或建议',
      submit: '发送留言', submitSuccess: '留言提交成功！我们会尽快与您联系。'
    },
    nav: { quick: '快速导航', top: '首页', news: '最新动态', about: '关于我们', services: '我们的服务', features: '平台特色', contact: '联系我们' },
    validation: { nameRequired: '请输入您的姓名', emailRequired: '请输入邮箱地址', emailFormat: '请输入正确的邮箱地址', messageRequired: '请输入您的留言' },
    aiAssistant: {
      fab: 'AI 客服',
      title: 'AI 客服',
      subtitle: '你好，我是生涯心旅 AI 助手',
      greeting: '你好呀，我是生涯心旅的 AI 客服。平台的功能、心理小知识，或者你此刻的心情，都可以和我聊聊。有什么可以帮你的吗？',
      placeholder: '输入你想说的…',
      send: '发送',
      stop: '停止生成',
      restart: '清空重新开始',
      disclaimer: 'AI 回复由算法生成，仅供参考，不能替代专业心理咨询。紧急情况请拨打 12356。',
      quickPrompts: ['这个平台能做什么？', '最近压力有点大', '总是睡不好', '怎么预约心理老师？']
    }
  },
  assessment: {
    tabs: { scales: '测评广场', mine: '我的', dashboard: '成长看板' },
    cover: {
      scales: { title: '测评<em>广场</em>', desc: '多维度探索真实的自我 —— 心理健康、生涯发展、认知能力、电竞潜能' },
      mine: { title: '成长<em>探索者</em>', desc: '每一次测评，都是向内探索的旅程。' },
      dashboard: { title: '成长<em>看板</em>', desc: '追踪身心能量、情绪趋势与测评分布，AI 交叉分析为你生成专属成长洞察。' }
    },
    searchPlaceholder: '搜索测评…',
    categories: { all: '全部', mental: '心理健康', career: '生涯发展', cognitive: '认知能力', esports: '电竞能力', learning: '学习风格', social: '人际关系' },
    submitted: '测评已完成！',
    unit: { items: '项', questions: '题', score: '分', minutes: '分钟' },
    status: { completed: '已完成', comingSoon: '即将上线' },
    empty: '没有找到匹配的测评',
    disclaimer: '测评结果仅供个人探索参考，不具备临床医疗诊断效力。',
    comingSoonTip: '「{name}」即将上线，敬请期待',
    profile: {
      completed: '已完成', growthPoints: '成长积分', assessmentDays: '测评天数',
      badges: '已获勋章', growthLevel: '成长等级',
      joinedOn: '加入于 {date}', toNextLevel: '距下一级 {points} 积分',
      historyTitle: '测评历史', clearHistory: '清空记录', historyEmpty: '还没有测评记录，去完成第一个测评吧',
      goAssess: '去测评', viewDetails: '查看详情', retake: '重新测评',
      badgesTitle: '我的勋章', unlocked: '已解锁'
    },
    dashboard: {
      kpi: { total: '累计测评', points: '成长积分', avg: '平均得分', days: '活跃天数' },
      monthlyGoal: '本月成长目标',
      goalDesc: '目标 {target} 次测评，已完成 {done} 次，最爱维度：{dim}',
      quickEntry: '快速入口',
      radar: '身心能量雷达', radarTip: '蓝色为您的状态，灰色虚线为群体均值',
      yourStatus: '您的状态', groupAvg: '群体均值',
      moodTrend: '情绪趋势波动', range7: '近7天', range30: '近30天', rangeAll: '全部',
      high: '高', mid: '中', low: '低', avgLabel: '均值', noTrendData: '暂无趋势数据',
      typeDist: '测评类型分布', totalLabel: '总测评', distEmpty: '完成测评后查看分布',
      aiInsight: 'AI 交叉分析洞察', summary: '状态总结', strength: '核心优势', risk: '潜在风险', suggestion: '行动建议',
      aiEmpty: '完成至少 2 项不同维度的测评，AI 将为您揭示深层关联。',
      progress: '进步对比', recent: '最近：', improve: '改善', attention: '需关注', flat: '持平', up: '提升', down: '下降',
      progressEmpty: '同一量表完成2次以上可查看进步对比',
      recommend: '智能推荐', history: '历史足迹', filterScale: '筛选量表', exportCsv: '导出 CSV',
      col: { date: '测评日期', scale: '量表名称', score: '得分', conclusion: '结论', action: '操作' },
      detail: '详情', noHistory: '还没有完成任何测评'
    },
    dialog: {
      estimatedTime: '预计耗时', questionCount: '题目数量', reliability: '测评信度', reliabilityHigh: '高 (0.85+)',
      notice: '测评须知',
      tip1: '请在安静、不受干扰的环境下进行测评。',
      tip2: '请根据您近两周的真实情况和第一直觉作答。',
      tip3: '测评结果仅供自我探索参考，非临床诊断。',
      start: '进入沉浸式答题',
      completedOn: '测评完成于 {date}',
      deepAnalysis: '深度解析', actionSuggestion: '行动建议',
      mbtiDim: '维度倾向性', riasecDim: '六大维度得分',
      retake: '重新测评', saveReport: '保存报告', share: '分享',
      reportGenerated: '报告已生成并准备下载 (Mock)',
      shareCopied: '分享链接已复制到剪贴板 (Mock)'
    },
    history: {
      clearConfirm: '确定要清空所有测评记录吗？此操作不可恢复。',
      clearTitle: '提示', clearOk: '确定清空', cleared: '测评记录已清空',
      noExport: '暂无测评记录可导出', exported: '已导出测评记录',
      allScales: '全部量表',
      csvHeaders: { date: '测评日期', scale: '量表名称', score: '得分', level: '等级', title: '结果标题' }
    },
    action: { viewDetails: '查看详情', retake: '重新测评', goAssess: '去测评' }
  },
  counseling: {
    tabs: { booking: '预约咨询', counselors: '心理老师', notice: '咨询须知', faq: '常见问题', companion: 'AI 伴侣' },
    types: { individual: '个体咨询', couple: '伴侣咨询', family: '家庭咨询', group: '团体辅导' },
    aiChat: {
      eyebrow: '— AI Counselor',
      title: 'AI<em>咨询师</em>',
      desc: '随时在线的 AI 心理陪伴：倾听你的情绪，陪你梳理困扰。全天候可用，对话完全保密。',
      entryTitle: 'AI 咨询师 · 随时倾诉',
      entryDesc: '与 AI 心理咨询师对话，即时获得情绪陪伴与支持',
      greeting: '你好，我是这里的 AI 咨询师。这是一个安全、保密的空间，你可以按自己的节奏，聊聊最近的状态、情绪或困扰。我在听。',
      placeholder: '说说你最近的状态或困扰…',
      send: '发送',
      stop: '停止生成',
      disclaimer: 'AI 回复由算法生成，仅供情绪陪伴与自我探索参考，不能替代专业心理咨询或医疗诊断。若你正处于危机之中，请立即拨打心理援助热线 12356，或联系学校心理老师。',
      footnote: '想获得更深入的支持？',
      bookLink: '预约真人心理老师',
      quickPrompts: ['最近压力很大，喘不过气', '情绪低落，提不起劲', '和室友闹矛盾了', '对未来很迷茫']
    },
    companion: {
      eyebrow: '— AI Companion',
      title: 'AI<em>伴侣</em>',
      desc: '一个随时的树洞与陪伴：不评判、不说教，只是安静地听你说话，陪你度过每一个平常或难熬的日子。',
      greeting: '嗨，我在呢。今天过得怎么样？不管想聊什么——开心的、烦心的、或者只是随口碎碎念，我都陪着你。',
      placeholder: '随便说点什么，我都在…',
      send: '发送',
      stop: '停止生成',
      disclaimer: 'AI 回复由算法生成，仅供日常陪伴与自我探索参考，不能替代专业心理咨询或医疗诊断。若你正处于危机之中，请立即拨打心理援助热线 12356，或联系学校心理老师。',
      footnote: '想要更专业的心理支持？',
      bookLink: '预约真人心理老师',
      quickPrompts: ['今天有点累，想找人聊聊', '陪我聊聊最近的烦心事', '睡不着，陪我说说话', '给我一点放松的小建议']
    },
    cover: {
      booking: { eyebrow: '— Booking', title: '预约<em>咨询</em>', desc: '四步完成预约：选择类型 → 挑选老师 → 确定时间 → 填写信息。' },
      counselors: { eyebrow: '— Counselors', title: '心理<em>老师</em>', desc: '专业心理老师，覆盖情绪、关系、家庭、创伤等多个方向，找到最适合你的那一位。' },
      notice: { eyebrow: '— Guide', title: '咨询<em>须知</em>', desc: '了解咨询流程、保密原则、咨询准备、服务说明与取消改约规则，让咨询更顺畅。' },
      faq: { eyebrow: '— FAQ', title: '常见<em>问题</em>', desc: '关于心理咨询的常见疑问与解答，搜索或浏览分类，找到你想知道的。' }
    },
    step: { type: '咨询类型', counselor: '心理老师', time: '咨询时间', info: '个人信息' },
    btn: { confirmBooking: '确认预约', online: '视频', offline: '面对面', book: '预约', onlineConsult: '在线咨询', close: '关闭', bookThis: '预约此老师' },
    summary: { title: '预约摘要', type: '咨询类型', counselor: '心理老师', date: '日期', time: '时间', mode: '方式', serviceType: '服务性质', freeTag: '校内免费', onlineValue: '视频咨询', offlineValue: '面对面咨询', empty: '未选择' },
    myBookings: '我的预约',
    form: { name: '称呼', namePlaceholder: '如何称呼您', contact: '联系方式', contactPlaceholder: '手机号或邮箱', datePlaceholder: '选择咨询日期', description: '问题描述', descPlaceholder: '简单描述您想探讨的话题', optional: '选填', required: '带 * 为必填', first: '首次', followup: '复诊', experience: '咨询经历', agreePrefix: '我已阅读并同意', noticeLink: '《咨询须知》', and: '与', consentLink: '《知情同意书》' },
    validation: { nameRequired: '请填写称呼', contactRequired: '请填写联系方式', agreeRequired: '请阅读并同意相关条款', formIncomplete: '请完整填写必填信息', typeRequired: '请选择咨询类型', counselorRequired: '请选择心理老师', dateRequired: '请选择咨询日期', slotRequired: '请选择咨询时段' },
    message: { bookingSuccess: '预约提交成功！心理老师将在24小时内确认', cancelConfirm: '确定取消此预约吗？', cancelTitle: '提示', cancelled: '已取消预约' },
    counselors: {
      searchPlaceholder: '搜索姓名 / 专长', searchPlaceholderAlt: '搜索姓名 / 专长…',
      specialty: '专长', gender: '性别', male: '男', female: '女', sort: '排序',
      sortByRating: '评分优先', sortByExperience: '经验优先', sortBySessions: '咨询次数',
      count: '位', sessionsSuffix: '次咨询', yearsSuffix: '年经验', sessionsUnit: '次',
      filteredHint: '为您筛选擅长「{type}」的老师',
      empty: '没有找到匹配的心理老师',
      dialog: { intro: '专业介绍', specialties: '擅长领域', background: '受训背景', reviews: '来访者评价' }
    },
    section: { confidentiality: '保密原则', preparation: '咨询前后如何准备', service: '服务说明', cancellation: '取消与改约', process: '咨询流程' },
    process: {
      heroLabel: 'Process · 咨询流程',
      step1: { title: '提交预约', desc: '在线选择心理老师与时段' },
      step2: { title: '初步评估', desc: '首次访谈确认议题与目标' },
      step3: { title: '正式咨询', desc: '按节奏展开咨询，通常6-12次' },
      step4: { title: '结案回顾', desc: '回顾成长，规划后续' }
    },
    confidentiality: {
      warning: '例外情况：涉及自伤/伤人风险、未成年人受虐、法律强制要求时，心理老师有义务突破保密。',
      items: ['咨询内容、记录、测评结果严格保密', '未经同学书面同意，不向第三方透露任何信息', '所有咨询记录加密存储，仅心理老师本人可查阅', '督导讨论时会隐去同学身份信息', '咨询关系结束后，保密义务继续有效']
    },
    prep: { before: '咨询前', during: '咨询中', after: '咨询后',
      beforeItems: ['提前 5 分钟到达咨询室或登录视频房间', '简单梳理近期困扰和想探讨的话题', '保持开放、真诚的心态'],
      duringItems: ['按自己的节奏表达，不必勉强', '对心理老师的方法或反馈有疑问可以随时提出', '情绪波动属于正常过程'],
      afterItems: ['给自己一些安静时间消化', '记录咨询中获得的启发', '完成心理老师布置的"练习任务"']
    },
    service: {
      freeTitle: '本校心理辅导服务完全免费', freeDesc: '面向全体在校同学开放，不收取任何费用',
      firstWarning: '首次咨询通常为评估访谈，时长可能延长至 60-80 分钟，同样免费。',
      info: { target: '服务对象', targetValue: '全体在校同学', nature: '服务性质', natureValue: '学校免费心理辅导', duration: '单次时长', durationValue: '约 50 分钟', frequency: '建议频率', frequencyValue: '每周 1 次', format: '咨询形式', formatValue: '面对面 / 视频咨询', cycle: '预约周期', cycleValue: '可提前 7 天预约' }
    },
    cancellation: {
      items: ['提前 24 小时以上可在线取消或改约，无任何影响', '提前 12-24 小时取消，建议补约一次以保持连续性', '不足 12 小时或爽约将影响后续预约优先级', '因心理老师原因取消，将协助重新安排合适时段', '特殊情况（突发疾病、不可抗力）可说明情况申请豁免']
    },
    faq: {
      searchPlaceholder: '搜索问题关键词...',
      contactPrompt: '没有找到答案？', contactBtn: '在线咨询',
      categories: { all: '全部问题', booking: '预约相关', service: '服务说明', effect: '咨询效果', confidentiality: '保密相关' },
      empty: '没有找到相关问题'
    },
    booking: { cancelBtn: '取消', empty: '暂无预约记录', emptyHint: '暂无预约，去预约一位老师吧' },
    empty: { noCounselor: '没有找到匹配的老师', noBookings: '暂无预约记录', noFaq: '没有找到相关问题' },
    freeTag: '校内免费',
    weekdays: { sun: '周日', mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六' },
    timeSlots: { morning: '上午', afternoon: '下午', evening: '晚间' },
    bookingStatus: { pending: '待确认', confirmed: '已确认', completed: '已完成', cancelled: '已取消' }
  },
  article: {
    categories: { all: '精选推荐', daily: '每日精选', featured: '专题报道', psychology: '心理科普', career: '生涯导航', stories: '成长故事' },
    intro: {
      all: { title: '阅读，<em>看见</em><br>更广阔的自己', sub: '每日精选心理学深度文章、生涯导航与成长故事' },
      daily: { title: '每日精选', sub: '每日甄选的高质量内容，值得你花时间阅读' },
      featured: { title: '专题报道', sub: '深度专题报道，沉浸式阅读体验' },
      psychology: { title: '心理科普', sub: '探索心理学的奥秘，理解内心的运作机制' },
      career: { title: '生涯导航', sub: '指引你的职业方向与成长路径' },
      stories: { title: '成长故事', sub: '真实的故事，与你共鸣共成长' }
    },
    stats: { articles: '深度文章', categories: '主题分类', update: '每日更新', count: '篇内容' },
    search: '搜索你感兴趣的话题...',
    spotlight: { title: '今日焦点', sub: '为您甄选的最佳深度内容', read: '立即阅读' },
    grid: { all: '全部文章', viewAll: '查看全部' },
    collections: {
      title: '专题合集', sub: '沉浸式学习，深度掌握知识体系', viewAll: '查看全部', enter: '进入专题',
      countUnit: '篇精选',
      items: [
        { title: '新生适应指南', desc: '从校园到职场的无缝衔接，助你快速融入新环境。' },
        { title: '情绪调节手册', desc: '掌握心理学工具，在压力之下保持内心的平静与从容。' },
        { title: '高效学习方法', desc: '科学的学习策略，让你的认知效率实现质的飞跃。' },
        { title: '职场沟通艺术', desc: '在复杂的职场环境中，用沟通搭建信任与合作的桥梁。' }
      ]
    },
    empty: '暂无相关内容，换个词试试？',
    detail: {
      comments: {
        title: '评论',
        count: '{n} 条评论',
        placeholder: '写下你的想法...',
        submit: '发表评论',
        reply: '回复',
        empty: '还没有评论，来说点什么吧',
        like: '赞',
        liked: '已赞',
        anon: '匿名'
      }
    }
  },
  capsule: {
    list: {
      eyebrow: 'TIME CAPSULE · 时光档案',
      title: '我的<em>胶囊</em>',
      desc: '写给未来的信，在时间中等待开启',
      stats: { total: '总计', pending: '待开启', opened: '已开启', auditing: '审核中' },
      filter: { all: '全部', pending: '待开启', opened: '已开启' },
      countdown: '{days} 天后开启',
      status: { auditing: '审核中', rejected: '未通过', pending: '未开启', failed: '发送失败', opened: '已开启' },
      method: { email: '电子邮件', letter: '手写信' },
      delete: '删除',
      deleteConfirm: '确定要删除这个时光胶囊吗？删除后无法恢复。',
      deleteTitle: '删除确认', deleteOk: '确定删除', deleteCancelled: '取消', deleteSuccess: '删除成功',
      empty: { title: '档案<em>空白</em>', hint: '把此刻的心情封存，写给未来的自己', btn: '创建第一个胶囊' },
      fab: '新建胶囊'
    },
    create: {
      back: '返回广场',
      eyebrow: '— New Capsule',
      title: '新建<em>胶囊</em>',
      subtitle: '把此刻的心情，封存进时光胶囊',
      sections: { title: '胶囊标题', openDate: '开启时间', method: '开启方式', emailInfo: '邮件信息', letterInfo: '收件人信息', anonymous: '匿名发送', public: '公开到广场', content: '胶囊内容', photo: '添加照片', mood: '此刻心情' },
      placeholders: { title: '请输入标题', date: '选择开启日期', email: '收件人邮箱地址', name: '收件人姓名', phone: '收件人手机号', address: '详细地址（街道、门牌号等）', editor: '说些什么吧...' },
      hints: { dateRange: '注：最多支持设置 5 年后的时间', contentOptional: '（内容或图片至少一项）' },
      methods: { email: '电子邮件', letter: '手写信' },
      tips: { anonymous: '将不会知道胶囊是你发送的', public: '胶囊到期开启后，将分享到交流广场', commentOff: '已关闭评论', commentOn: '已开启评论', disableComment: '关闭评论' },
      photo: { add: '点击添加', upload: '点击上传照片（最多 6 张）', alt: '照片', maxWarning: '最多上传 6 张图片' },
      submit: '立即封存', submitting: '封存中...',
      validation: { title: '请输入胶囊标题', date: '请选择开启时间', content: '请添加内容或图片', email: '请输入收件人邮箱', emailFormat: '邮箱格式不正确', letterName: '请输入收件人姓名', letterPhone: '请输入收件人手机号', letterAddress: '请输入收件地址' },
      success: { title: '时光胶囊已封存', body: '封存成功！', desc: '我们已将您的心意妥善保存。请在 {date} 回来开启它。', btn: '回到广场' }
    },
    detail: {
      back: '返回广场',
      title: '胶囊<em>详情</em>',
      created: '创建于 {date}',
      remaining: '还有 {days} 天开启',
      opened: '已开启',
      info: { method: '开启方式', email: '收件邮箱', recipient: '收件人', phone: '联系电话', address: '收件地址', anonymous: '匿名状态' },
      methodValue: { email: '邮箱发送', letter: '信件邮寄' },
      anonymousValue: { yes: '匿名发送', no: '实名发送' },
      countdown: '还有 {days} 天',
      capsuleOpened: '胶囊已开启',
      actions: { rewrite: '再写一封', delete: '删除' },
      loading: '加载中...',
      previewAlt: '预览',
      deleteConfirm: '确定要删除这个时光胶囊吗？删除后无法恢复。',
      deleteTitle: '提示', deleteOk: '确定删除', deleteCancelled: '取消', deleteSuccess: '删除成功',
      dayUnit: '天'
    }
  },
  square: {
    list: {
      eyebrow: 'SQUARE · 交流广场',
      title: '交流<em>广场</em>',
      desc: '分享心理经历，看见彼此的成长',
      stats: { moments: '心得动态', capsules: '公开胶囊', interactions: '互动总数' },
      filter: { all: '全部', moment: '心得动态', capsule: '公开胶囊' },
      like: '点赞', comment: '评论', share: '分享',
      anonymous: '匿名同学',
      capsuleBadge: '时光胶囊',
      momentBadge: '心得动态',
      fab: '发布心得',
      hot: '热议',
      pinned: '置顶',
      community: {
        online: '人在线',
        todayNew: '今日新帖',
        emptyMembers: '暂无活跃同学',
        emptyTopics: '暂无热门话题',
        dailyPrompt: { label: '今日话题', question: '最近哪件小事，让你觉得生活还挺值得的？', join: '参与讨论' },
        sidebar: {
          activeMembers: '活跃同学',
          trending: '热门话题',
          guidelines: '社区公约',
          guidelinesItems: ['尊重每一位分享者', '不评判，多倾听', '鼓励比建议更有力量', '遇到困扰请预约咨询']
        }
      },
      empty: { title: '广场还很安静', hint: '成为第一个分享的人', btn: '发布心得' },
      emptyFiltered: '当前分类还没有动态，换个分类看看吧'
    },
    create: {
      back: '返回广场',
      eyebrow: '— New Post',
      title: '发布<em>心得</em>',
      subtitle: '把此刻的感悟，分享给同行的人',
      sections: { mood: '此刻心情', content: '心得内容', topic: '话题标签', photo: '添加照片', anonymous: '匿名发布', comment: '允许评论' },
      placeholders: { content: '说些什么吧...' },
      hints: { contentOptional: '（内容或图片至少一项）' },
      topicPlaceholder: '添加话题标签（回车确认，最多3个）',
      topicMaxTip: '最多添加 3 个话题',
      moods: { happy: '开心', excited: '兴奋', calm: '平静', sad: '低落', hopeful: '期待' },
      photo: { add: '点击添加', upload: '点击上传照片（最多 6 张）', alt: '照片', maxWarning: '最多上传 6 张图片' },
      submit: '立即发布', submitting: '发布中...',
      validation: { content: '请添加内容或图片' },
      success: { title: '发布成功', body: '你的心得已分享到广场', btn: '回到广场' }
    },
    detail: {
      back: '返回广场',
      title: '动态<em>详情</em>',
      createdAt: '发布于 {date}',
      anonymous: '匿名同学',
      like: '点赞', share: '分享',
      comments: {
        title: '评论',
        count: '{n} 条评论',
        placeholder: '写下你的想法...',
        submit: '发表评论',
        empty: '还没有评论，来抢沙发吧',
        reply: '回复',
        replyTo: '回复 {name}',
        repliedTo: '回复 @{name}',
        cancelReply: '取消',
        submitted: '评论已发布'
      }
    }
  },
  profile: {
    eyebrow: '个人中心',
    title: '我的<em>档案</em>',
    desc: '在这里管理你的个人信息、心理档案与活动记录，每一份成长都被妥善收藏。',
    hero: {
      editProfile: '编辑资料',
      viewStats: '查看统计',
      studentId: '学号',
      school: '学校',
      joinDate: '加入时间',
      bioEmpty: '这个人很懒，还没有写自我介绍'
    },
    card: {
      profile: {
        title: '基础资料',
        desc: '维护你的身份信息，方便在预约与咨询中使用。',
        name: '姓名',
        studentId: '学号',
        school: '所在学校',
        enrollYear: '入学年份',
        gender: '性别',
        genderMale: '男',
        genderFemale: '女',
        genderOther: '其他',
        major: '专业',
        grade: '年级',
        roleStudent: '学生',
        roleTeacher: '教师',
        roleAdmin: '管理员',
        save: '保存资料',
        saveSuccess: '个人资料已更新'
      },
      psychological: {
        title: '心理档案',
        desc: '记录你的性格类型与心理状态，帮助咨询师更好地了解你。',
        mbti: 'MBTI 类型',
        mbtiPlaceholder: '选择你的 MBTI',
        interests: '兴趣标签',
        interestPlaceholder: '输入后回车添加',
        bio: '自我介绍',
        stressLevel: '近期压力水平',
        stressLow: '轻松',
        stressMid: '适中',
        stressHigh: '较大',
        sleepQuality: '睡眠质量',
        sleepPoor: '不佳',
        sleepFair: '一般',
        sleepGood: '良好',
        save: '保存档案',
        saveSuccess: '心理档案已更新'
      },
      stats: {
        title: '活动统计',
        desc: '你在平台上的成长足迹一览。',
        assessments: '参与测评',
        counseling: '咨询次数',
        moments: '发布心得',
        favorites: '收藏文章',
        capsules: '时光胶囊'
      },
      growth: {
        title: '成长足迹',
        desc: '最近的活动记录，见证每一步成长。',
        items: {
          assessment: '完成了测评',
          counseling: '完成了一次咨询',
          capsule: '创建了时光胶囊',
          article: '收藏了文章',
          square: '发布了心得',
          comment: '发表了评论',
          like: '点赞了内容',
          login: '首次登录平台',
          milestone: '达成成长里程碑'
        },
        viewAll: '查看全部',
        summary: '成长概览',
        totalActivities: '累计活动',
        activeDays: '活跃天数',
        streak: '连续打卡',
        badges: '获得徽章',
        badgeFirst: '初心者',
        badgeFirstDesc: '完成首次测评',
        badgeExplorer: '探索者',
        badgeExplorerDesc: '体验全部模块',
        badgePersistent: '坚持者',
        badgePersistentDesc: '连续活跃7天',
        badgeCollector: '收藏家',
        badgeCollectorDesc: '收藏10篇文章',
        year2024: '2024年',
        year2025: '2025年',
        noMore: '没有更多了'
      },
      danger: {
        title: '危险操作',
        desc: '注销账号将永久删除你的所有数据，此操作不可恢复。',
        deleteBtn: '注销账号',
        confirmTitle: '确认注销账号',
        confirmMsg: '此操作将永久删除你的账号及所有相关数据，且无法恢复。是否继续？',
        confirmBtn: '确认注销',
        deleted: '账号已注销，即将返回首页'
      }
    }
  },
  settings: {
    eyebrow: '账号设置',
    title: '安全与<em>偏好</em>',
    desc: '管理账号安全、通知偏好、隐私设置与个性化偏好，打造属于你的使用体验。',
    card: {
      security: {
        title: '账号安全',
        desc: '保护你的账号安全，定期更换密码并保持联系方式有效。',
        changePassword: '修改密码',
        oldPassword: '旧密码',
        newPassword: '新密码',
        confirmPassword: '确认新密码',
        updatePassword: '更新密码',
        passwordChanged: '密码修改成功',
        passwordMismatch: '两次输入的密码不一致',
        fillRequired: '请填写完整的密码信息',
        boundAccounts: '已绑定的联系方式',
        phone: '手机',
        email: '邮箱',
        modify: '修改',
        loginDevices: '登录设备管理',
        currentDevice: '当前设备',
        lastLogin: '最近登录',
        revokeDevice: '移除设备',
        deviceIp: 'IP 地址',
        deviceBrowser: '浏览器',
        deviceRevokeConfirm: '确定要移除此设备吗？移除后该设备需要重新登录。',
        deviceRevokeTitle: '移除设备',
        deviceRevoked: '设备已移除',
        dialog: {
          modifyPhone: '修改手机号',
          modifyEmail: '修改邮箱',
          step1: '身份验证',
          step2: '输入新{type}',
          step3: '验证新{type}',
          verifyPassword: '密码验证',
          verifyCode: '验证码验证',
          currentPassword: '当前账号密码',
          currentPasswordPlaceholder: '请输入当前账号密码',
          sendCodeToCurrent: '向当前{type}发送验证码',
          getCode: '获取验证码',
          resendIn: '{n}s 后重发',
          codePlaceholder: '请输入 6 位验证码',
          newValueLabel: '新{type}',
          newValuePlaceholder: '请输入新{type}',
          sendCodeToNew: '向新{type}发送验证码',
          submit: '确认修改',
          next: '下一步',
          prev: '上一步',
          success: '联系方式修改成功',
          passwordError: '密码不能为空',
          codeError: '验证码错误，请输入 6 位数字',
          phoneFormat: '请输入正确的手机号',
          emailFormat: '请输入正确的邮箱',
          typePhone: '手机号',
          typeEmail: '邮箱',
          verifyCodeSent: '验证码已发送至当前{type}',
          newCodeSent: '验证码已发送至新{type}'
        }
      },
      notifications: {
        title: '通知偏好',
        desc: '选择你想接收的通知类型，我们不会打扰你的宁静。',
        save: '保存设置',
        saveSuccess: '通知偏好已更新',
        items: {
          booking: '咨询预约提醒',
          assessment: '测评结果通知',
          comment: '心得评论通知',
          activity: '活动推送',
          marketing: '营销邮件'
        },
        hints: {
          booking: '咨询前 24 小时及开始时提醒',
          assessment: '测评报告生成后通知',
          comment: '他人评论你的心得时通知',
          activity: '平台活动与讲座信息',
          marketing: '产品更新与优惠信息'
        }
      },
      privacy: {
        title: '隐私设置',
        desc: '控制谁可以看到你的信息，以及如何被他人发现。',
        visibility: '个人主页可见范围',
        visibilityPublic: '所有人',
        visibilityFriends: '仅好友',
        visibilityPrivate: '仅自己',
        searchable: '允许被搜索',
        showProfile: '展示心理档案',
        save: '保存设置',
        saveSuccess: '隐私设置已更新'
      },
      preferences: {
        title: '偏好设置',
        desc: '个性化你的使用体验，语言、主题与默认首页。',
        language: '界面语言',
        theme: '显示主题',
        defaultHome: '默认首页',
        homePage: '首页',
        assessmentPage: '测评中心',
        articlesPage: '文章资讯',
        zhCN: '简体中文',
        zhTW: '繁體中文',
        enUS: 'English',
        languageChanged: '语言已切换',
        themeChanged: '主题已切换',
        themeAutoHint: '已跟随系统',
        themeActualLight: '当前浅色',
        themeActualDark: '当前深色'
      },
      data: {
        title: '数据管理',
        desc: '管理你的数据，导出或清除平台缓存。',
        exportData: '导出我的数据',
        exportBtn: '导出数据',
        exportSuccess: '数据导出请求已提交',
        clearCache: '清除本地缓存',
        clearBtn: '清除缓存',
        clearConfirm: '确定要清除本地缓存吗？这将移除临时文件，不影响你的账号数据。',
        clearSuccess: '本地缓存已清除',
        dateRange: '日期范围',
        dataTypes: '数据类型',
        typeAssessment: '测评记录',
        typeCounseling: '咨询记录',
        typeActivity: '活动数据',
        typeProfile: '个人资料',
        cacheTypes: '缓存类别',
        cacheTemp: '临时文件',
        cacheHistory: '浏览历史',
        cacheAssessment: '测评缓存',
        cacheForm: '表单数据',
        selectAtLeastOne: '请至少选择一项',
        exportDesc: '选择要导出的数据类型与日期范围',
        clearCacheDesc: '选择要清除的缓存类别，操作不可恢复',
        startDate: '开始日期',
        endDate: '结束日期'
      }
    }
  },
  login: {
    header: {
      badge: '欢迎登录',
      title: '开启成长之旅',
      desc: '登录您的账号，探索专属成长路径',
      registerBadge: '加入我们',
      registerTitle: '创建账号',
      registerDesc: '注册您的账户，开始探索之旅',
      forgotBadge: '安全验证',
      forgotTitle: '重置密码',
      forgotDesc: '验证身份后即可设置新密码'
    },
    tabs: { account: '账号密码', phone: '手机号', email: '邮箱' },
    form: {
      schoolPlaceholder: '请选择学校',
      userIdPlaceholder: '请输入学号',
      passwordPlaceholder: '请输入密码',
      captchaPlaceholder: '请输入验证码',
      phonePlaceholder: '请输入手机号',
      emailPlaceholder: '请输入邮箱',
      codePlaceholder: '请输入验证码',
      remember: '保存登录信息',
      forgotPassword: '忘记密码？',
      getCode: '获取验证码',
      codeResend: '{n}s后重发',
      accountBtn: '立即登录',
      phoneBtn: '手机登录',
      emailBtn: '邮箱登录',
      schoolRequired: '请选择学校',
      userIdRequired: '请输入学号',
      userIdLength: '学号长度为1-20个字符',
      passwordRequired: '请输入密码',
      passwordLength: '密码长度为6-20个字符',
      captchaRequired: '请输入验证码',
      captchaLength: '验证码为4位字符',
      captchaError: '验证码错误',
      phoneRequired: '请输入手机号',
      phoneFormat: '请输入正确的手机号码',
      codeRequired: '请输入验证码',
      codeFormat: '验证码为6位数字',
      emailRequired: '请输入邮箱',
      emailFormat: '请输入正确的邮箱格式',
      codeSent: '验证码已发送',
      codeSendFail: '验证码发送失败',
      codeSendRetry: '验证码发送失败，请稍后重试',
      validateFail: '表单验证失败',
      loginFail: '登录失败'
    },
    social: { text: '其他登录方式', wechat: '微信登录', qq: 'QQ登录' },
    register: { prompt: '还没有账号？', btn: '立即注册' }
  },
  notFound: {
    nav: {
      home: '首页',
      career: '职业探索',
      treehole: '心理树洞',
      about: '关于我们'
    },
    hero: {
      number: '404',
      title: '迷途驿站',
      quote: '此路尚未开通，但每条岔路都藏着新的可能。在这里，迷路不是终点，而是探索的开始。',
      issue: '生涯心旅 · 特别专题',
      volume: '2026 夏季刊',
      page: '01',
      scroll: '继续翻阅'
    },
    topics: {
      label: '专题',
      title: '选择你的下一站',
      explore: '探索此专题',
      items: [
        { no: '01', en: 'COMFORT ZONE', zh: '温暖小屋', desc: '在熟悉的空间里，给自己一段安静的时光，与内心对话。' },
        { no: '02', en: 'SKILL UNLOCK', zh: '技能之门', desc: '每一次学习，都是打开新世界的钥匙。你比你想象的更强大。' },
        { no: '03', en: 'UNKNOWN PATH', zh: '迷雾小径', desc: '未知的路上，藏着最美的风景。勇敢迈出那一步。' }
      ]
    },
    quote: {
      text: '你并不孤单。在生涯心旅，每一次迷路都是探索的开始，每一次停留都是为了更好地出发。',
      author: '— 生涯心旅编辑部'
    },
    community: {
      label: 'Community',
      title: '此刻迷路的人',
      subtitle: '{n} 人曾在这里停留，留下他们的故事与心情',
      writeLabel: 'Write to us',
      writePlaceholder: '写下你的故事…',
      empty: '说点什么吧',
      hug: '拥抱',
      share: '分享',
      featured: '精选'
    },
    footer: {
      slogan: '每一次迷路，都是探索的开始',
      hotline: '求助热线',
      copyright: '© 2026 生涯心旅 · 迷途驿站特别专题'
    }
  }
}
