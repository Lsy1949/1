/**
 * 【business】NotFoundSlideQuote —— Slide 2：Pull Quote 引语区（深蓝渐变，纯展示）
 */
import { useI18n } from '@/i18n'
import './NotFoundSlideQuote.css'

export interface NotFoundSlideQuoteProps {
  /* 无 props */
}

export function NotFoundSlideQuote(_props: NotFoundSlideQuoteProps) {
  const { t } = useI18n()

  return (
    <section className="nf-slide nf-slide-quote">
      <div className="nf-quote-inner reveal-anim" data-anim="0">
        <span className="nf-quote-mark" aria-hidden="true">"</span>
        <p className="nf-quote-text">{t('notFound.quote.text')}</p>
        <span className="nf-quote-author">{t('notFound.quote.author')}</span>
      </div>
    </section>
  )
}

export default NotFoundSlideQuote
