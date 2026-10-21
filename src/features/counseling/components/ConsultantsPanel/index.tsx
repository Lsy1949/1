/**
 * 【business】ConsultantsPanel —— 心理老师面板 · 杂志编辑式列表 + 咨询师详情弹窗
 * 数据由页面注入（counselors / specialties），组件内只做筛选与展示。
 * - v-reveal → useReveal；el-select → Select；el-dialog → Modal；el-empty → Empty
 * - 预约行为经 onBook(id) 上抛（父级负责 prefill + 切到预约页签）
 */
import { useMemo, useState } from 'react'
import { Button, Empty, Input, Modal, Select } from 'antd'
import {
  ArrowRightOutlined,
  BankOutlined,
  SearchOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { Counselor, CounselorAccentKey } from '../types'
import { useI18n } from '@/i18n'
import { useReveal } from '@/hooks/useReveal'
import styles from './ConsultantsPanel.module.css'

export interface ConsultantsPanelProps {
  counselors: Counselor[]
  specialties: string[]
  /** 「预约」点击（行内按钮 / 详情弹窗按钮），父级负责预填并切换页签 */
  onBook: (id: number) => void
}

/** 语义色 key → CSS Module 类名（颜色只在 CSS 中定义） */
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

interface ConsFilter {
  specialty: string
  gender: string
  sort: string
}

const INITIAL_FILTER: ConsFilter = { specialty: '', gender: '', sort: 'rating' }

export function ConsultantsPanel({ counselors, specialties, onBook }: ConsultantsPanelProps) {
  const { t } = useI18n()

  const ribbonRef = useReveal<HTMLDivElement>({ delay: 80 })
  const rowsRef = useReveal<HTMLDivElement>({ delay: 160 })

  // ============ 咨询师列表筛选 ============
  const [consultantSearch, setConsultantSearch] = useState('')
  const [consFilter, setConsFilter] = useState<ConsFilter>(INITIAL_FILTER)

  const filteredConsultants = useMemo(() => {
    let list = counselors.filter(c => {
      if (consFilter.specialty && !c.specialties.includes(consFilter.specialty)) return false
      if (consFilter.gender && c.gender !== consFilter.gender) return false
      if (consultantSearch) {
        const q = consultantSearch.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.specialties.join(' ').toLowerCase().includes(q) &&
          !c.intro.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
    if (consFilter.sort === 'rating') list = list.slice().sort((a, b) => b.rating - a.rating)
    else if (consFilter.sort === 'exp') list = list.slice().sort((a, b) => b.exp - a.exp)
    else if (consFilter.sort === 'sessions') list = list.slice().sort((a, b) => b.sessions - a.sessions)
    return list
  }, [counselors, consFilter, consultantSearch])

  // 咨询师详情（visible 与当前对象合一，等价 counselorDetailVisible + currentCounselor）
  const [currentCounselor, setCurrentCounselor] = useState<Counselor | null>(null)

  function openCounselorDetail(c: Counselor) {
    setCurrentCounselor(c)
  }

  function closeCounselorDetail() {
    setCurrentCounselor(null)
  }

  function bookFromDialog() {
    if (currentCounselor === null) return
    const id = currentCounselor.id
    closeCounselorDetail()
    onBook(id)
  }

  return (
    <>
      {/* 极简搜索 + 筛选 */}
      <div ref={ribbonRef} className={styles.consRibbon}>
        <Input
          className={styles.ribbonSearch}
          value={consultantSearch}
          prefix={<SearchOutlined className={styles.searchIco} />}
          placeholder={t('counseling.counselors.searchPlaceholderAlt')}
          allowClear
          variant="borderless"
          onChange={e => setConsultantSearch(e.target.value)}
        />
        <div className={styles.consFilters}>
          <Select
            className={styles.consSelect}
            value={consFilter.specialty || undefined}
            placeholder={t('counseling.counselors.specialty')}
            allowClear
            options={specialties.map(s => ({ label: s, value: s }))}
            onChange={(v: string | undefined) => setConsFilter(f => ({ ...f, specialty: v ?? '' }))}
          />
          <Select
            className={styles.consSelect}
            value={consFilter.gender || undefined}
            placeholder={t('counseling.counselors.gender')}
            allowClear
            options={[
              { label: t('counseling.counselors.male'), value: 'male' },
              { label: t('counseling.counselors.female'), value: 'female' },
            ]}
            onChange={(v: string | undefined) => setConsFilter(f => ({ ...f, gender: v ?? '' }))}
          />
          <Select
            className={styles.consSelect}
            value={consFilter.sort}
            placeholder={t('counseling.counselors.sort')}
            options={[
              { label: t('counseling.counselors.sortByRating'), value: 'rating' },
              { label: t('counseling.counselors.sortByExperience'), value: 'exp' },
              { label: t('counseling.counselors.sortBySessions'), value: 'sessions' },
            ]}
            onChange={(v: string) => setConsFilter(f => ({ ...f, sort: v }))}
          />
        </div>
      </div>

      {/* 当前分类小标题 */}
      {filteredConsultants.length > 0 && (
        <div className={styles.rowsHeading}>
          <span className={styles.headingName}>{t('counseling.tabs.counselors')}</span>
          <span className={styles.headingLine} />
          <span className={styles.headingCount}>
            {String(filteredConsultants.length).padStart(2, '0')} {t('counseling.counselors.count')}
          </span>
        </div>
      )}

      {/* 心理老师列表：横向编辑式行 */}
      <div ref={rowsRef} className={styles.counselorRows}>
        {filteredConsultants.map((c, i) => (
          <div
            key={c.id}
            className={styles.counselorRow}
            onClick={(e) => {
              // 整行鼠标点击打开详情；按钮内部（rowMain/rowBook）自行处理，不重复触发
              if ((e.target as HTMLElement).closest('button')) return
              openCounselorDetail(c)
            }}
          >
            <div className={styles.rowNumber}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className={`${styles.rowAvatar} ${ACCENT_CLASS[c.accentKey]}`}>
              {c.name[0]}
            </div>
            {/* 行主按钮：承接原 rowMain 内容，原生 button 自带键盘与焦点语义（A2 修复）。
                <button> 内容模型只允许 phrasing content，内部块级一律用 span + CSS display 控制（视觉 1:1） */}
            <button
              type="button"
              className={`${styles.rowMain} btn-reset`}
              onClick={() => openCounselorDetail(c)}
            >
              <span className={styles.rowTitleWrap}>
                <span className={styles.rowTitle}>{c.name}</span>
                <span className={styles.rowTitleSub}>{c.title}</span>
                <span className={styles.rowFree}>{t('counseling.freeTag')}</span>
              </span>
              <span className={styles.rowDesc}>{c.intro}</span>
              <span className={styles.rowTags}>
                {c.specialties.map(sp => (
                  <span key={sp} className={styles.rowTag}>
                    {sp}
                  </span>
                ))}
              </span>
            </button>
            <div className={styles.rowMeta}>
              <span className={styles.metaRating}>
                <StarOutlined />
                {c.rating}
              </span>
              <span className={styles.metaSessions}>
                {c.sessions}
                {t('counseling.counselors.sessionsSuffix')}
              </span>
              <button
                type="button"
                className={styles.rowBook}
                onClick={e => {
                  e.stopPropagation()
                  onBook(c.id)
                }}
              >
                {t('counseling.btn.book')}
              </button>
              <ArrowRightOutlined className={styles.rowArrow} />
            </div>
          </div>
        ))}
      </div>
      {filteredConsultants.length === 0 && (
        <div className={styles.emptyTip}>
          <Empty description={t('counseling.counselors.empty')} />
        </div>
      )}

      {/* 咨询师详情弹窗（counselor-dialog 为无样式语义标记类，保留字面量） */}
      <Modal
        open={currentCounselor !== null}
        onCancel={closeCounselorDetail}
        width={640}
        className="counselor-dialog"
        title={currentCounselor ? `${currentCounselor.name} · ${currentCounselor.title}` : ''}
        footer={[
          <Button key="close" onClick={closeCounselorDetail}>
            {t('counseling.btn.close')}
          </Button>,
          <Button key="book" type="primary" onClick={bookFromDialog}>
            {t('counseling.btn.bookThis')}
          </Button>,
        ]}
      >
        {currentCounselor && (
          <div className={styles.cdContent}>
            <div className={styles.cdHeader}>
              <div className={`${styles.cdAvatar} ${ACCENT_CLASS[currentCounselor.accentKey]}`}>
                {currentCounselor.name[0]}
              </div>
              {/* cd-meta 为无样式语义标记类（全仓与旧构建产物均无定义），保留字面量 */}
              <div className="cd-meta">
                <div className={styles.cdName}>{currentCounselor.name}</div>
                <div className={styles.cdTitle}>
                  {currentCounselor.title} · {currentCounselor.exp}
                  {t('counseling.counselors.yearsSuffix')}
                </div>
                <div className={styles.cdStats}>
                  <span>
                    <StarOutlined /> {currentCounselor.rating}
                  </span>
                  <span>
                    <UserOutlined /> {currentCounselor.sessions}
                    {t('counseling.counselors.sessionsUnit')}
                  </span>
                  <span>
                    <BankOutlined /> {currentCounselor.education}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.cdSection}>
              <h4>{t('counseling.counselors.dialog.intro')}</h4>
              <p>{currentCounselor.intro}</p>
            </div>
            <div className={styles.cdSection}>
              <h4>{t('counseling.counselors.dialog.specialties')}</h4>
              <div className={styles.cdSpecs}>
                {currentCounselor.specialties.map(sp => (
                  <span key={sp} className={styles.cdSpec}>
                    {sp}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.cdSection}>
              <h4>{t('counseling.counselors.dialog.background')}</h4>
              <ul className={styles.cdEdu}>
                {currentCounselor.background.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
            <div className={styles.cdSection}>
              <h4>{t('counseling.counselors.dialog.reviews')}</h4>
              {currentCounselor.reviews.map((r, i) => (
                <div key={i} className={styles.cdReview}>
                  <div className={styles.rvStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <StarOutlined key={s} />
                    ))}
                  </div>
                  <p>{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default ConsultantsPanel
