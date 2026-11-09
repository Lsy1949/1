/**
 * 【business】NotFoundSlideTopics —— Slide 1：专题选择区（杂志网格 · 无卡片）
 * - 等价 tm('notFound.topics.items')：t(key, { returnObjects: true }) 整段取数组
 * - 点击交由父级统一跳转（等价 emit('navigate', route)）
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const topicItems = useMemo<TopicItem[]>(() => {
    const items = t('notFound.topics.items', { returnObjects: true }) as Array<Omit<TopicItem, 'image' | 'route'>>
    return items.map((item, i) => ({
      ...item,
      image: topicImages[i] || topicImages[0],
      route: topicRoutes[i] || '/'
    }))
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
