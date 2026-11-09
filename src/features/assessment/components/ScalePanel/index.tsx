import {
  ArrowRightOutlined,
  BookOutlined,
  FieldTimeOutlined,
  InfoCircleFilled,
  SearchOutlined,
} from '@ant-design/icons'
import { ConfigProvider, Empty, Tabs } from 'antd'
import { useReveal } from '@/hooks/useReveal'
import { useTranslation } from 'react-i18next'
import ScaleIcon from '@/components/ScaleIcon'
import type { ScaleInfo } from '../types'
import styles from './ScalePanel.module.css'

/**
 * 分类页签作用域 token：与主 tab 同一套「极简文字」语言；
 * 间距全部保持 antd 默认（对称 padding，横线与文字自然对齐），仅收敛配色与字号。
 */
const ribbonTabsTheme = {
  components: {
    Tabs: {
      titleFontSize: 15,
      itemColor: 'var(--text-faint)',
      itemSelectedColor: 'var(--brand-primary)',
      inkBarColor: 'var(--brand-primary)',
      horizontalMargin: '0 0 0 0',
    },
  },
}

interface Props {
  categories: { key: string; name: string; count: number }[]
  activeCategory: string
  scales: ScaleInfo[]
  completedKeys: string[]
  searchQuery: string
  /** v-model:search-query → 受控 value + onChange 回调 */
  onSearchQueryChange: (value: string) => void
  /** v-model:active-category → 受控 value + onChange 回调 */
  onActiveCategoryChange: (key: string) => void
  /** 原 @select 事件 */
  onSelect: (scale: ScaleInfo) => void
}

/** 测评广场面板：编号式分类导航 + 极简搜索 + 编辑式行列表 */
export default function ScalePanel({
  categories,
  activeCategory,
  scales,
  completedKeys,
  searchQuery,
  onSearchQueryChange,
  onActiveCategoryChange,
  onSelect,
}: Props) {
  const { t } = useTranslation()
  const ribbonRef = useReveal<HTMLDivElement>({ delay: 80 })

  // 分类页签 items：label = 名称；数量作上标徽标绝对定位（不撑宽页签，ink bar 只跟随文字宽度）
  const categoryItems = categories.map((cat) => ({
    key: cat.key,
    label: (
      <span className={styles.catLabel}>
        {cat.name}
        <sup className={styles.catCount}>{cat.count}</sup>
      </span>
    ),
  }))

  return (
    <>
      {/* 分类页签（antd Tabs）+ 极简搜索（tabBarExtraContent） */}
      <div ref={ribbonRef} className={styles.scaleRibbon}>
        <ConfigProvider theme={ribbonTabsTheme}>
          <Tabs
            className={styles.ribbonTabs}
            activeKey={activeCategory}
            onChange={onActiveCategoryChange}
            items={categoryItems}
            tabBarExtraContent={{
              right: (
                <div className={styles.ribbonSearch}>
                  <SearchOutlined className={styles.searchIco} />
                  <input
                    value={searchQuery}
                    placeholder={t('assessment.searchPlaceholder')}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                  />
                </div>
              ),
            }}
          />
        </ConfigProvider>
      </div>

      {/* 当前分类小标题 */}
      {scales.length > 0 && (
        <div className={styles.rowsHeading}>
          <span className={styles.headingName}>
            {activeCategory === 'all'
              ? '全部测评'
              : categories.find((c) => c.key === activeCategory)?.name}
          </span>
          <span className={styles.headingLine} />
          <span className={styles.headingCount}>
            {String(scales.length).padStart(2, '0')} {t('assessment.unit.items')}
          </span>
        </div>
      )}

      {/* 测评列表：编辑式网格卡片 */}
      {scales.length > 0 ? (
        <div className={styles.scaleRows}>
          {scales.map((scale, i) => (
            <div
              key={scale.key}
              className={[
                styles.scaleRow,
                completedKeys.includes(scale.key) ? styles.isCompleted : '',
                !scale.available ? styles.isUnavailable : '',
              ].join(' ').trim()}
              onClick={() => onSelect(scale)}
            >
              <div className={styles.rowNumber}>
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                {/* cat- 为运行时动态分类类（协议类，保留字面量） */}
                <div className={`${styles.rowIcon} cat-${scale.category}`}>
                  {/* 原 <component :is="scale.icon" /> → 字符串图标注册表 */}
                  <ScaleIcon name={scale.icon} />
                </div>
              </div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitleWrap}>
                  <h3 className={styles.rowTitle}>{scale.name}</h3>
                  {completedKeys.includes(scale.key) ? (
                    <span className={`${styles.rowStatus} ${styles.done}`}>{t('assessment.status.completed')}</span>
                  ) : !scale.available ? (
                    <span className={`${styles.rowStatus} ${styles.soon}`}>{t('assessment.status.comingSoon')}</span>
                  ) : null}
                </div>
                <p className={styles.rowDesc}>{scale.desc}</p>
                <div className={styles.rowTags}>
                  {scale.tags.map((tag) => (
                    <span key={tag} className={styles.rowTag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.metaItem}>
                  <FieldTimeOutlined />
                  {scale.duration}
                </span>
                <span className={styles.metaItem}>
                  <BookOutlined />
                  {scale.count}{t('assessment.unit.questions')}
                </span>
                <span className={styles.metaDifficulty}>{scale.difficulty}</span>
                <ArrowRightOutlined className={styles.rowArrow} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.filterEmpty}>
          <Empty description={t('assessment.empty')} imageStyle={{ height: 80 }} />
        </div>
      )}

      {/* 提示 */}
      <div className={styles.footerTip}>
        <InfoCircleFilled />
        <span>{t('assessment.disclaimer')}</span>
      </div>
    </>
  )
}
