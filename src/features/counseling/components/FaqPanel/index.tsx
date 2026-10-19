/**
 * 【business】FaqPanel —— 常见问题面板 · 卡片化侧栏分类 + 手风琴问答
 * - el-collapse(accordion) → Collapse items 写法（accordion + activeKey 受控）
 * - el-input(prefix-icon Search + clearable) → Input prefix + allowClear
 * - 「在线咨询」经 onBook() 上抛（父级切到预约页签）
 */
import { useMemo, useState } from 'react'
import { Button, Collapse, Empty, Input } from 'antd'
import {
  BankOutlined,
  CalendarOutlined,
  LockOutlined,
  MessageOutlined,
  ReadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { faqList } from '../data'
import { useI18n } from '@/i18n'
import { useReveal } from '@/hooks/useReveal'
import styles from './FaqPanel.module.css'

export interface FaqPanelProps {
  /** 「在线咨询」点击（父级切换页签） */
  onBook: () => void
}

/** 分类配置：nameKey 经 t() 取文案，图标映射 Element Plus → antd */
const FAQ_CATEGORIES = [
  { key: 'all', nameKey: 'counseling.faq.categories.all', Icon: UnorderedListOutlined },
  { key: 'booking', nameKey: 'counseling.faq.categories.booking', Icon: CalendarOutlined },
  { key: 'service', nameKey: 'counseling.faq.categories.service', Icon: BankOutlined },
  { key: 'effect', nameKey: 'counseling.faq.categories.effect', Icon: ReadOutlined },
  { key: 'privacy', nameKey: 'counseling.faq.categories.confidentiality', Icon: LockOutlined },
] as const

export function FaqPanel({ onBook }: FaqPanelProps) {
  const { t } = useI18n()

  const layoutRef = useReveal<HTMLDivElement>({ delay: 100 })

  const [faqActiveCat, setFaqActiveCat] = useState('all')
  const [faqSearch, setFaqSearch] = useState('')
  const [faqActive, setFaqActive] = useState<string>('')

  function getFaqCount(cat: string) {
    return cat === 'all' ? faqList.length : faqList.filter(f => f.cat === cat).length
  }

  const filteredFaqs = useMemo(() => {
    let list = faqList
    if (faqActiveCat !== 'all') list = list.filter(f => f.cat === faqActiveCat)
    if (faqSearch) {
      const q = faqSearch.toLowerCase()
      list = list.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    }
    return list
  }, [faqActiveCat, faqSearch])

  // 手风琴受控：accordion 下 onChange 收到单 key，收起时为空串
  const collapseItems = filteredFaqs.map((item, i) => ({
    key: String(i),
    label: (
      <span className={styles.faqQ}>
        <span className={styles.qMark}>Q</span>
        {item.q}
      </span>
    ),
    children: <p className={styles.faqA}>{item.a}</p>,
  }))

  return (
    <div ref={layoutRef} className={styles.faqLayout}>
      <aside className={styles.faqSidebar}>
        {FAQ_CATEGORIES.map(cat => (
          <div
            key={cat.key}
            className={`${styles.faqCat}${faqActiveCat === cat.key ? ` ${styles.active}` : ''}`}
            onClick={() => setFaqActiveCat(cat.key)}
          >
            <cat.Icon />
            <span>{t(cat.nameKey)}</span>
            <span className={styles.faqCatCount}>{getFaqCount(cat.key)}</span>
          </div>
        ))}
      </aside>
      <div className={styles.faqContent}>
        <Input
          className={styles.faqSearch}
          value={faqSearch}
          placeholder={t('counseling.faq.searchPlaceholder')}
          prefix={<SearchOutlined />}
          allowClear
          onChange={e => setFaqSearch(e.target.value)}
        />
        <Collapse
          accordion
          bordered={false}
          expandIconPosition="end"
          activeKey={faqActive}
          onChange={key => setFaqActive(Array.isArray(key) ? (key[0] ?? '') : key)}
          items={collapseItems}
        />
        {filteredFaqs.length === 0 && (
          <div className={styles.emptyTip}>
            <Empty description={t('counseling.faq.empty')} />
          </div>
        )}
        <div className={styles.faqContact}>
          <MessageOutlined />
          <span>{t('counseling.faq.contactPrompt')}</span>
          <Button type="link" onClick={onBook}>
            {t('counseling.faq.contactBtn')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FaqPanel
