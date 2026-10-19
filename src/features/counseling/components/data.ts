// 咨询模块静态数据（业务组件层共享，禁止引 API/stores/realtime/router）
import { ApartmentOutlined, HomeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import type { ConsultationType, Counselor, FaqItem } from './types'

export const COUNSELING_STORAGE_KEY = 'counseling_bookings'

export const consultationTypes: ConsultationType[] = [
  { key: 'individual', name: '个体咨询', desc: '一对一深度探讨个人议题', duration: 50, icon: UserOutlined },
  { key: 'couple', name: '伴侣咨询', desc: '改善亲密关系与沟通', duration: 60, icon: ApartmentOutlined },
  { key: 'family', name: '家庭咨询', desc: '处理家庭关系与冲突', duration: 60, icon: HomeOutlined },
  { key: 'group', name: '团体辅导', desc: '在团体中获得支持与成长', duration: 90, icon: MessageOutlined }
]

export const specialties = ['情绪管理', '焦虑抑郁', '人际关系', '亲密关系', '家庭治疗', '创伤治疗', '青少年', '职业规划', '认知行为', '正念取向', '精神分析', '团体咨询']

export const counselors: Counselor[] = [
  { id: 1, name: '林晓薇', title: '资深心理老师', gender: 'female', rating: 4.9, sessions: 1280, exp: 12, education: '心理学博士', color: '#0052d9',
    types: ['individual', 'couple', 'group'],
    specialties: ['情绪管理', '焦虑抑郁', '认知行为'], intro: '擅长运用认知行为疗法（CBT）帮助同学处理焦虑、抑郁情绪，12年辅导经验，温和而敏锐。',
    background: ['北京师范大学心理学博士', '中美认知行为治疗三年制培训', '中国心理学会注册心理师'], reviews: ['林老师非常有耐心，让我学会识别自己的自动化思维，焦虑明显减轻。', '辅导节奏舒服，每次都有新的觉察。'] },
  { id: 2, name: '陈志远', title: '高级心理老师', gender: 'male', rating: 4.8, sessions: 960, exp: 9, education: '应用心理学硕士', color: '#10b981',
    types: ['individual', 'couple', 'group'],
    specialties: ['人际关系', '亲密关系', '精神分析'], intro: '精神分析取向，擅长探索早年关系模式对当下人际互动的影响，陪伴同学深度自我探索。',
    background: ['华东师范大学应用心理学硕士', '中德班精神分析三年制培训', '国家二级心理咨询师'], reviews: ['陈老师帮我看到了自己一直没意识到的关系模式，很有启发。'] },
  { id: 3, name: '苏雨桐', title: '资深心理老师', gender: 'female', rating: 4.9, sessions: 1100, exp: 14, education: '家庭治疗博士', color: '#7c3aed',
    types: ['individual', 'couple', 'family', 'group'],
    specialties: ['家庭治疗', '亲密关系', '青少年'], intro: '系统式家庭治疗取向，擅长处理家庭冲突、亲子沟通、青少年议题，让家庭成为成长的资源。',
    background: ['香港大学家庭治疗博士', '米纽庆家庭治疗中心进修', 'AAMFT临床会员'], reviews: ['苏老师让全家都参与了改变，家不再是争吵的地方。'] },
  { id: 4, name: '王浩然', title: '心理辅导老师', gender: 'male', rating: 4.7, sessions: 680, exp: 7, education: '心理学硕士', color: '#f59e0b',
    types: ['individual', 'group'],
    specialties: ['职业规划', '正念取向', '情绪管理'], intro: '结合正念与接纳承诺疗法（ACT），帮助同学应对学业压力、职业迷茫与人生转型期的困惑。',
    background: ['浙江大学心理学硕士', '正念减压MBSR教师培训', 'ACBS会员'], reviews: ['王老师的正念练习很实用，考试压力下也能用上。'] },
  { id: 5, name: '张静怡', title: '高级心理老师', gender: 'female', rating: 4.8, sessions: 820, exp: 10, education: '临床心理学硕士', color: '#ef4444',
    types: ['individual', 'group'],
    specialties: ['创伤治疗', '焦虑抑郁', '认知行为'], intro: 'EMDR国际认证治疗师，专注于创伤后应激障碍（PTSD）、复杂性创伤与童年创伤的修复。',
    background: ['北京大学临床心理学硕士', 'EMDR国际认证', '创伤聚焦CBT培训'], reviews: ['张老师非常专业，处理我的创伤记忆时让我感到安全。'] },
  { id: 6, name: '李明哲', title: '资深心理老师', gender: 'male', rating: 4.7, sessions: 740, exp: 8, education: '心理学博士', color: '#06b6d4',
    types: ['individual', 'family', 'group'],
    specialties: ['青少年', '家庭治疗', '人际关系'], intro: '青少年心理专家，擅长处理厌学、网络成瘾、青春期叛逆、亲子冲突等议题，与家庭协同工作。',
    background: ['南京师范大学发展心理学博士', '结构式家庭治疗培训', '青少年心理工作坊认证'], reviews: ['孩子终于愿意和我们说话了，谢谢李老师。'] },
  { id: 7, name: '周思琪', title: '心理辅导老师', gender: 'female', rating: 4.6, sessions: 520, exp: 6, education: '应用心理学硕士', color: '#ec4899',
    types: ['individual', 'couple', 'group'],
    specialties: ['人际关系', '情绪管理', '正念取向'], intro: '人际关系取向（IPT）辅导老师，帮助同学理解人际模式、建立健康边界、改善社交焦虑。',
    background: ['西南大学应用心理学硕士', '人际关系取向治疗IPT认证', '国家二级心理咨询师'], reviews: ['周老师很温柔，让我敢于面对社交中的恐惧。'] },
  { id: 8, name: '黄子轩', title: '高级心理老师', gender: 'male', rating: 4.8, sessions: 890, exp: 11, education: '临床心理学博士', color: '#0284c7',
    types: ['individual', 'couple', 'group'],
    specialties: ['焦虑抑郁', '创伤治疗', '精神分析'], intro: '整合精神分析与躯体体验取向，关注身心联结，帮助同学从身体与情绪双层面获得疗愈。',
    background: ['复旦大学临床心理学博士', '躯体体验SE治疗师认证', '中德班精神分析毕业'], reviews: ['黄老师让我重新连接了自己的身体感受，很特别。'] }
]

export const faqList: FaqItem[] = [
  { cat: 'booking', q: '如何预约心理辅导？', a: '在"预约咨询"页面依次选择咨询类型、心理老师、时间段并填写基本信息，提交后心理老师会在24小时内确认。也可以前往心理辅导中心现场预约。' },
  { cat: 'booking', q: '首次咨询需要准备什么？', a: '建议提前5分钟到达辅导室（线下）或确保网络通畅（线上）。简单梳理近期困扰和想探讨的话题，保持开放真诚的心态即可。' },
  { cat: 'booking', q: '可以指定心理老师吗？', a: '可以。你可以在"心理老师"页面查看所有老师的详细介绍、擅长领域与同学评价，选择心仪的老师进行预约。' },
  { cat: 'booking', q: '一次咨询多长时间？频率如何？', a: '通常每次50分钟，首次评估访谈可能延长至60-80分钟。频率一般为每周1次，具体根据议题与进展由双方协商确定。' },
  { cat: 'booking', q: '可以线上咨询吗？', a: '支持视频咨询。在预约时选择"视频咨询"方式，咨询前会收到专属视频房间链接。线上咨询效果与线下相当，且更便捷。' },
  { cat: 'booking', q: '如何取消或改约？', a: '提前24小时以上可在"我的预约"中在线取消或改约；不足24小时请尽量联系辅导中心说明情况。详见《咨询须知》。' },
  { cat: 'service', q: '心理辅导是否收费？', a: '本校心理辅导服务完全免费，面向全体在校同学开放，不收取任何费用。' },
  { cat: 'service', q: '服务对象包括哪些同学？', a: '全体在校本科生、研究生均可预约。短期访学同学也可前往辅导中心咨询现场安排。' },
  { cat: 'service', q: '咨询形式有哪些？', a: '提供面对面咨询（心理辅导中心）和视频咨询两种形式，可根据个人情况选择。视频咨询通过加密平台进行，安全便捷。' },
  { cat: 'service', q: '可以请家长或同学陪同吗？', a: '首次评估可由信任的同学陪同至等候区。咨询过程中通常一对一进行，以保障隐私；如需家长参与家庭议题，由心理老师安排。' },
  { cat: 'effect', q: '心理咨询真的有效吗？', a: '研究表明，约75%的同学在经过6-12次咨询后症状明显改善。效果与咨访关系质量、个人投入度、议题复杂度相关。' },
  { cat: 'effect', q: '一般需要咨询多少次？', a: '短程咨询（CBT等）通常6-12次，中程12-24次，长程可达数月乃至数年。心理老师会在评估后给出建议。' },
  { cat: 'effect', q: '咨询后情绪变差正常吗？', a: '部分同学在咨询初期可能因触碰痛苦议题而情绪波动，这通常是疗愈过程的一部分。如持续加重请及时告知心理老师。' },
  { cat: 'effect', q: '对心理老师不满意怎么办？', a: '可以在任何阶段提出更换心理老师，辅导中心将协助安排。良好的咨访关系是咨询效果的基础。' },
  { cat: 'privacy', q: '咨询内容会被保密吗？', a: '严格保密。所有记录加密存储，未经书面同意不向第三方透露。保密义务在咨询关系结束后继续有效。' },
  { cat: 'privacy', q: '什么情况下会突破保密？', a: '仅在有自伤/伤人风险、未成年人受虐、法律强制要求三种情况下，心理老师有义务突破保密以保护安全。' },
  { cat: 'privacy', q: '咨询记录保存多久？', a: '咨询记录保存至咨询关系结束后3年，之后按规定销毁。期间仅心理老师本人与督导可查阅（隐去身份信息）。' }
]
