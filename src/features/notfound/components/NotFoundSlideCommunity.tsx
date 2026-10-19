/**
 * 【business】NotFoundSlideCommunity —— Slide 3：社区笔记区（杂志专栏 · 无卡片）
 * - 笔记为不可变数组：点赞 map、新笔记 [new, ...notes]（等价 Vue unshift）
 * - noteIdCounter 为非渲染态 → ref；新笔记置顶，visibleNotes 只展示前 3 条
 * - Enter 直接提交，Shift+Enter 换行
 */
import { useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRef } from 'react'
import { useI18n } from '@/i18n'
import './NotFoundSlideCommunity.css'

interface NoteItem {
  id: number
  user: string
  time: string
  content: string
  likes: number
  liked: boolean
  featured: boolean
}

export interface NotFoundSlideCommunityProps {
  /* 无 props */
}

export function NotFoundSlideCommunity(_props: NotFoundSlideCommunityProps) {
  const { t } = useI18n()

  /* ---------- 社区笔记数据 ---------- */
  const noteIdCounterRef = useRef(100)
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 1,
      user: '林同学',
      time: '2 小时前',
      content: '在这里迷路的第三天，我开始享受这种没有目的的游荡。以前总想着要赶快找到方向，现在才明白，方向不是找出来的，是走出来的。',
      likes: 42,
      liked: false,
      featured: true
    },
    {
      id: 2,
      user: '小溪',
      time: '3 小时前',
      content: '今晚的月亮很亮，突然觉得迷路也没那么可怕。',
      likes: 18,
      liked: false,
      featured: false
    },
    {
      id: 3,
      user: '阿明',
      time: '5 小时前',
      content: '考研失败后一直很迷茫，在这里找到了共鸣。',
      likes: 27,
      liked: false,
      featured: false
    }
  ])

  const visibleNotes = notes.slice(0, 3)

  function toggleLike(note: NoteItem) {
    setNotes((list) =>
      list.map((n) =>
        n.id === note.id ? { ...n, liked: !n.liked, likes: n.likes + (n.liked ? -1 : 1) } : n
      )
    )
  }

  /* ---------- 输入区 ---------- */
  const [writeText, setWriteText] = useState('')
  function handleWriteKey(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitNote()
    }
  }
  function submitNote() {
    const text = writeText.trim()
    if (!text) return
    noteIdCounterRef.current += 1
    setNotes((list) => [
      {
        id: noteIdCounterRef.current,
        user: '你',
        time: '刚刚',
        content: text,
        likes: 0,
        liked: false,
        featured: false
      },
      ...list
    ])
    setWriteText('')
  }

  return (
    <section className="nf-slide nf-slide-community">
      <div className="nf-slide-inner nf-community-inner">
        <div className="nf-community-head">
          <span className="nf-section-label reveal-anim" data-anim="0">{t('notFound.community.label')}</span>
          <h2 className="nf-community-title reveal-anim" data-anim="1">{t('notFound.community.title')}</h2>
          <p className="nf-community-sub reveal-anim" data-anim="2">
            {t('notFound.community.subtitle', { n: '3,247' })}
          </p>
        </div>

        <div className="nf-notes-list">
          {visibleNotes.map((note, i) => (
            <article
              key={note.id}
              className={`nf-note reveal-anim${note.featured ? ' nf-note-featured' : ''}`}
              data-anim={i % 3}
            >
              {note.featured && <span className="nf-note-tag">{t('notFound.community.featured')}</span>}
              <p className="nf-note-text">{note.content}</p>
              <div className="nf-note-meta">
                <span className="nf-note-author-line">— {note.user}</span>
                <span className="nf-note-time">{note.time}</span>
                <button
                  type="button"
                  className={`nf-note-action${note.liked ? ' liked' : ''}`}
                  onClick={() => toggleLike(note)}
                >
                  <span className="nf-heart">{note.liked ? '♥' : '♡'}</span>
                  <span className="nf-like-count">{note.likes}</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="nf-write reveal-anim" data-anim="0">
          <textarea
            value={writeText}
            onChange={(e) => setWriteText(e.target.value)}
            className="nf-write-input"
            placeholder={t('notFound.community.writePlaceholder')}
            rows={1}
            onKeyDown={handleWriteKey}
          />
          <button
            type="button"
            className="nf-write-submit"
            disabled={!writeText.trim()}
            onClick={submitNote}
          >
            <span>{t('notFound.community.writeLabel')}</span>
            <span className="nf-write-arrow">→</span>
          </button>
        </div>

        <div className="nf-footline">
          <span className="nf-footline-slogan">{t('notFound.footer.slogan')}</span>
          <span className="nf-footline-copy">{t('notFound.footer.copyright')}</span>
        </div>
      </div>
    </section>
  )
}

export default NotFoundSlideCommunity
