// 测评共享静态数据 —— 自 Vue 版原样迁移（icon 字段保持 Element Plus 图标名字符串，
// 渲染层由 components/ScaleIcon/index.tsx 的注册表映射为 Ant Design 图标）
import type {
  ScaleInfo,
  ScaleDefinition,
  OptionItem
} from './types'

export type {
  ScaleInfo,
  AssessmentRecord,
  ScaleResult,
  ScaleQuestion,
  ScaleDefinition,
  OptionItem
} from './types'

// localStorage 存储 Key
export const ASSESSMENT_STORAGE_KEY = 'edu_assessment_records'

// --- 分类定义 ---
export const categories = [
  { key: 'all', name: '全部' },
  { key: 'mental', name: '心理健康' },
  { key: 'career', name: '生涯发展' },
  { key: 'cognitive', name: '认知能力' },
  { key: 'esports', name: '电竞能力' },
  { key: 'learning', name: '学习风格' },
  { key: 'social', name: '人际关系' }
]

export function getCategoryName(key?: string) {
  if (key === 'all') return '全部测评'
  return categories.find(c => c.key === key)?.name || '全部测评'
}

// --- 测评列表（广场卡片展示用） ---
export const scaleList: ScaleInfo[] = [
  // 心理健康
  { key: 'phq9', name: '抑郁自评 PHQ-9', desc: '评估近两周情绪低落与兴趣减退程度', duration: '3min', count: 9, category: 'mental', icon: 'TrendCharts', difficulty: '入门', available: true, tags: ['情绪', '自评'] },
  { key: 'gad7', name: '焦虑自评 GAD-7', desc: '识别紧张、担忧与焦虑状态', duration: '3min', count: 7, category: 'mental', icon: 'Odometer', difficulty: '入门', available: true, tags: ['焦虑', '自评'] },
  { key: 'pss', name: '压力感知 PSS-10', desc: '测评生活压力感知水平', duration: '5min', count: 10, category: 'mental', icon: 'Compass', difficulty: '入门', available: false, tags: ['压力'] },
  // 生涯发展
  { key: 'riasec', name: '职业兴趣 RIASEC', desc: '探索霍兰德职业兴趣代码', duration: '8min', count: 18, category: 'career', icon: 'User', difficulty: '进阶', available: true, tags: ['职业', '兴趣'] },
  { key: 'mbti', name: '性格倾向 MBTI', desc: '了解性格心理偏好与类型', duration: '10min', count: 20, category: 'career', icon: 'Collection', difficulty: '进阶', available: true, tags: ['性格', '类型'] },
  // 认知能力
  { key: 'reaction', name: '反应速度测试', desc: '测量视觉反应与决策速度', duration: '2min', count: 10, category: 'cognitive', icon: 'Lightning', difficulty: '入门', available: false, tags: ['反应', '速度'] },
  { key: 'memory', name: '短时记忆测评', desc: '评估工作记忆容量与精度', duration: '5min', count: 8, category: 'cognitive', icon: 'Cpu', difficulty: '进阶', available: false, tags: ['记忆'] },
  { key: 'logic', name: '逻辑推理测试', desc: '测评演绎与归纳推理能力', duration: '8min', count: 12, category: 'cognitive', icon: 'Opportunity', difficulty: '进阶', available: false, tags: ['逻辑'] },
  // 电竞能力
  { key: 'aim', name: '瞄准精度测试', desc: '测试鼠标控制与瞄准精度', duration: '3min', count: 5, category: 'esports', icon: 'Aim', difficulty: '入门', available: false, tags: ['FPS', '精度'] },
  { key: 'flick', name: '快速转向反应', desc: '评估瞬时转向与瞄准能力', duration: '4min', count: 8, category: 'esports', icon: 'Aim', difficulty: '进阶', available: false, tags: ['FPS', '反应'] },
  { key: 'decision', name: '瞬时决策测试', desc: '评估高压下的决策速度', duration: '4min', count: 10, category: 'esports', icon: 'Lightning', difficulty: '进阶', available: false, tags: ['决策', '反应'] },
  // 学习风格
  { key: 'vark', name: '学习风格 VARK', desc: '识别视觉/听觉/读写/动觉偏好', duration: '5min', count: 16, category: 'learning', icon: 'Reading', difficulty: '入门', available: false, tags: ['学习'] },
  // 人际关系
  { key: 'sas', name: '社交焦虑量表', desc: '评估社交互动中的焦虑水平', duration: '5min', count: 20, category: 'social', icon: 'ChatDotRound', difficulty: '进阶', available: false, tags: ['社交'] },
  { key: 'eq', name: '共情能力自评', desc: '测评情感共情与理解水平', duration: '6min', count: 15, category: 'social', icon: 'Connection', difficulty: '进阶', available: false, tags: ['共情'] }
]

// --- 量表选项配置（按题目类型） ---
export const scaleOptions: Record<'frequency' | 'agreement' | 'mbti', OptionItem[]> = {
  frequency: [
    { label: '完全没有', value: 0 },
    { label: '有几天', value: 1 },
    { label: '一半以上的天数', value: 2 },
    { label: '几乎每天', value: 3 }
  ],
  agreement: [
    { label: '非常不同意', value: 1 },
    { label: '不同意', value: 2 },
    { label: '一般', value: 3 },
    { label: '同意', value: 4 },
    { label: '非常同意', value: 5 }
  ],
  mbti: [
    { label: '非常符合 A', value: 'A2' },
    { label: '比较符合 A', value: 'A1' },
    { label: '比较符合 B', value: 'B1' },
    { label: '非常符合 B', value: 'B2' }
  ]
}

// --- 量表定义 ---
// 题目与计分取答题页实际运行的版本（测评结果由此计算并持久化）；
// description 供中心页介绍弹窗展示
export const scales: Record<string, ScaleDefinition> = {
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
      { id: 9, text: '有不如死掉或想伤害自己的念头' }
    ],
    calc: (score) => ({
      level: score <= 4 ? '健康' : score <= 9 ? '轻度' : score <= 14 ? '中度' : '重度',
      levelTag: score <= 4 ? 'success' : score <= 9 ? 'info' : score <= 14 ? 'warning' : 'danger',
      title: score <= 4 ? '情绪状态良好' : '需要关注情绪',
      insight: '系统已完成深度分析。',
      suggestion: '保持良好的生活习惯。'
    })
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
      { id: 7, text: '感到好像有什么可怕的事会发生' }
    ],
    calc: (score) => ({
      level: score <= 4 ? '正常' : score <= 9 ? '轻度' : '显著',
      levelTag: score <= 4 ? 'success' : score <= 9 ? 'info' : 'warning',
      title: score <= 4 ? '心态平和' : '建议情绪疏导',
      insight: '焦虑水平分析完成。',
      suggestion: '尝试深呼吸和正念。'
    })
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
      { id: 12, text: '我喜欢按照既定流程精确办事', type: 'C' }
    ],
    calc: (_score, details) => {
      const sorted = Object.entries(details).sort((a, b) => b[1] - a[1])
      const code = sorted.slice(0, 3).map(i => i[0]).join('')
      return {
        level: code,
        levelTag: 'primary',
        title: '职业兴趣代码：' + code,
        insight: '您的职业兴趣倾向分析完成。',
        suggestion: '建议关注匹配度较高的行业。'
      }
    }
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
      { id: 10, text: '处理问题时：A.脚踏实地；B.脑洞大开', dim: 'SN' }
    ],
    calc: (_score, details) => {
      const type = (details.E >= details.I ? 'E' : 'I') +
                   (details.S >= details.N ? 'S' : 'N') +
                   (details.T >= details.F ? 'T' : 'F') +
                   (details.J >= details.P ? 'J' : 'P')
      return {
        level: type,
        levelTag: 'danger',
        title: '您的性格类型是 ' + type,
        insight: '性格倾向深度分析完成。',
        suggestion: '了解性格有助于提升沟通效率。'
      }
    }
  }
}
