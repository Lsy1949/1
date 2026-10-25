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
import wechatIcon from '@/assets/icons/wechat.svg'
import qqIcon from '@/assets/icons/qq.svg'
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

  // 登录方式标签：后端契约（api-contract §1.1）目前只支持账号密码，
  // 手机/邮箱组件与分支保留，契约就绪后把对应项加回本数组即可
  const loginTabs = useMemo<{ name: LoginType; label: string }[]>(
    () => [{ name: 'account', label: t('login.tabs.account') }],
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
                <img src={wechatIcon} alt="" width={22} height={22} />
              </button>
            </Tooltip>
            <Tooltip title="QQ登录" placement="bottom">
              <button
                type="button"
                className={`${styles.socialBtn} ${styles.qqBtn}`}
                aria-label="QQ登录"
                onClick={debouncedHandleQQLogin}
              >
                <img src={qqIcon} alt="" width={22} height={22} />
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
