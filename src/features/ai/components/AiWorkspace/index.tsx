/**
 * 【business】AiWorkspace —— AI 对话桌面工作台（AI 咨询师 / AI 伴侣共用）
 *
 * 版式：满宽左右分屏（不再套页头 + 卡片）
 * - 左：整幅「海报栏」——英文眉标 / 超大衬线标题 / 人格简介 / 切换到另一人格 /
 *   会话计数 / 陪伴工具（建议、热线、转真人）/ 隐私说明。底色为 --bg-soft，与画布形成两区。
 * - 右：对话画布——顶部状态条 + 居中消息列（最大 760）+ 底部浮起输入区。
 *
 * 桌面优势：分屏吃满视口宽度与高度，长文本不挤在窄卡片里；移动端另行制作。
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import ChatThread from '../ChatThread'
import { useChat } from '../../hooks/useChat'
import styles from './AiWorkspace.module.css'

export interface AiWorkspaceConfig {
  /** 人格：咨询师 / 伴侣（决定 useChat 的 persona） */
  persona: 'counselor' | 'companion'
  eyebrow: string
  /** 允许包含 <em> 排版标记 */
  title: string
  desc: string
  greeting: string
  placeholder: string
  send: string
  stop: string
  disclaimer: string
  footnote: string
  bookLink: string
  quickPrompts: string[]
}

export function AiWorkspace({ config }: { config: AiWorkspaceConfig }) {
  const { t } = useTranslation()
  const { messages, isSending, send, abort, reset, regenerate } = useChat(config.persona)

  const tips = useMemo(
    () => t('counseling.aiShared.tips', { returnObjects: true }) as string[],
    [t]
  )

  const isCounselor = config.persona === 'counselor'
  const personaName = isCounselor
    ? t('counseling.aiShared.personaCounselor')
    : t('counseling.aiShared.personaCompanion')
  const otherName = isCounselor
    ? t('counseling.aiShared.personaCompanion')
    : t('counseling.aiShared.personaCounselor')
  const otherRole = isCounselor
    ? t('counseling.aiShared.personaRoleCompanion')
    : t('counseling.aiShared.personaRoleCounselor')
  const otherPath = isCounselor ? '/counseling/companion' : '/counseling/ai-chat'
  const turns = messages.filter((entry) => entry.role === 'user').length

  return (
    <div className={styles.stage}>
      {/* ============ 左：海报栏 ============ */}
      <aside className={styles.poster}>
        <div className={styles.posterInner}>
          <Link className={styles.back} to="/counseling">
            {t('counseling.aiShared.back')}
          </Link>

          <div className={styles.lockup}>
            <span className={styles.eyebrow}>{config.eyebrow}</span>
            <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: config.title }} />
            <p className={styles.desc}>{config.desc}</p>
          </div>

          <Link
            className={styles.switch}
            to={otherPath}
            aria-label={`${t('counseling.aiShared.personaLabel')} · ${otherName}`}
          >
            <span className={styles.switchArrow} aria-hidden="true">
              →
            </span>
            <span className={styles.switchText}>
              <span className={styles.switchName}>{otherName}</span>
              <span className={styles.switchRole}>{otherRole}</span>
            </span>
          </Link>

          <div className={styles.posterFoot}>
            {/* 安全出口优先：热线与转真人放在短视口也可见的位置 */}
            <section className={styles.crisis} aria-label={t('counseling.aiShared.hotlineLabel')}>
              <span className={styles.crisisLabel}>{t('counseling.aiShared.hotlineLabel')}</span>
              <a className={styles.hotline} href="tel:12356">
                12356
              </a>
              <span className={styles.crisisNote}>{t('counseling.aiShared.hotlineNote')}</span>
            </section>

            <div className={styles.convert}>
              <span className={styles.convertText}>{config.footnote}</span>
              <Link className={styles.convertLink} to="/counseling">
                {config.bookLink}
              </Link>
            </div>

            <div className={styles.session}>
              <span className={styles.metaLabel}>{t('counseling.aiShared.session')}</span>
              <span className={styles.metaNum}>
                {String(turns).padStart(2, '0')}
                <i>{t('counseling.aiShared.turnsUnit')}</i>
              </span>
            </div>

            <section className={styles.block} aria-label={t('counseling.aiShared.toolsTitle')}>
              <h2 className={styles.blockLabel}>{t('counseling.aiShared.toolsTitle')}</h2>
              <ol className={styles.tips}>
                {tips.map((tip, index) => (
                  <li key={tip} className={styles.tipItem}>
                    <span className={styles.tipNum}>{String(index + 1).padStart(2, '0')}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </section>

            <p className={styles.privacy}>{t('counseling.aiShared.privacy')}</p>
          </div>
        </div>
      </aside>

      {/* ============ 右：对话画布 ============ */}
      <section className={styles.studio} aria-label={personaName}>
        <header className={styles.studioBar}>
          <span className={styles.status}>
            <i className={styles.statusDot} data-live={isSending} aria-hidden="true" />
            {isSending ? t('counseling.aiShared.thinking') : t('counseling.aiShared.online')}
          </span>
          <span className={styles.barDivider} aria-hidden="true" />
          <span className={styles.barName}>{personaName}</span>

          <Button
            type="text"
            size="small"
            className={styles.newChat}
            icon={<PlusOutlined />}
            disabled={isSending || messages.length === 0}
            onClick={reset}
          >
            {t('counseling.aiShared.newChat')}
          </Button>
        </header>

        <ChatThread
          entries={messages}
          loading={isSending}
          variant="page"
          greeting={config.greeting}
          placeholder={config.placeholder}
          sendLabel={config.send}
          stopLabel={config.stop}
          quickPrompts={config.quickPrompts}
          disclaimer={config.disclaimer}
          maxLength={500}
          inputHint={t('counseling.aiShared.inputHint')}
          copyLabel={t('counseling.aiShared.copy')}
          copiedLabel={t('counseling.aiShared.copied')}
          regenerateLabel={t('counseling.aiShared.regenerate')}
          scrollLatestLabel={t('counseling.aiShared.scrollToLatest')}
          onSend={send}
          onAbort={abort}
          onRegenerate={() => void regenerate()}
        />
      </section>
    </div>
  )
}

export default AiWorkspace
