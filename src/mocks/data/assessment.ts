import dayjs from 'dayjs'
import type {
  AssessmentOptionDTO,
  AssessmentOptionType,
  AssessmentQuestionDTO,
  AssessmentResultDTO,
  AssessmentScaleDTO,
  AssessmentScaleDetailDTO,
  AssessmentSubmitDTO,
} from '@/api/types'

/**
 * 心理测评 mock 数据（模拟量表目录 / 详情 / 提交计分 / 历史记录）。
 *
 * - 目录与题目由本文件统一维护；
 * - 计分（含等级、标题、建议）在此完成，前端只提交原始选项；
 * - 历史记录存 `localStorage('mock:assessment-history')`，上限 30 条。
 */

const HISTORY_STORAGE_KEY = 'mock:assessment-history'

const SCALE_CATALOG: AssessmentScaleDTO[] = [
  // 心理健康
  { key: 'phq9', name: '抑郁自评 PHQ-9', desc: '评估近两周情绪低落与兴趣减退程度', duration: '3min', count: 9, category: 'mental', icon: 'TrendCharts', difficulty: '入门', available: true, tags: ['情绪', '自评'] },
  { key: 'gad7', name: '焦虑自评 GAD-7', desc: '识别紧张、担忧与焦虑状态', duration: '3min', count: 7, category: 'mental', icon: 'Odometer', difficulty: '入门', available: true, tags: ['焦虑', '自评'] },
  { key: 'pss', name: '压力感知 PSS-10', desc: '测评生活压力感知水平', duration: '5min', count: 10, category: 'mental', icon: 'Compass', difficulty: '入门', available: true, tags: ['压力'] },
  // 生涯发展
  { key: 'riasec', name: '职业兴趣 RIASEC', desc: '探索霍兰德职业兴趣代码', duration: '8min', count: 18, category: 'career', icon: 'User', difficulty: '进阶', available: true, tags: ['职业', '兴趣'] },
  { key: 'mbti', name: '性格倾向 MBTI', desc: '了解性格心理偏好与类型', duration: '10min', count: 20, category: 'career', icon: 'Collection', difficulty: '进阶', available: true, tags: ['性格', '类型'] },
  // 认知能力
  { key: 'reaction', name: '反应速度测试', desc: '测量视觉反应与决策速度', duration: '2min', count: 10, category: 'cognitive', icon: 'Lightning', difficulty: '入门', available: true, tags: ['反应', '速度'] },
  { key: 'memory', name: '短时记忆测评', desc: '评估工作记忆容量与精度', duration: '5min', count: 8, category: 'cognitive', icon: 'Cpu', difficulty: '进阶', available: true, tags: ['记忆'] },
  { key: 'logic', name: '逻辑推理测试', desc: '测评演绎与归纳推理能力', duration: '8min', count: 12, category: 'cognitive', icon: 'Opportunity', difficulty: '进阶', available: true, tags: ['逻辑'] },
  // 电竞能力
  { key: 'aim', name: '瞄准精度测试', desc: '测试鼠标控制与瞄准精度', duration: '3min', count: 5, category: 'esports', icon: 'Aim', difficulty: '入门', available: true, tags: ['FPS', '精度'] },
  { key: 'flick', name: '快速转向反应', desc: '评估瞬时转向与瞄准能力', duration: '4min', count: 8, category: 'esports', icon: 'Aim', difficulty: '进阶', available: true, tags: ['FPS', '反应'] },
  { key: 'decision', name: '瞬时决策测试', desc: '评估高压下的决策速度', duration: '4min', count: 10, category: 'esports', icon: 'Lightning', difficulty: '进阶', available: true, tags: ['决策', '反应'] },
  // 学习风格
  { key: 'vark', name: '学习风格 VARK', desc: '识别视觉/听觉/读写/动觉偏好', duration: '5min', count: 16, category: 'learning', icon: 'Reading', difficulty: '入门', available: true, tags: ['学习'] },
  // 人际关系
  { key: 'sas', name: '社交焦虑量表', desc: '评估社交互动中的焦虑水平', duration: '5min', count: 20, category: 'social', icon: 'ChatDotRound', difficulty: '进阶', available: true, tags: ['社交'] },
  { key: 'eq', name: '共情能力自评', desc: '测评情感共情与理解水平', duration: '6min', count: 15, category: 'social', icon: 'Connection', difficulty: '进阶', available: true, tags: ['共情'] },
]

/** 选项文案与分值（按题目类型复用） */
const SCALE_OPTIONS: Record<AssessmentOptionType, AssessmentOptionDTO[]> = {
  frequency: [
    { label: '完全没有', value: 0 },
    { label: '有几天', value: 1 },
    { label: '一半以上的天数', value: 2 },
    { label: '几乎每天', value: 3 },
  ],
  agreement: [
    { label: '非常不同意', value: 1 },
    { label: '不同意', value: 2 },
    { label: '一般', value: 3 },
    { label: '同意', value: 4 },
    { label: '非常同意', value: 5 },
  ],
  mbti: [
    { label: '非常符合 A', value: 'A2' },
    { label: '比较符合 A', value: 'A1' },
    { label: '比较符合 B', value: 'B1' },
    { label: '非常符合 B', value: 'B2' },
  ],
}

interface ScaleResultShape {
  level: string
  levelTag: string
  title: string
  insight: string
  suggestion: string
}

interface ScaleDefinition {
  name: string
  description: string
  optionType: AssessmentOptionType
  questions: AssessmentQuestionDTO[]
  /** 计分规则：服务端专用，不下发前端 */
  calc: (score: number, details: Record<string, number>) => ScaleResultShape
}

const SCALE_DEFINITIONS: Record<string, ScaleDefinition> = {
  phq9: {
    name: '抑郁自评量表 PHQ-9',
    description: '通过评估过去两周的心情状态，了解您的情绪健康水平。',
    optionType: 'frequency',
    questions: [
      { id: 1, text: '做事提不起劲，或没有乐趣' },
      { id: 2, text: '感到心情低落、沮丧或绝望' },
      { id: 3, text: '入睡困难、睡得不稳或睡得太多' },
      { id: 4, text: '感到疲倦或没有劲' },
      { id: 5, text: '胃口不好或吃得太多' },
      { id: 6, text: '觉得自己很糟，或觉得自己很失败' },
      { id: 7, text: '对事物专注有困难，例如看报纸或看电视' },
      { id: 8, text: '动作或说话速度缓慢到别人都能察觉' },
      { id: 9, text: '有不如死掉或想伤害自己的念头' },
    ],
    calc: (score) => ({
      level: score <= 4 ? '健康' : score <= 9 ? '轻度' : score <= 14 ? '中度' : '重度',
      levelTag: score <= 4 ? 'success' : score <= 9 ? 'info' : score <= 14 ? 'warning' : 'danger',
      title: score <= 4 ? '情绪状态良好' : '需要关注情绪',
      insight: '系统已完成深度分析。',
      suggestion: '保持良好的生活习惯。',
    }),
  },
  gad7: {
    name: '焦虑自评量表 GAD-7',
    description: '用于识别过去两周内的焦虑、紧张和担忧程度。',
    optionType: 'frequency',
    questions: [
      { id: 1, text: '感到紧张、焦虑或心情不安' },
      { id: 2, text: '无法停止或控制担忧' },
      { id: 3, text: '对各种各样的事情担忧过多' },
      { id: 4, text: '很难放松下来' },
      { id: 5, text: '由于不安而无法静坐' },
      { id: 6, text: '变得容易烦躁或急躁' },
      { id: 7, text: '感到好像有什么可怕的事会发生' },
    ],
    calc: (score) => ({
      level: score <= 4 ? '正常' : score <= 9 ? '轻度' : '显著',
      levelTag: score <= 4 ? 'success' : score <= 9 ? 'info' : 'warning',
      title: score <= 4 ? '心态平和' : '建议情绪疏导',
      insight: '焦虑水平分析完成。',
      suggestion: '尝试深呼吸和正念。',
    }),
  },
  riasec: {
    name: '霍兰德职业兴趣 RIASEC',
    description: '探索您的职业兴趣倾向，匹配最适合的职业环境。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '我喜欢修补电器设备或机械', type: 'R' },
      { id: 2, text: '我喜欢进行科学实验或研究', type: 'I' },
      { id: 3, text: '我喜欢创作绘画、设计或摄影', type: 'A' },
      { id: 4, text: '我喜欢参加公益活动或帮助他人', type: 'S' },
      { id: 5, text: '我喜欢说服他人或领导团队', type: 'E' },
      { id: 6, text: '我喜欢整理文档或处理精确数据', type: 'C' },
      { id: 7, text: '我喜欢操作复杂的工具或仪器', type: 'R' },
      { id: 8, text: '我喜欢分析复杂的逻辑问题', type: 'I' },
      { id: 9, text: '我喜欢写诗、写小说或进行表演', type: 'A' },
      { id: 10, text: '我喜欢教导他人知识或技能', type: 'S' },
      { id: 11, text: '我喜欢策划并启动一个商业项目', type: 'E' },
      { id: 12, text: '我喜欢按照既定流程精确办事', type: 'C' },
    ],
    calc: (_score, details) => {
      const sorted = Object.entries(details).sort((a, b) => b[1] - a[1])
      const code = sorted.slice(0, 3).map((i) => i[0]).join('')
      return {
        level: code,
        levelTag: 'primary',
        title: '职业兴趣代码：' + code,
        insight: '您的职业兴趣倾向分析完成。',
        suggestion: '建议关注匹配度较高的行业。',
      }
    },
  },
  mbti: {
    name: '性格倾向自评 (简版 MBTI)',
    description: '探索您的心理偏好，了解您获取能量、收集信息及决策的方式。',
    optionType: 'mbti',
    questions: [
      { id: 1, text: '在社交聚会中，我倾向于：A.活跃参与；B.静观其变', dim: 'EI' },
      { id: 2, text: '我更喜欢：A.关注现实细节；B.想象未来可能性', dim: 'SN' },
      { id: 3, text: '决策时我更看重：A.逻辑分析；B.情感价值', dim: 'TF' },
      { id: 4, text: '生活方式上我倾向：A.有计划有组织；B.随性且开放', dim: 'JP' },
      { id: 5, text: '独自一人让我：A.感到无聊；B.感到充能', dim: 'EI' },
      { id: 6, text: '我更信任：A.经验；B.直觉', dim: 'SN' },
      { id: 7, text: '我会被描述为：A.理性的；B.感性的', dim: 'TF' },
      { id: 8, text: '面对最后期限，我：A.提前完成；B.最后一刻冲刺', dim: 'JP' },
      { id: 9, text: '说话前：A.经常直接说出；B.先在脑中构思', dim: 'EI' },
      { id: 10, text: '处理问题时：A.脚踏实地；B.脑洞大开', dim: 'SN' },
    ],
    calc: (_score, details) => {
      const type =
        (details.E >= details.I ? 'E' : 'I') +
        (details.S >= details.N ? 'S' : 'N') +
        (details.T >= details.F ? 'T' : 'F') +
        (details.J >= details.P ? 'J' : 'P')
      return {
        level: type,
        levelTag: 'danger',
        title: '您的性格类型是 ' + type,
        insight: '性格倾向深度分析完成。',
        suggestion: '了解性格有助于提升沟通效率。',
      }
    },
  },
  pss: {
    name: '压力感知量表 PSS-10',
    description: '评估最近一个月您对生活压力的感知与掌控程度。',
    optionType: 'frequency',
    questions: [
      { id: 1, text: '因意外发生的事情而感到心烦意乱' },
      { id: 2, text: '感觉无法控制生活中的重要事情' },
      { id: 3, text: '感到紧张不安和压力' },
      { id: 4, text: '感觉事情没有按照预期发展' },
      { id: 5, text: '发现自己无法应对所有必须做的事情' },
      { id: 6, text: '因为事情超出掌控范围而感到愤怒' },
      { id: 7, text: '感到困难积累太多而无法克服' },
      { id: 8, text: '因为发生的事情而感到烦躁易怒' },
      { id: 9, text: '感觉被生活琐事推着走' },
      { id: 10, text: '经常担心事情可能失控' },
    ],
    calc: (score) => ({
      level: score <= 10 ? '压力较低' : score <= 19 ? '压力适中' : score <= 25 ? '压力偏高' : '压力过高',
      levelTag: score <= 10 ? 'success' : score <= 19 ? 'info' : score <= 25 ? 'warning' : 'danger',
      title: score <= 10 ? '压力状态良好' : score <= 19 ? '压力可控' : '需要主动减压',
      insight: '压力感知分析完成。',
      suggestion: '保持规律作息与运动。',
    }),
  },
  reaction: {
    name: '反应速度自评测试',
    description: '通过典型情境自评，了解您的瞬时反应与决策速度。',
    optionType: 'frequency',
    questions: [
      { id: 1, text: '屏幕上出现机会时，我总能第一时间反应' },
      { id: 2, text: '面对突发状况，我能瞬间判断并行动' },
      { id: 3, text: '对方动作刚起时我已提前做出应对' },
      { id: 4, text: '信息刷新的瞬间我就能捕捉到关键变化' },
      { id: 5, text: '我很少因为反应慢而错失时机' },
      { id: 6, text: '高强度对抗中我的反应依然稳定' },
      { id: 7, text: '疲惫时我的反应速度几乎没有下降' },
      { id: 8, text: '突发事件后我能立刻恢复操作节奏' },
      { id: 9, text: '我能在干扰中快速锁定真正重要的目标' },
      { id: 10, text: '复盘时我常发现自己的反应快于对手' },
    ],
    calc: (score) => ({
      level: score >= 24 ? '反应迅捷' : score >= 16 ? '反应正常' : '反应偏慢',
      levelTag: score >= 24 ? 'success' : score >= 16 ? 'info' : 'warning',
      title: score >= 24 ? '瞬时反应出色' : score >= 16 ? '反应水平稳定' : '反应速度待提升',
      insight: '反应速度分析完成。',
      suggestion: '可通过反应类小游戏持续训练。',
    }),
  },
  memory: {
    name: '短时记忆测评',
    description: '评估工作记忆的容量、精度与抗干扰能力。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '我能记住刚看过的一长串数字或密码' },
      { id: 2, text: '听一遍名字或术语，我就能准确复述' },
      { id: 3, text: '我能在脑中同时保持多个任务线索' },
      { id: 4, text: '被打断后我能迅速想起刚才的进度' },
      { id: 5, text: '我能记住地图或关卡里的细节位置' },
      { id: 6, text: '长对话中我能准确引用之前的信息' },
      { id: 7, text: '我很少需要反复确认刚交代的事情' },
      { id: 8, text: '有干扰的环境里我的记忆依然可靠' },
    ],
    calc: (score) => ({
      level: score >= 32 ? '记忆出色' : score >= 22 ? '记忆稳定' : '待提升',
      levelTag: score >= 32 ? 'success' : score >= 22 ? 'info' : 'warning',
      title: score >= 32 ? '工作记忆出色' : score >= 22 ? '记忆容量稳定' : '记忆容量有提升空间',
      insight: '短时记忆分析完成。',
      suggestion: '尝试组块化记忆与定期复述训练。',
    }),
  },
  logic: {
    name: '逻辑推理测试',
    description: '测评演绎、归纳与策略推演能力。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '我能快速找出数列或图形的规律' },
      { id: 2, text: '我善于从零散信息中推导结论' },
      { id: 3, text: '面对复杂问题我习惯先拆解再逐层分析' },
      { id: 4, text: '我能察觉论证过程中隐含的逻辑漏洞' },
      { id: 5, text: '我常能预判事情的下一步走向' },
      { id: 6, text: '策略对抗中我常能推演到两步之后' },
      { id: 7, text: '我能同时梳理多条线索的因果关系' },
      { id: 8, text: '复杂规则我读一遍就能抓住要点' },
      { id: 9, text: '我擅长把大问题拆成可执行的小步骤' },
      { id: 10, text: '我的判断通常有清晰的依据链' },
      { id: 11, text: '我能快速排除无关信息抓住核心矛盾' },
      { id: 12, text: '逆向思考对我来说并不费力' },
    ],
    calc: (score) => ({
      level: score >= 48 ? '逻辑缜密' : score >= 33 ? '逻辑良好' : '待提升',
      levelTag: score >= 48 ? 'success' : score >= 33 ? 'info' : 'warning',
      title: score >= 48 ? '推理能力出色' : score >= 33 ? '逻辑推理良好' : '推理能力有提升空间',
      insight: '逻辑推理分析完成。',
      suggestion: '可练习数独与策略推演类题目。',
    }),
  },
  aim: {
    name: '瞄准精度测试',
    description: '测试鼠标控制与瞄准稳定性。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '我的准星几乎总能稳定落在目标上' },
      { id: 2, text: '长距离对枪中我的命中率保持稳定' },
      { id: 3, text: '连续射击时我依然能控制住弹道' },
      { id: 4, text: '目标快速移动时我依然能命中' },
      { id: 5, text: '长时间练习后我的准度仍在提升' },
    ],
    calc: (score) => ({
      level: score >= 20 ? '枪法精准' : score >= 14 ? '发挥稳定' : '待打磨',
      levelTag: score >= 20 ? 'success' : score >= 14 ? 'info' : 'warning',
      title: score >= 20 ? '瞄准精度出色' : score >= 14 ? '枪法发挥稳定' : '瞄准精度待打磨',
      insight: '瞄准精度分析完成。',
      suggestion: '建议每日进行定靶与跟枪练习。',
    }),
  },
  flick: {
    name: '快速转向反应',
    description: '评估瞬时转向、甩枪与快速修正能力。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '目标突然出现在屏幕边缘时我能瞬间甩枪命中' },
      { id: 2, text: '大幅度转视角后我的准星仍能落在目标附近' },
      { id: 3, text: '我能快速连续完成多次甩枪而保持准度' },
      { id: 4, text: '意外遇敌时我的第一枪通常就能命中' },
      { id: 5, text: '高压对局中我的甩枪节奏依然稳定' },
      { id: 6, text: '面对不规则移动目标我能快速修正弹道' },
      { id: 7, text: '我很少因转场过冲而丢失目标' },
      { id: 8, text: '残局处理时我的快速转火依然可靠' },
    ],
    calc: (score) => ({
      level: score >= 32 ? '反应凌厉' : score >= 22 ? '发挥稳定' : '待打磨',
      levelTag: score >= 32 ? 'success' : score >= 22 ? 'info' : 'warning',
      title: score >= 32 ? '甩枪反应凌厉' : score >= 22 ? '转向发挥稳定' : '转向反应待打磨',
      insight: '快速转向分析完成。',
      suggestion: '建议练习 180 度回转与跟枪衔接。',
    }),
  },
  decision: {
    name: '瞬时决策测试',
    description: '评估高压环境下的决策速度与果断程度。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '高压局面下我依然能快速做出选择' },
      { id: 2, text: '信息不完全时我也能做出合理决断' },
      { id: 3, text: '我很少在关键时刻犹豫不决' },
      { id: 4, text: '我能快速权衡收益与风险并行动' },
      { id: 5, text: '团队僵持时我常主动拍板推进' },
      { id: 6, text: '失误之后我能迅速做出下一次正确决策' },
      { id: 7, text: '我能在嘈杂环境中保持决策清晰' },
      { id: 8, text: '面对多选项我能快速排除劣选' },
      { id: 9, text: '时间压力越大我的决断越果断' },
      { id: 10, text: '事后复盘时我的多数决断都被证明合理' },
    ],
    calc: (score) => ({
      level: score >= 40 ? '决策果敢' : score >= 28 ? '决策冷静' : '偏犹豫',
      levelTag: score >= 40 ? 'success' : score >= 28 ? 'info' : 'warning',
      title: score >= 40 ? '高压决策出色' : score >= 28 ? '决策冷静可靠' : '决策果断度待提升',
      insight: '瞬时决策分析完成。',
      suggestion: '可在限时任务中刻意练习快速取舍。',
    }),
  },
  vark: {
    name: '学习风格量表 VARK',
    description: '识别您在视觉、听觉、读写、动觉四种通道上的学习偏好。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '学习新知识时，图表和示意图最让我印象深刻', type: 'V' },
      { id: 2, text: '我倾向把要点画成思维导图来记忆', type: 'V' },
      { id: 3, text: '我对颜色、排版和视觉细节很敏感', type: 'V' },
      { id: 4, text: '回忆内容时我脑海里先浮现画面', type: 'V' },
      { id: 5, text: '听老师讲解比看讲义让我记得更牢', type: 'A' },
      { id: 6, text: '我喜欢通过讨论和口头复述来学习', type: 'A' },
      { id: 7, text: '旋律和节奏能帮我记住知识', type: 'A' },
      { id: 8, text: '我常把学到的内容讲给自己听', type: 'A' },
      { id: 9, text: '我习惯把重点整理成文字笔记', type: 'R' },
      { id: 10, text: '反复抄写和阅读让我记得更牢', type: 'R' },
      { id: 11, text: '我喜欢查资料和阅读详细说明', type: 'R' },
      { id: 12, text: '列清单和写提纲是我的学习常态', type: 'R' },
      { id: 13, text: '动手实践一次胜过看十遍演示', type: 'K' },
      { id: 14, text: '学习时我很难长时间静坐不动', type: 'K' },
      { id: 15, text: '我喜欢通过实验和模拟来理解原理', type: 'K' },
      { id: 16, text: '拆装和操作能帮我快速掌握新事物', type: 'K' },
    ],
    calc: (_score, details) => {
      const entries = Object.entries(details).sort((a, b) => b[1] - a[1])
      const dominant = entries[0]?.[0] ?? 'V'
      const names: Record<string, string> = { V: '视觉型', A: '听觉型', R: '读写型', K: '动觉型' }
      const name = names[dominant] ?? '均衡型'
      return {
        level: `${name} (${dominant})`,
        levelTag: 'primary',
        title: '学习风格：' + name,
        insight: '学习风格分析完成。',
        suggestion: '按主导风格选择学习媒介，吸收效率更高。',
      }
    },
  },
  sas: {
    name: '社交焦虑量表 SAS',
    description: '评估社交互动中的紧张、回避与担忧水平。',
    optionType: 'frequency',
    questions: [
      { id: 1, text: '害怕在重要人物面前表现自己' },
      { id: 2, text: '在人群中感到不自在' },
      { id: 3, text: '容易因为别人的目光而不安' },
      { id: 4, text: '担心自己在社交场合出丑' },
      { id: 5, text: '回避成为关注的焦点' },
      { id: 6, text: '与陌生人交谈感到紧张' },
      { id: 7, text: '不敢在公开场合表达不同意见' },
      { id: 8, text: '参加聚会前会反复焦虑' },
      { id: 9, text: '担心别人对自己有负面评价' },
      { id: 10, text: '电话或视频沟通让我紧张' },
      { id: 11, text: '在他人面前进食或发言感到别扭' },
      { id: 12, text: '被点名发言时心跳加速' },
      { id: 13, text: '尽量避免与领导或老师正面交流' },
      { id: 14, text: '社交活动后反复回想自己的表现' },
      { id: 15, text: '害怕自己说话声音发抖' },
      { id: 16, text: '在小组讨论中倾向于沉默' },
      { id: 17, text: '面试或述职前夜难以入睡' },
      { id: 18, text: '别人看我做事时手会不听使唤' },
      { id: 19, text: '尽量避开需要自我介绍的场合' },
      { id: 20, text: '事后常为自己社交中的表现懊恼' },
    ],
    calc: (score) => ({
      level: score <= 12 ? '社交自如' : score <= 30 ? '轻度社交焦虑' : score <= 45 ? '中度社交焦虑' : '重度社交焦虑',
      levelTag: score <= 12 ? 'success' : score <= 30 ? 'info' : score <= 45 ? 'warning' : 'danger',
      title: score <= 12 ? '社交状态良好' : score <= 30 ? '可尝试渐进式社交练习' : '建议寻求专业支持',
      insight: '社交焦虑分析完成。',
      suggestion: '从小范围社交开始逐步暴露练习。',
    }),
  },
  eq: {
    name: '共情能力自评',
    description: '测评情感共情、情绪觉察与理解他人的水平。',
    optionType: 'agreement',
    questions: [
      { id: 1, text: '我能敏锐察觉他人情绪的细微变化' },
      { id: 2, text: '朋友低落时我能准确说出他的感受' },
      { id: 3, text: '看到他人难过我也会感同身受' },
      { id: 4, text: '我常在别人开口前就察觉到异样' },
      { id: 5, text: '我能理解与自己性格迥异的人' },
      { id: 6, text: '冲突中我能看到双方的立场与情绪' },
      { id: 7, text: '安慰他人时我的回应总能说到点上' },
      { id: 8, text: '我愿意花时间倾听他人的心事' },
      { id: 9, text: '我能分辨愤怒背后的委屈或恐惧' },
      { id: 10, text: '他人向我倾诉时我不会急于评判' },
      { id: 11, text: '我能感知集体氛围的微妙变化' },
      { id: 12, text: '电影角色的情绪常让我久久不能平静' },
      { id: 13, text: '我能察觉他人隐藏的紧张或不安' },
      { id: 14, text: '同理心让我更容易获得他人信任' },
      { id: 15, text: '我能调整自己的表达去照顾他人情绪' },
    ],
    calc: (score) => ({
      level: score >= 60 ? '共情出色' : score >= 42 ? '共情中等' : '偏理性',
      levelTag: score >= 60 ? 'success' : score >= 42 ? 'info' : 'warning',
      title: score >= 60 ? '共情能力出色' : score >= 42 ? '共情水平中等' : '情感觉察偏理性',
      insight: '共情能力分析完成。',
      suggestion: '可通过情绪日记提升觉察粒度。',
    }),
  },
}

/** `GET /api/assessment/scales` */
export function listScales(): AssessmentScaleDTO[] {
  return SCALE_CATALOG
}

/** `GET /api/assessment/scales/:id` —— 不存在返回 undefined */
export function findScaleDetail(key: string): AssessmentScaleDetailDTO | undefined {
  const definition = SCALE_DEFINITIONS[key]
  const catalog = SCALE_CATALOG.find((item) => item.key === key)
  if (!definition || !catalog) return undefined

  return {
    key,
    name: definition.name,
    category: catalog.category,
    description: definition.description,
    optionType: definition.optionType,
    options: SCALE_OPTIONS[definition.optionType],
    questions: definition.questions,
  }
}

function loadHistory(): AssessmentResultDTO[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as AssessmentResultDTO[]) : []
  } catch {
    return []
  }
}

function persistHistory(list: AssessmentResultDTO[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* localStorage 不可用时退化为纯内存 */
  }
}

/** 通用计分核心：答案 → 总分 / 维度明细 / 等级文案（提交与种子共用，保证口径一致） */
function scoreAnswers(
  definition: ScaleDefinition,
  answers: { questionId: number; value: number | string }[],
): { total: number; details: Record<string, number>; shape: ScaleResultShape } {
  let total = 0
  const details: Record<string, number> = {}

  if (definition.optionType === 'mbti') {
    definition.questions.forEach((question) => {
      const dim = question.dim
      if (dim) {
        details[dim[0]] = 0
        details[dim[1]] = 0
      }
    })
  } else {
    definition.questions.forEach((question) => {
      if (question.type) details[question.type] = 0
    })
  }

  definition.questions.forEach((question) => {
    const answer = answers.find((item) => item.questionId === question.id)
    if (!answer) return

    if (definition.optionType === 'mbti') {
      const value = String(answer.value)
      const char = value.charAt(0)
      const weight = Number(value.charAt(1)) || 0
      const dim = question.dim ?? ''
      if (!dim) return
      const typeChar = char === 'A' ? dim[0] : dim[1]
      details[typeChar] = (details[typeChar] ?? 0) + weight
      return
    }

    const numeric = Number(answer.value)
    if (Number.isNaN(numeric)) return
    total += numeric
    if (question.type) {
      details[question.type] = (details[question.type] ?? 0) + numeric
    }
  })

  return { total, details, shape: definition.calc(total, details) }
}

/**
 * 演示历史种子：覆盖 6 大分类与多份同量表记录，
 * 保证看板（概览/雷达/趋势/分布/AI 洞察/进步对比/足迹）首次访问即有数据。
 * 仅在本地从未存在过历史时播种；用户清空后写入 '[]'，不会复活。
 */
interface HistorySeed {
  key: string
  /** 距今天数（用于生成相对日期，保证月度目标/7d/30d 过滤始终有效） */
  daysAgo: number
  /** 按题序作答 */
  answers: (number | string)[]
}

const HISTORY_SEEDS: HistorySeed[] = [
  { key: 'phq9', daysAgo: 42, answers: [1, 1, 2, 1, 1, 1, 0, 1, 0] },
  { key: 'gad7', daysAgo: 35, answers: [2, 1, 2, 2, 1, 1, 1] },
  { key: 'pss', daysAgo: 28, answers: [2, 2, 1, 2, 2, 2, 1, 2, 2, 2] },
  { key: 'riasec', daysAgo: 14, answers: [5, 5, 3, 3, 2, 4, 4, 4, 2, 3, 2, 3] },
  { key: 'mbti', daysAgo: 10, answers: ['B2', 'B2', 'A2', 'A2', 'B1', 'B1', 'A1', 'B1', 'B2', 'B2'] },
  { key: 'sas', daysAgo: 8, answers: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1] },
  { key: 'pss', daysAgo: 7, answers: [1, 1, 1, 2, 1, 1, 1, 1, 2, 1] },
  { key: 'vark', daysAgo: 6, answers: [5, 3, 4, 2, 5, 3, 3, 2, 5, 2, 3, 2, 4, 2, 3, 1] },
  { key: 'gad7', daysAgo: 5, answers: [1, 1, 1, 1, 0, 0, 0] },
  { key: 'eq', daysAgo: 4, answers: [4, 4, 4, 5, 4, 4, 4, 3, 5, 4, 4, 4, 5, 4, 4] },
  { key: 'phq9', daysAgo: 3, answers: [1, 0, 1, 0, 0, 0, 1, 0, 0] },
  { key: 'logic', daysAgo: 2, answers: [4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4] },
  { key: 'decision', daysAgo: 1, answers: [4, 4, 3, 4, 4, 4, 3, 4, 4, 3] },
]

function buildSeededHistory(): AssessmentResultDTO[] {
  // 按时间从早到晚排列，id 顺序与时间顺序一致
  const ordered = [...HISTORY_SEEDS].sort((a, b) => b.daysAgo - a.daysAgo)
  return ordered.map((seed, index) => {
    const definition = SCALE_DEFINITIONS[seed.key]
    const answers = definition.questions.map((question, i) => ({
      questionId: question.id,
      value: seed.answers[i],
    }))
    const { total, details, shape } = scoreAnswers(definition, answers)
    return {
      ...shape,
      id: index + 1,
      score: total,
      date: dayjs().subtract(seed.daysAgo, 'day').hour(20).minute(30).format('YYYY-MM-DD HH:mm'),
      scaleKey: seed.key,
      scaleName: definition.name,
      details,
      duration: 180,
    }
  })
}

function hasHistoryStorage(): boolean {
  try {
    return localStorage.getItem(HISTORY_STORAGE_KEY) !== null
  } catch {
    return true // 存储不可用时按“已有数据”处理，避免每次都尝试播种
  }
}

/** `GET /api/assessment/history` —— 倒序；首次访问自动播种演示数据 */
export function listHistory(): AssessmentResultDTO[] {
  if (!hasHistoryStorage()) {
    const seeded = buildSeededHistory()
    persistHistory(seeded)
    return [...seeded].sort((a, b) => b.id - a.id)
  }
  return loadHistory().sort((a, b) => b.id - a.id)
}

/** `POST /api/assessment/results` —— 服务端计分并写入历史 */
export function submitAssessment(input: AssessmentSubmitDTO): AssessmentResultDTO | undefined {
  const definition = SCALE_DEFINITIONS[input.scaleKey]
  if (!definition) return undefined

  const { total, details, shape } = scoreAnswers(definition, input.answers)
  const history = loadHistory()
  const nextId = history.reduce((max, item) => Math.max(max, item.id), 0) + 1

  const record: AssessmentResultDTO = {
    ...shape,
    id: nextId,
    score: total,
    date: dayjs().format('YYYY-MM-DD HH:mm'),
    scaleKey: input.scaleKey,
    scaleName: definition.name,
    details,
    duration: input.duration,
  }

  persistHistory([record, ...history].slice(0, 30))
  return record
}

/** `DELETE /api/assessment/history` —— 写入空数组而非移除 key，避免下次访问重新播种演示数据 */
export function clearHistory(): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, '[]')
  } catch {
    /* 忽略存储不可用 */
  }
}
