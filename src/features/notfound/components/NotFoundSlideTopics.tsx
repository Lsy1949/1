/**
 * 【business】NotFoundSlideTopics —— Slide 1：专题选择区（杂志网格 · 无卡片）
 * - 等价 tm('notFound.topics.items')：i18n 契约只暴露 t，
 *   用「点路径下标越界时 t 返回 key 本身」做哨兵探测数组长度（上限 9）
 * - 点击交由父级统一跳转（等价 emit('navigate', route)）
 */
import { useMemo } from 'react'
import { useI18n } from '@/i18n'
import './NotFoundSlideTopics.css'

export interface NotFoundSlideTopicsProps {
  onNavigate?: (route: string) => void
}

const topicImages = [
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'
]
const topicRoutes = ['/counseling', '/assessment', '/articles']

interface TopicItem {
  no: string
  en: string
  zh: string
  desc: string
  image: string
  route: string
}

export function NotFoundSlideTopics({ onNavigate }: NotFoundSlideTopicsProps) {
  const { t } = useI18n()

  const topicItems = useMemo<TopicItem[]>(() => {
    const items: TopicItem[] = []
    for (let i = 0; i < 9; i++) {
      const no = t(`notFound.topics.items.${i}.no`)
      // t 缺键回退 key 本身 → 该下标越界，收集结束
      if (no === `notFound.topics.items.${i}.no`) break
      items.push({
        no,
        en: t(`notFound.topics.items.${i}.en`),
        zh: t(`notFound.topics.items.${i}.zh`),
        desc: t(`notFound.topics.items.${i}.desc`),
        image: topicImages[i] || topicImages[0],
        route: topicRoutes[i] || '/'
      })
    }
    return items
  }, [t])

  return (
    <section className="nf-slide nf-slide-topics">
      <div className="nf-slide-inner">
        <div className="nf-section-head">
          <span className="nf-section-label reveal-anim" data-anim="0">{t('notFound.topics.label')}</span>
          <h2 className="nf-section-title reveal-anim" data-anim="1">{t('notFound.topics.title')}</h2>
        </div>
        <div className="nf-topics-rule reveal-anim" data-anim="1" />
        <div className="nf-topics-grid">
          {topicItems.map((item, i) => (
            <article
              key={i}
              className="nf-topic reveal-anim"
              data-anim={i}
              onClick={() => onNavigate?.(item.route)}
            >
              <div className="nf-topic-meta">
                <span className="nf-topic-no">{item.no}</span>
                <span className="nf-topic-en">{item.en}</span>
              </div>
              <div className="nf-topic-image-wrap">
                <img src={item.image} alt={item.zh} className="nf-topic-img" loading="lazy" />
              </div>
              <h3 className="nf-topic-zh">{item.zh}</h3>
              <p className="nf-topic-desc">{item.desc}</p>
              <div className="nf-topic-cta">
                <span>{t('notFound.topics.explore')}</span>
                <span className="nf-topic-arrow">→</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NotFoundSlideTopics
