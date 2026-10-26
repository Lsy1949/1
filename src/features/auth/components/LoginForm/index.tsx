/**
 * 【business】LoginForm —— 登录方式装配（账号/手机/邮箱 tab + 第三方登录 + 注册/忘记密码入口）
 * - 外壳组件化到 antd：Divider（三方分隔线）、Typography/Tag（标题区）、
 *   Button(circle)（三方按钮）、Flex/Space（布局）；登录方式切换保留
 *   原药丸式自定义标签（.loginTypeTabs），其余自定义样式仅玻璃卡片与三方品牌 hover 色
 * - 动画走 Ant Motion（@rc-component/motion 的 CSSMotion，antd 组件内部同款引擎）：
 *   卡片入场 / 视图切换 / 页签切换三处入场动效全部 JS 驱动，模块 CSS 不再写 keyframes
 * - 三态视图（login/register/forgot）共用一张卡壳：卡不重挂载（入场动画只在
 *   首次播放），内容区按 view key 切换重挂载 + 淡入，避免整卡反复弹跳
 * - 子表单的 login-success 回调透传给页面层，跳转与 store 写入由页面处理
 */
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  App as AntApp,
  Button,
  Divider,
  Flex,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import CSSMotion from '@rc-component/motion'
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

/** 卡片三态视图 */
type LoginView = 'login' | 'register' | 'forgot'

interface LoginFormProps {
  /** 登录成功（透传给页面层） */
  onLoginSuccess?: (payload?: { remember?: boolean }) => void
}

/** 原 CSS 动画的缓动曲线（fadeInUp 同款），Ant Motion 内联 transition 沿用 */
const EASE_ENTER = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

/** appear 型入场动效（淡入 + 上移归位），duration/delay 单位 ms */
function enterMotion(duration: number, delay = 0, distance = 16) {
  const transition = `opacity ${duration}ms ${EASE_ENTER} ${delay}ms, transform ${duration}ms ${EASE_ENTER} ${delay}ms`
  return {
    // 兜底截止：transitionend 未触发（如标签页后台）也强制结束，避免样式卡在起始态
    motionDeadline: duration + delay + 300,
    onAppearStart: (): CSSProperties => ({ opacity: 0, transform: `translateY(${distance}px)` }),
    onAppearActive: (): CSSProperties => ({ opacity: 1, transform: 'translateY(0)', transition }),
  }
}

/** 卡片入场（原 fadeInUp：0.7s + 0.2s 延迟，仅首挂载一次） */
const cardMotion = enterMotion(700, 200, 16)
/** 视图切换（原 viewFade：0.35s） */
const viewMotion = enterMotion(350, 0, 10)
/** 页签切换（原 tab-fade：0.3s） */
const tabMotion = enterMotion(300, 0, 8)

/** 卡片标题区（登录/注册/忘记密码三态共用，antd Tag + Typography 承载样式） */
function LoginHeader({ badge, title, desc }: { badge: string; title: string; desc: string }) {
  return (
    <Flex vertical align="flex-start" gap={6} className={styles.loginHeader}>
      <Tag variant="filled" className={styles.headerBadge}>
        {badge}
      </Tag>
      <Typography.Title level={3} className={styles.headerTitle}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary" className={styles.headerDesc}>
        {desc}
      </Typography.Text>
    </Flex>
  )
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [view, setView] = useState<LoginView>('login')
  const [activeLoginType, setActiveLoginType] = useState<LoginType>('account')

  // 登录方式标签：三个方式全量展示（手机/邮箱目前仅前端界面展示，
  // 后端契约 api-contract §1.1 只支持账号密码，子表单提交仍走原逻辑）
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

  return (
    <CSSMotion visible motionAppear {...cardMotion}>
      {({ style: cardStyle }) => (
        <div className={styles.loginBox} style={cardStyle}>
          {/* 内容区按 view 切换重挂载（CSSMotion 重新 appear）：卡壳不动，只有内容做轻量淡入 */}
          <CSSMotion key={view} visible motionAppear {...viewMotion}>
            {({ style: viewStyle }) => (
              <div style={viewStyle}>
                <LoginHeader
                  badge={t(`login.header.${view === 'login' ? 'badge' : `${view}Badge`}`)}
                  title={t(`login.header.${view === 'login' ? 'title' : `${view}Title`}`)}
                  desc={t(`login.header.${view === 'login' ? 'desc' : `${view}Desc`}`)}
                />

                {view === 'login' && (
                  <>
                    {/* 登录方式切换（沿用原药丸式自定义标签，样式见 .loginTypeTabs） */}
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
                      <CSSMotion key={activeLoginType} visible motionAppear {...tabMotion}>
                        {({ style: tabStyle }) => (
                          <div style={tabStyle}>
                            {/* 账号密码登录 */}
                            {activeLoginType === 'account' && (
                              <AccountPasswordLogin
                                onSwitchToForgotPassword={() => setView('forgot')}
                                onLoginSuccess={onLoginSuccess}
                              />
                            )}
                            {/* 手机登录 */}
                            {activeLoginType === 'phone' && (
                              <PhoneLogin onLoginSuccess={onLoginSuccess} />
                            )}
                            {/* 邮箱登录 */}
                            {activeLoginType === 'email' && (
                              <EmailLogin onLoginSuccess={onLoginSuccess} />
                            )}
                          </div>
                        )}
                      </CSSMotion>
                    </div>

                    {/* 第三方登录方式（Divider 自带分隔线，按钮圆形由 antd 承载，仅保留品牌色 hover） */}
                    <Divider className={styles.socialDivider}>
                      <Typography.Text type="secondary" className={styles.socialText}>
                        {t('login.social.text')}
                      </Typography.Text>
                    </Divider>
                    <Flex justify="center">
                      <Space size="middle">
                        <Tooltip title={t('login.social.wechat')} placement="bottom">
                          <Button
                            type="text"
                            shape="circle"
                            size="large"
                            className={`${styles.socialBtn} ${styles.wechatBtn}`}
                            aria-label={t('login.social.wechat')}
                            onClick={debouncedHandleWechatLogin}
                            icon={<img src={wechatIcon} alt="" width={22} height={22} />}
                          />
                        </Tooltip>
                        <Tooltip title="QQ登录" placement="bottom">
                          <Button
                            type="text"
                            shape="circle"
                            size="large"
                            className={`${styles.socialBtn} ${styles.qqBtn}`}
                            aria-label="QQ登录"
                            onClick={debouncedHandleQQLogin}
                            icon={<img src={qqIcon} alt="" width={22} height={22} />}
                          />
                        </Tooltip>
                      </Space>
                    </Flex>

                    <Flex justify="center" align="center" gap={4} className={styles.registerLink}>
                      <Typography.Text type="secondary">
                        {t('login.register.prompt')}
                      </Typography.Text>
                      <Button type="link" onClick={() => setView('register')}>
                        {t('login.register.btn')}
                      </Button>
                    </Flex>
                  </>
                )}

                {/* 注册（register-form 为无样式标记类，保留字面量供调试与潜在协议类使用） */}
                {view === 'register' && (
                  <div className="register-form">
                    <RegisterForm onSwitchToLogin={() => setView('login')} />
                  </div>
                )}

                {/* 忘记密码（forgot-password-form 为无样式标记类，保留字面量） */}
                {view === 'forgot' && (
                  <div className="forgot-password-form">
                    <ForgotPasswordForm onSwitchToLogin={() => setView('login')} />
                  </div>
                )}
              </div>
            )}
          </CSSMotion>
        </div>
      )}
    </CSSMotion>
  )
}

export default LoginForm
