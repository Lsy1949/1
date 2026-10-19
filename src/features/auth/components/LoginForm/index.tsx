/**
 * 【business】LoginForm —— 登录方式装配（账号/手机/邮箱 tab + 第三方登录 + 注册/忘记密码入口）
 * - 子表单的 login-success 回调透传给页面层，跳转与 store 写入由页面处理
 * - el-tooltip → AntD Tooltip；ElMessage → AntApp.useApp().message
 * - transition tab-fade（out-in）→ key 切换 + 入场动画（离场动画简化，见 CSS）
 */
import { useMemo, useState } from 'react'
import { App as AntApp, Tooltip } from 'antd'
import { useI18n } from '@/i18n'
import { debounce } from '@/utils/debounce'
import AccountPasswordLogin from '../login-way/AccountPasswordLogin'
import PhoneLogin from '../login-way/PhoneLogin'
import EmailLogin from '../login-way/EmailLogin'
import RegisterForm from '../other/RegisterForm'
import ForgotPasswordForm from '../other/ForgotPasswordForm'
import styles from './LoginForm.module.css'

type LoginType = 'account' | 'phone' | 'email'

interface LoginFormProps {
  /** 登录成功（透传给页面层） */
  onLoginSuccess?: (payload?: { remember?: boolean }) => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  // 登录表单状态管理
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false)
  const [activeLoginType, setActiveLoginType] = useState<LoginType>('account')

  // 登录方式标签
  const loginTabs = useMemo<{ name: LoginType; label: string }[]>(
    () => [
      { name: 'account', label: t('login.tabs.account') },
      { name: 'phone', label: t('login.tabs.phone') },
      { name: 'email', label: t('login.tabs.email') },
    ],
    [t],
  )

  // 第三方登录处理函数（debounce 用 useMemo 固定引用，等价 Vue setup 内的一次性创建）
  const debouncedHandleWechatLogin = useMemo(
    () =>
      debounce(() => {
        message.info(t('login.social.wechat') + ' ' + t('common.loading'))
      }, 1000),
    [t, message],
  )

  const debouncedHandleQQLogin = useMemo(
    () =>
      debounce(() => {
        message.info(t('login.social.qq') + ' ' + t('common.loading'))
      }, 1000),
    [t, message],
  )

  // 登录框（非注册/忘记密码态）
  if (!showRegisterForm && !showForgotPasswordForm) {
    return (
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <span className={styles.headerBadge}>{t('login.header.badge')}</span>
          <h2>{t('login.header.title')}</h2>
          <p>{t('login.header.desc')}</p>
        </div>

        {/* 登录方式切换 */}
        <div className={styles.loginTypeTabs}>
          {loginTabs.map((tab) => (
            <div
              key={tab.name}
              className={`${styles.tabItem}${activeLoginType === tab.name ? ` ${styles.active}` : ''}`}
              onClick={() => setActiveLoginType(tab.name)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* 等价 transition name=tab-fade mode=out-in：key 切换重挂载 + 入场动画 */}
          <div key={activeLoginType} className={styles.tabFadeEnter}>
            {/* 账号密码登录 */}
            {activeLoginType === 'account' && (
              <AccountPasswordLogin
                onSwitchToForgotPassword={() => setShowForgotPasswordForm(true)}
                onLoginSuccess={onLoginSuccess}
              />
            )}
            {/* 手机登录 */}
            {activeLoginType === 'phone' && <PhoneLogin onLoginSuccess={onLoginSuccess} />}
            {/* 邮箱登录 */}
            {activeLoginType === 'email' && <EmailLogin onLoginSuccess={onLoginSuccess} />}
          </div>
        </div>

        {/* 第三方登录方式 */}
        <div className={styles.socialLogin}>
          <div className={styles.socialLoginSeparator}>
            <span className={styles.socialLoginText}>{t('login.social.text')}</span>
          </div>
          <div className={styles.socialLoginButtons}>
            <Tooltip title={t('login.social.wechat')} placement="bottom">
              <button
                type="button"
                className={`${styles.socialBtn} ${styles.wechatBtn}`}
                aria-label={t('login.social.wechat')}
                onClick={debouncedHandleWechatLogin}
              >
                <svg viewBox="0 0 1024 1024" width="22" height="22">
                  <path d="M337.387283 341.82659c-17.757225 0-35.514451 11.83815-35.514451 29.595375s17.757225 29.595376 35.514451 29.595376 29.595376-11.83815 29.595376-29.595376c0-18.49711-11.83815-29.595376-29.595376-29.595375zM577.849711 513.479769c-11.83815 0-22.936416 12.578035-22.936416 23.6763 0 12.578035 11.83815 23.676301 22.936416 23.676301 17.757225 0 29.595376-11.83815 29.595376-23.676301s-11.83815-23.676301-29.595376-23.6763zM501.641618 401.017341c17.757225 0 29.595376-12.578035 29.595376-29.595376 0-17.757225-11.83815-29.595376-29.595376-29.595375s-35.514451 11.83815-35.51445 29.595375 17.757225 29.595376 35.51445 29.595376zM706.589595 513.479769c-11.83815 0-22.936416 12.578035-22.936416 23.6763 0 12.578035 11.83815 23.676301 22.936416 23.676301 17.757225 0 29.595376-11.83815 29.595376-23.676301s-11.83815-23.676301-29.595376-23.6763z" fill="#07c160" />
                  <path d="M510.520231 2.959538C228.624277 2.959538 0 231.583815 0 513.479769s228.624277 510.520231 510.520231 510.520231 510.520231-228.624277 510.520231-510.520231-228.624277-510.520231-510.520231-510.520231zM413.595376 644.439306c-29.595376 0-53.271676-5.919075-81.387284-12.578034l-81.387283 41.433526 22.936416-71.768786c-58.450867-41.433526-93.965318-95.445087-93.965317-159.815029 0-113.202312 105.803468-201.988439 233.803468-201.98844 114.682081 0 216.046243 71.028902 236.023121 166.473989-7.398844-0.739884-14.797688-1.479769-22.196532-1.479769-110.982659 1.479769-198.289017 85.086705-198.289017 188.67052 0 17.017341 2.959538 33.294798 7.398844 49.572255-7.398844 0.739884-15.537572 1.479769-22.936416 1.479768z m346.265896 82.867052l17.757225 59.190752-63.630058-35.514451c-22.936416 5.919075-46.612717 11.83815-70.289017 11.83815-111.722543 0-199.768786-76.947977-199.768786-172.393063-0.739884-94.705202 87.306358-171.653179 198.289017-171.65318 105.803468 0 199.028902 77.687861 199.028902 172.393064 0 53.271676-34.774566 100.624277-81.387283 136.138728z" fill="#07c160" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip title="QQ登录" placement="bottom">
              <button
                type="button"
                className={`${styles.socialBtn} ${styles.qqBtn}`}
                aria-label="QQ登录"
                onClick={debouncedHandleQQLogin}
              >
                <svg viewBox="0 0 1024 1024" width="22" height="22">
                  <path d="M511.037 986.94c-85.502 0-163.986-26.686-214.517-66.544-25.66 7.149-58.486 18.655-79.202 32.921-17.725 12.202-15.516 24.647-12.32 29.67 14.027 22.069 240.622 14.092 306.04 7.219v-3.265z" fill="#FAAD08" />
                  <path d="M495.627 986.94c85.501 0 163.986-26.686 214.518-66.544 25.66 7.149 58.485 18.655 79.203 32.921 17.724 12.202 15.512 24.647 12.32 29.67-14.027 22.069-240.623 14.092-306.042 7.219v-3.265z" fill="#FAAD08" />
                  <path d="M496.137 472.026c140.73-0.935 253.514-27.502 291.73-37.696 9.11-2.432 13.984-6.789 13.984-6.789 0.032-1.25 0.578-22.348 0.578-33.232 0-183.287-88.695-367.458-306.812-367.47C277.5 26.851 188.8 211.021 188.8 394.31c0 10.884 0.55 31.982 0.583 33.232 0 0 3.965 4.076 11.231 6.048 35.283 9.579 150.19 37.482 294.485 38.437h1.037zM883.501 626.967c-8.66-27.825-20.484-60.273-32.455-91.434 0 0-6.886-0.848-10.366 0.158-107.424 31.152-237.624 51.006-336.845 49.808h-1.026c-98.664 1.186-227.982-18.44-335.044-49.288-4.09-1.176-12.168-0.677-12.168-0.677-11.97 31.16-23.793 63.608-32.453 91.433-41.3 132.679-27.92 187.587-17.731 188.818 21.862 2.638 85.099-99.88 85.099-99.88 0 104.17 94.212 264.125 309.947 265.596a765.877 765.877 0 0 1 5.725 0c215.738-1.471 309.947-161.424 309.947-265.595 0 0 63.236 102.519 85.102 99.88 10.186-1.231 23.566-56.14-17.732-188.819" fill="#12B7F5" />
                  <path d="M429.208 303.911c-29.76 1.323-55.195-32.113-56.79-74.62-1.618-42.535 21.183-78.087 50.95-79.417 29.732-1.305 55.149 32.116 56.765 74.64 1.629 42.535-21.177 78.08-50.925 79.397m220.448-74.62c-1.593 42.507-27.03 75.941-56.79 74.62-29.746-1.32-52.553-36.862-50.924-79.397 1.614-42.526 27.03-75.948 56.764-74.639 29.77 1.33 52.57 36.881 50.951 79.417" fill="#fff" />
                  <path d="M695.405 359.069c-7.81-18.783-86.466-39.709-183.843-39.709h-1.045c-97.376 0-176.033 20.926-183.842 39.709a6.66 6.66 0 0 0-0.57 2.672c0 1.353 0.418 2.575 1.072 3.612 6.58 10.416 93.924 61.885 183.341 61.885h1.045c89.416 0 176.758-51.466 183.34-61.883a6.775 6.775 0 0 0 1.069-3.622 6.66 6.66 0 0 0-0.567-2.664" fill="#FAAD08" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className={styles.registerLink}>
          <span>{t('login.register.prompt')}</span>
          <button type="button" className={styles.registerBtn} onClick={() => setShowRegisterForm(true)}>
            {t('login.register.btn')}
          </button>
        </div>
      </div>
    )
  }

  // 注册（register-form 为无样式标记类，保留字面量供调试与潜在协议类使用）
  if (showRegisterForm) {
    return (
      <div className={`${styles.loginBox} register-form`}>
        <div className={styles.loginHeader}>
          <span className={styles.headerBadge}>{t('login.header.registerBadge')}</span>
          <h2>{t('login.header.registerTitle')}</h2>
          <p>{t('login.header.registerDesc')}</p>
        </div>
        <RegisterForm onSwitchToLogin={() => setShowRegisterForm(false)} />
      </div>
    )
  }

  // 忘记密码（forgot-password-form 为无样式标记类，保留字面量）
  return (
    <div className={`${styles.loginBox} forgot-password-form`}>
      <div className={styles.loginHeader}>
        <span className={styles.headerBadge}>{t('login.header.forgotBadge')}</span>
        <h2>{t('login.header.forgotTitle')}</h2>
        <p>{t('login.header.forgotDesc')}</p>
      </div>
      <ForgotPasswordForm onSwitchToLogin={() => setShowForgotPasswordForm(false)} />
    </div>
  )
}

export default LoginForm
