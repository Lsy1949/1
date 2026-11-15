/**
 * CounselorPicker —— 心理老师选择（预约第 2 步）
 * 卡片网格替代下拉：姓名 / 职称 / 评分 / 咨询量 / 擅长方向一屏可扫，
 * 顶部搜索即时过滤；受 antd Form.Item 注入 value / onChange（老师 id）。
 */
import { useMemo, useState } from 'react'
import { Empty, Input } from 'antd'
import { CheckOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons'
import type { Counselor, CounselorAccentKey } from '../types'
import { useTranslation } from 'react-i18next'
import styles from './BookingPanel.module.css'

/** 主题色 key → CSS Module 类名（颜色只在 CSS 中定义） */
const ACCENT_CLASS: Record<CounselorAccentKey, string> = {
  primary: styles.accentPrimary,
  green: styles.accentGreen,
  purple: styles.accentPurple,
  gold: styles.accentGold,
  red: styles.accentRed,
  cyan: styles.accentCyan,
  magenta: styles.accentMagenta,
  geekblue: styles.accentGeekblue,
}

export interface CounselorPickerProps {
  counselors: Counselor[]
  value?: number
  onChange?: (value: number) => void
}

export function CounselorPicker({ counselors, value, onChange }: CounselorPickerProps) {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')

  const list = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return counselors
    return counselors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.specialties.join(' ').toLowerCase().includes(q)
    )
  }, [counselors, keyword])

  return (
    <div className={styles.cpRoot}>
      <Input
        className={styles.cpSearch}
        value={keyword}
        prefix={<SearchOutlined />}
        placeholder={t('counseling.counselors.searchPlaceholder')}
        allowClear
        onChange={(e) => setKeyword(e.target.value)}
      />

      {list.length === 0 ? (
        <div className={styles.cpEmpty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('counseling.empty.noCounselor')}
          />
        </div>
      ) : (
        <div className={styles.cpGrid}>
          {list.map((c) => {
            const active = value === c.id
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                className={`${styles.cCard}${active ? ` ${styles.isOn}` : ''}`}
                onClick={() => onChange?.(c.id)}
              >
                <span className={`${styles.cAvatar} ${ACCENT_CLASS[c.accentKey]}`}>
                  {c.name[0]}
                </span>
                <span className={styles.cBody}>
                  <span className={styles.cNameRow}>
                    <b>{c.name}</b>
                    <em>{c.title}</em>
                  </span>
                  <span className={styles.cMeta}>
                    <span className={styles.cRating}>
                      <StarOutlined /> {c.rating}
                    </span>
                    <i aria-hidden="true" />
                    <span>
                      {c.sessions}
                      {t('counseling.counselors.sessionsUnit')}
                    </span>
                  </span>
                  <span className={styles.cTags}>
                    {c.specialties.slice(0, 3).map((sp) => (
                      <span key={sp} className={styles.cTag}>
                        {sp}
                      </span>
                    ))}
                  </span>
                </span>
                <span className={styles.cCheck} aria-hidden="true">
                  <CheckOutlined />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CounselorPicker
