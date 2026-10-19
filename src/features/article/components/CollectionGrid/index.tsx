// 专题合集（ArticleCenterView），数据自取 i18n；点击卡片上抛 onSelect(title)，点击查看全部上抛 onViewAll
import { useMemo } from 'react'
import type { ComponentType } from 'react'
import { CommentOutlined, EditOutlined, MoonOutlined, RightOutlined, SunOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './CollectionGrid.module.css'

interface CollectionGridProps {
  onSelect?: (title: string) => void
  onViewAll?: () => void
}

interface CollectionDisplayItem {
  title: string
  desc: string
  count: number
  Icon: ComponentType
}

// 专题合集本地配置（count 与 icon）；EP 动态组件 <component :is> 映射为对应 AntD 图标
const collectionMeta: Array<{ count: number; Icon: ComponentType }> = [
  { count: 12, Icon: SunOutlined },
  { count: 15, Icon: MoonOutlined },
  { count: 10, Icon: EditOutlined },
  { count: 8, Icon: CommentOutlined }
]

export function CollectionGrid({ onSelect, onViewAll }: CollectionGridProps) {
  const { t, locale } = useI18n()

  // 原 Vue 版用 tm('article.collections.items') 取原始数组；React 版 t 只返回字符串，
  // 等价做法：按点路径逐项探测（t 回退缺失键时返回 key 本身），直至 items 枚举完
  const collectionItems = useMemo<CollectionDisplayItem[]>(() => {
    const items: CollectionDisplayItem[] = []
    for (let i = 0; i < 20; i++) {
      const titleKey = `article.collections.items.${i}.title`
      const title = t(titleKey)
      if (title === titleKey) break
      const meta = collectionMeta[i] ?? collectionMeta[0]
      items.push({ title, desc: t(`article.collections.items.${i}.desc`), count: meta.count, Icon: meta.Icon })
    }
    return items
  }, [t, locale])

  return (
    <div className={styles.moduleCollections}>
      <div className={styles.moduleHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.moduleTitle}>{t('article.collections.title')}</h3>
          <span className={styles.articleCount}>{t('article.collections.sub')}</span>
        </div>
        <button className={styles.viewAllLink} onClick={() => onViewAll?.()}>
          {t('article.collections.viewAll')} <RightOutlined />
        </button>
      </div>
      <div className={styles.collectionGrid}>
        {collectionItems.map(collection => (
          <div
            key={collection.title}
            className={styles.collectionCard}
            onClick={() => onSelect?.(collection.title)}
          >
            {/* collection-content / explore-text 为无样式标记类，保留字面量 */}
            <div className="collection-content">
              <div className={styles.collectionTop}>
                <div className={styles.collectionIconWrapper}>
                  <collection.Icon />
                </div>
                <span className={styles.collectionCount}>{collection.count} {t('article.collections.countUnit')}</span>
              </div>
              <h4 className={styles.collectionTitle}>{collection.title}</h4>
              <p className={styles.collectionDesc}>{collection.desc}</p>
            </div>
            <div className={styles.collectionFooter}>
              <span className="explore-text">{t('article.collections.enter')}</span>
              <RightOutlined className={styles.arrowIcon} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CollectionGrid
