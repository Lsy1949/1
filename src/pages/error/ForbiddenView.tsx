import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'

/**
 * 403 页面：租户 feature 关闭时由 FeatureGuard 渲染。
 * 结构与 404 保持同一套排版/标题层级，文案走 i18n。
 */
export function ForbiddenView() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: 'var(--brand-primary)',
          lineHeight: 1,
          margin: 0,
        }}
      >
        403
      </div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {t('error.forbidden.title')}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          margin: 0,
          maxWidth: 420,
        }}
      >
        {t('error.forbidden.desc')}
      </p>
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        style={{
          marginTop: 8,
          padding: '8px 24px',
          borderRadius: 'var(--brand-radius, 8px)',
          border: '1px solid var(--brand-primary)',
          color: 'var(--brand-primary)',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {t('error.forbidden.back')}
      </button>
    </div>
  )
}

export default ForbiddenView
