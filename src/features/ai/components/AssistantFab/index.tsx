/**
 * 【business】AssistantFab —— AI 客服悬浮窗（自治组件）
 * - 内部自持 useChat(assistant) 会话；createPortal 到 body 避免祖先 transform 影响 fixed 定位
 * - 挂载即用：<AssistantFab />；右下角按钮（bottom 40 与左侧 antd 回顶同排），展开为对话面板
 * - Vue <Transition name="fab-pop"> → enter/leave 动画类 + 离场动画结束后延迟卸载
 */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseOutlined, CustomerServiceOutlined, MessageOutlined, UndoOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import ChatThread from '../ChatThread'
import { useChat } from '../../hooks/useChat'
import styles from './AssistantFab.module.css'

/** fab-pop 离场动画时长（ms），与 fabPopLeave 动画（module 内）保持一致 */
const FAB_POP_LEAVE_MS = 320

export function AssistantFab() {
  const { t } = useTranslation()
  const { messages, isSending, send, abort, reset } = useChat('assistant')

  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen(v => !v)
  }

  function close() {
    setOpen(false)
  }

  // 快捷提问数组来自 i18n（等价 Vue tm()：returnObjects 整段取数组）
  const quickPrompts = useMemo(
    () => t('home.aiAssistant.quickPrompts', { returnObjects: true }) as string[],
    [t]
  )

  // 离场动画期间保持挂载，动画结束后卸载（等价 <Transition> 的 leave 阶段）
  const [panelRendered, setPanelRendered] = useState(open)
  useEffect(() => {
    if (open) {
      setPanelRendered(true)
      return
    }
    const timer = setTimeout(() => setPanelRendered(false), FAB_POP_LEAVE_MS)
    return () => clearTimeout(timer)
  }, [open])

  return createPortal(
    <div className={styles.assistantFab}>
      {panelRendered && (
        <section
          className={`${styles.fabPanel} ${open ? styles.fabPopEnter : styles.fabPopLeave}`}
          role="dialog"
          aria-label={t('home.aiAssistant.title')}
        >
          <header className={styles.fabPanelHeader}>
            <div className={styles.headerAvatar}>
              <CustomerServiceOutlined />
            </div>
            <div className={styles.headerText}>
              <h3>{t('home.aiAssistant.title')}</h3>
              <p>{t('home.aiAssistant.subtitle')}</p>
            </div>
            <button
              type="button"
              className={styles.headerAction}
              title={t('home.aiAssistant.restart')}
              disabled={isSending}
              onClick={reset}
            >
              <UndoOutlined />
            </button>
            <button type="button" className={styles.headerAction} title={t('common.close')} onClick={close}>
              <CloseOutlined />
            </button>
          </header>

          <ChatThread
            entries={messages}
            loading={isSending}
            variant="fab"
            greeting={t('home.aiAssistant.greeting')}
            placeholder={t('home.aiAssistant.placeholder')}
            sendLabel={t('home.aiAssistant.send')}
            stopLabel={t('home.aiAssistant.stop')}
            quickPrompts={quickPrompts}
            disclaimer={t('home.aiAssistant.disclaimer')}
            onSend={send}
            onAbort={abort}
          />
        </section>
      )}

      <button type="button" className={styles.fabButton} aria-label={t('home.aiAssistant.fab')} onClick={toggle}>
        {/* mode="out-in" 简化为 key 切换 + 入场动画（图标 0.18s 快速过渡，视觉等价） */}
        <span key={open ? 'close' : 'chat'} className={`${styles.fabIcon} ${styles.fabIconEnter}`}>
          {open ? <CloseOutlined /> : <MessageOutlined />}
        </span>
        {!open && <span className={styles.fabBadge} />}
      </button>
    </div>,
    document.body
  )
}

export default AssistantFab
