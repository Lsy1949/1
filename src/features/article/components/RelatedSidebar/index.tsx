// 相关推荐侧栏（ArticleDetailView 右栏，sticky），点击卡片上抛 onOpen(id)
import { RightOutlined } from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import type { ArticleItem } from '../types'
import styles from './RelatedSidebar.module.css'

interface RelatedSidebarProps {
  related: ArticleItem[]
  onOpen?: (id: number) => void
}

// 原 v-for 内每项挂 v-reveal="i * 80"；React hook 不能循环调用，等价拆为每项一个子组件
function SidebarCard({ item, index, onOpen }: { item: ArticleItem; index: number; onOpen?: (id: number) => void }) {
  const revealRef = useReveal<HTMLElement>({ delay: index * 80 })

  return (
    <article
      ref={revealRef}
      className={styles.sidebarCard}
      onClick={() => onOpen?.(item.id)}
    >
      <span className={styles.cardNum}>{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.cardBody}>
        <span className={styles.cardCat}>{item.categoryLabel}</span>
        <h4 className={styles.cardTitle}>{item.title}</h4>
        <span className={styles.cardMeta}>{item.readTime}</span>
      </div>
      <RightOutlined className={styles.cardArrow} />
    </article>
  )
}

export function RelatedSidebar({ related, onOpen }: RelatedSidebarProps) {
  if (related.length === 0) return null

  return (
    <aside className={styles.relatedSidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarEyebrow}>— Continue Reading</span>
        <h3 className={styles.sidebarTitle}>相关<em>推荐</em></h3>
      </div>
      <div className={styles.sidebarList}>
        {related.map((item, i) => (
          <SidebarCard key={item.id} item={item} index={i} onOpen={onOpen} />
        ))}
      </div>
    </aside>
  )
}

export default RelatedSidebar
