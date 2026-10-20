import type { CSSProperties } from 'react'
import { Radio } from 'antd'
import type { OptionItem, ScaleQuestion } from '../types'
import styles from './QuestionCard.module.css'

interface Props {
  index: number
  total: number
  question?: ScaleQuestion
  options: OptionItem[]
  answer?: number | string
  categoryLabel: string
  /** 选择后上抛（对应原 emit('select', qid, value)） */
  onSelect: (qid: number, value: number | string) => void
}

/** 沉浸式答题 · 题目卡片（antd Radio.Group，保留原有卡片式外观） */
export default function QuestionCard({
  index,
  total,
  question,
  options,
  answer,
  categoryLabel,
  onSelect,
}: Props) {
  return (
    <div className={styles.qCardImmersive}>
      <div className={styles.qHeader}>
        <div className={styles.qBadgeRow}>
          <span className={styles.qBadge}>Q{index + 1}</span>
          <span className={styles.qCategoryTag}>{categoryLabel}</span>
          <span className={styles.qProgressMark}>{index + 1} / {total}</span>
        </div>
        <h2 className={styles.qText}>{question?.text}</h2>
      </div>

      <Radio.Group
        className={styles.qOptionsImmersive}
        value={answer}
        onChange={(e) => {
          if (question) onSelect(question.id, e.target.value as number | string)
        }}
      >
        {options.map((opt, idx) => (
          <Radio.Button
            key={opt.value}
            value={opt.value}
            className={styles.optCard}
            // 原 :style="{ '--delay': ... }" —— CSS 自定义属性需类型断言
            style={{ '--delay': `${idx * 0.05}s` } as CSSProperties}
          >
            <div className={styles.optContent}>
              <div className={styles.optIndex}>{String.fromCharCode(65 + idx)}</div>
              <span className={styles.optLabel}>{opt.label}</span>
            </div>
          </Radio.Button>
        ))}
      </Radio.Group>
    </div>
  )
}
