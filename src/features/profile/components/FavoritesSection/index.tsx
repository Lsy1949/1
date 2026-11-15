// 05 我的收藏区块 · 收藏的心理老师 + 一键预约
import { useMemo } from 'react'
import { Button, Empty } from 'antd'
import { HeartFilled, HeartOutlined, StarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { Counselor, CounselorAccentKey } from '@/features/counseling'
import styles from './FavoritesSection.module.css'

/** 主题色 key → 语义色（头像底色） */
const ACCENT_COLOR: Record<CounselorAccentKey, string> = {
  primary: 'var(--brand-primary)',
  green: 'var(--cat-green)',
  purple: 'var(--cat-purple)',
  gold: 'var(--cat-gold)',
  red: 'var(--cat-red)',
  cyan: 'var(--cat-cyan)',
  magenta: 'var(--cat-magenta)',
  geekblue: 'var(--cat-geekblue)',
}

export interface FavoritesSectionProps {
  id?: string
  counselors: Counselor[]
  /** 去心理老师列表 */
  onBrowse: () => void
  /** 直接预约某位老师 */
  onBook: (id: number) => void
  /** 已收藏的老师 id 列表 */
  favoriteIds: number[]
  /** 收藏 / 取消收藏某位老师 */
  onToggleFavorite: (id: number) => void
}

export function FavoritesSection({
  id,
  counselors,
  onBrowse,
  onBook,
  favoriteIds,
  onToggleFavorite,
}: FavoritesSectionProps) {
  const { t } = useTranslation()

  const favorites = useMemo(
    () => counselors.filter((c) => favoriteIds.includes(c.id)),
    [counselors, favoriteIds]
  )

  return (
    <section id={id} className={styles.magSection}>
      <div className={styles.secHead}>
        <span className={styles.secNum}>05</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.favorites.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.favorites.desc')}</p>
        </div>
        <button type="button" className={styles.headAction} onClick={onBrowse}>
          {t('profile.card.favorites.browse')}
        </button>
      </div>

      {favorites.length === 0 ? (
        <div className={styles.empty}>
          <Empty
            image={<HeartOutlined className={styles.emptyIcon} />}
            description={t('profile.card.favorites.empty')}
          >
            <Button type="primary" onClick={onBrowse}>
              {t('profile.card.favorites.browse')}
            </Button>
          </Empty>
        </div>
      ) : (
        <div className={styles.cards}>
          {favorites.map((c) => (
            <article key={c.id} className={styles.card}>
              <header className={styles.cardHead}>
                <span
                  className={styles.avatar}
                  style={{ background: ACCENT_COLOR[c.accentKey] }}
                  aria-hidden="true"
                >
                  {c.name[0]}
                </span>
                <div className={styles.identity}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.title}>{c.title}</span>
                </div>
                <button
                  type="button"
                  className={styles.unfav}
                  aria-label={t('counseling.favorites.remove')}
                  title={t('counseling.favorites.remove')}
                  onClick={() => onToggleFavorite(c.id)}
                >
                  <HeartFilled />
                </button>
              </header>

              <div className={styles.metaRow}>
                <span className={styles.rating}>
                  <StarOutlined /> {c.rating}
                </span>
                <span className={styles.dot} aria-hidden="true" />
                <span>
                  {c.sessions}
                  {t('counseling.counselors.sessionsUnit')}
                </span>
                <span className={styles.dot} aria-hidden="true" />
                <span>
                  {c.exp}
                  {t('counseling.counselors.yearsSuffix')}
                </span>
              </div>

              <p className={styles.intro}>{c.intro}</p>

              <div className={styles.tags}>
                {c.specialties.slice(0, 3).map((sp) => (
                  <span key={sp} className={styles.tag}>
                    {sp}
                  </span>
                ))}
              </div>

              <Button type="primary" block onClick={() => onBook(c.id)}>
                {t('counseling.btn.book')}
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default FavoritesSection
