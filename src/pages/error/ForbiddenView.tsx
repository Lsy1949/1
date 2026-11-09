import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './ForbiddenView.css'

/**
 * 403 页面：租户 feature 关闭时由 FeatureGuard 渲染。
 * 结构与 404 保持同一套排版/标题层级，文案走 i18n。
 */
export function ForbiddenView() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="fb-page">
      <div className="fb-code">403</div>
      <h1 className="fb-title">{t('error.forbidden.title')}</h1>
      <p className="fb-desc">{t('error.forbidden.desc')}</p>
      <button
        type="button"
        className="fb-back"
        onClick={() => navigate('/', { replace: true })}
      >
        {t('error.forbidden.back')}
      </button>
    </div>
  )
}

export default ForbiddenView
