/**
 * 【business】ConsultantsPanel —— 心理老师面板 · 杂志编辑式列表 + 关注方向匹配
 * 数据由页面注入（counselors / specialties），组件内只做筛选与展示。
 *
 * 桌面优先的改造：
 *  · 「关注方向」多选（≤3）→ 客户端给出匹配度，并默认按匹配度排序，帮同学快速收敛选择；
 *  · 搜索 + 排序（评分 / 经验 / 咨询量 / 匹配度）常驻工具栏，吸顶不随列表滚走；
 *  · 行内悬停展开简介、显示「预约」与箭头，详情弹窗保留完整档案。
 * 预约行为经 onBook(id) 上抛（父级负责 prefill + 切到预约页签）。
 */
import { useMemo, useState } from 'react'
import { Button, Empty, Input, Modal, Segmented } from 'antd'
import {
  ArrowRightOutlined,
  BankOutlined,
  HeartFilled,
  HeartOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { Counselor, CounselorAccentKey } from '../types'
import { useTranslation } from 'react-i18next'
import { useReveal } from '@/hooks/useReveal'
import styles from './ConsultantsPanel.module.css'

export interface ConsultantsPanelProps {
  counselors: Counselor[]
  specialties: string[]
  /** 已收藏老师 ID（接口下发，页面注入） */
  favoriteIds: number[]
  /** 收藏 / 取消收藏（页面调用接口 mutation） */
  onToggleFavorite: (id: number) => void
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

type SortKey = 'match' | 'rating' | 'exp' | 'sessions'

/** 关注方向最多同时选 3 个，避免条件互相排斥到无结果 */
const MAX_FOCUS = 3

export function ConsultantsPanel({
  counselors,
  specialties,
  favoriteIds,
  onToggleFavorite,
  onBook,
}: ConsultantsPanelProps) {
  const { t } = useTranslation()

  const ribbonRef = useReveal<HTMLDivElement>({ delay: 80 })
  const rowsRef = useReveal<HTMLDivElement>({ delay: 160 })

  const [keyword, setKeyword] = useState('')
  const [gender, setGender] = useState('')
  const [focus, setFocus] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('rating')
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  function toggleFocus(tag: string) {
    setFocus((prev) => {
      const exists = prev.includes(tag)
      const next = exists ? prev.filter((item) => item !== tag) : [...prev, tag].slice(-MAX_FOCUS)
      // 首个关注方向落定即切到匹配度排序；清空则回到评分排序
      if (next.length > 0) setSort('match')
      else setSort('rating')
      return next
    })
  }

  // ============ 匹配度 + 筛选 + 排序 ============
  const list = useMemo(() => {
    const q = keyword.trim().toLowerCase()

    const scored = counselors.map((c) => {
      const hits = focus.filter((tag) => c.specialties.includes(tag))
      return { counselor: c, score: focus.length ? hits.length / focus.length : 0 }
    })

    const filtered = scored.filter(({ counselor: c, score }) => {
      if (onlyFavorites && !favoriteIds.includes(c.id)) return false
      if (gender && c.gender !== gender) return false
      if (focus.length > 0 && score === 0) return false
      if (q) {
        const haystack = `${c.name} ${c.title} ${c.specialties.join(' ')} ${c.intro}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    filtered.sort((a, b) => {
      if (sort === 'match') {
        if (b.score !== a.score) return b.score - a.score
        return b.counselor.rating - a.counselor.rating
      }
      if (sort === 'exp') return b.counselor.exp - a.counselor.exp
      if (sort === 'sessions') return b.counselor.sessions - a.counselor.sessions
      return b.counselor.rating - a.counselor.rating
    })

    return filtered
  }, [counselors, focus, gender, keyword, sort, onlyFavorites, favoriteIds])

  const sortOptions = useMemo(
    () => [
      ...(focus.length > 0
        ? [{ value: 'match' as SortKey, label: t('counseling.counselors.sortByMatch') }]
        : []),
      { value: 'rating' as SortKey, label: t('counseling.counselors.sortByRating') },
      { value: 'exp' as SortKey, label: t('counseling.counselors.sortByExperience') },
      { value: 'sessions' as SortKey, label: t('counseling.counselors.sortBySessions') },
    ],
    [focus.length, t]
  )

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
      {/* ============ 关注方向：多选 → 匹配度 ============ */}
      <section className={styles.matchPanel}>
        <div className={styles.matchHead}>
          <div>
            <h3 className={styles.matchTitle}>{t('counseling.match.title')}</h3>
            <p className={styles.matchDesc}>{t('counseling.match.desc')}</p>
          </div>
          {focus.length > 0 && (
            <button type="button" className={styles.matchClear} onClick={() => setFocus([])}>
              {t('counseling.match.clear')}
            </button>
          )}
        </div>
        <div className={styles.matchChips}>
          {specialties.map((tag) => {
            const active = focus.includes(tag)
            const disabled = !active && focus.length >= MAX_FOCUS
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                className={`${styles.chip}${active ? ` ${styles.chipOn}` : ''}`}
                onClick={() => toggleFocus(tag)}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </section>

      {/* ============ 工具栏：搜索 + 性别 + 排序 ============ */}
      <div ref={ribbonRef} className={styles.consToolbar}>
        <Input
          className={styles.tbSearch}
          value={keyword}
          prefix={<SearchOutlined className={styles.searchIco} />}
          placeholder={t('counseling.counselors.searchPlaceholderAlt')}
          allowClear
          variant="borderless"
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className={styles.tbFilters}>
          <span className={styles.tbLabel}>{t('counseling.counselors.gender')}</span>
          {[
            { value: '', label: t('counseling.counselors.genderAll') },
            { value: 'male', label: t('counseling.counselors.male') },
            { value: 'female', label: t('counseling.counselors.female') },
          ].map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              aria-pressed={gender === item.value}
              className={`${styles.miniChip}${gender === item.value ? ` ${styles.chipOn}` : ''}`}
              onClick={() => setGender(item.value)}
            >
              {item.label}
            </button>
          ))}
          <span className={styles.tbDivider} aria-hidden="true" />
          <button
            type="button"
            aria-pressed={onlyFavorites}
            className={`${styles.miniChip}${onlyFavorites ? ` ${styles.chipOn}` : ''}`}
            onClick={() => setOnlyFavorites((value) => !value)}
          >
            <HeartFilled /> {t('counseling.favorites.only')}
            <span className={styles.favCount}>{favoriteIds.length}</span>
          </button>
        </div>
        <Segmented
          className={styles.tbSort}
          value={sort}
          options={sortOptions}
          onChange={(value) => setSort(value as SortKey)}
        />
      </div>

      {/* 结果标题 */}
      <div className={styles.rowsHeading}>
        <span className={styles.headingName}>{t('counseling.tabs.counselors')}</span>
        <span className={styles.headingLine} />
        <span className={styles.headingCount}>
          {String(list.length).padStart(2, '0')} {t('counseling.counselors.count')}
        </span>
      </div>

      {/* 心理老师列表：横向编辑式行 */}
      <div ref={rowsRef} className={styles.counselorRows}>
        {list.map(({ counselor: c, score }, i) => {
          const isBest = focus.length > 0 && i === 0 && score > 0
          return (
            <div
              key={c.id}
              className={styles.counselorRow}
              data-best={isBest ? 'true' : undefined}
              onClick={(e) => {
                // 整行鼠标点击打开详情；按钮内部（rowMain/rowBook）自行处理，不重复触发
                if ((e.target as HTMLElement).closest('button')) return
                openCounselorDetail(c)
              }}
            >
              <div className={styles.rowNumber}>
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className={`${styles.rowAvatar} ${ACCENT_CLASS[c.accentKey]}`}>{c.name[0]}</div>
              {/* 行主按钮：原生 button 自带键盘与焦点语义；
                  <button> 内容模型只允许 phrasing content，内部一律用 span + CSS display */}
              <button
                type="button"
                className={`${styles.rowMain} btn-reset`}
                onClick={() => openCounselorDetail(c)}
              >
                <span className={styles.rowTitleWrap}>
                  <span className={styles.rowTitle}>{c.name}</span>
                  <span className={styles.rowTitleSub}>{c.title}</span>
                  <span className={styles.rowFree}>{t('counseling.freeTag')}</span>
                  {focus.length > 0 && (
                    <span className={styles.rowMatch}>
                      {t('counseling.match.score')} {Math.round(score * 100)}%
                    </span>
                  )}
                  {isBest && <span className={styles.rowBest}>{t('counseling.match.best')}</span>}
                </span>
                <span className={styles.rowDesc}>{c.intro}</span>
                <span className={styles.rowTags}>
                  {c.specialties.map((sp) => (
                    <span
                      key={sp}
                      className={`${styles.rowTag}${focus.includes(sp) ? ` ${styles.rowTagOn}` : ''}`}
                    >
                      {sp}
                    </span>
                  ))}
                </span>
              </button>
              <div className={styles.rowMeta}>
                <button
                  type="button"
                  aria-pressed={favoriteIds.includes(c.id)}
                  aria-label={
                    favoriteIds.includes(c.id)
                      ? t('counseling.favorites.remove')
                      : t('counseling.favorites.add')
                  }
                  className={`${styles.favBtn}${favoriteIds.includes(c.id) ? ` ${styles.favOn}` : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite(c.id)
                  }}
                >
                  {favoriteIds.includes(c.id) ? <HeartFilled /> : <HeartOutlined />}
                </button>
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onBook(c.id)
                  }}
                >
                  {t('counseling.btn.book')}
                </button>
                <ArrowRightOutlined className={styles.rowArrow} />
              </div>
            </div>
          )
        })}
      </div>

      {list.length === 0 && (
        <div className={styles.emptyTip}>
          <Empty description={t('counseling.counselors.empty')} />
        </div>
      )}

      {/* 咨询师详情弹窗（counselor-dialog 为无样式语义标记类，保留字面量） */}
      <Modal
        open={currentCounselor !== null}
        onCancel={closeCounselorDetail}
        width={640}
        centered
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
                {currentCounselor.specialties.map((sp) => (
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
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarFilled key={s} />
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
