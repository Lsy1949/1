/**
 * 【business】LoginForm —— 登录方式装配（账号/手机/邮箱 tab + 第三方登录 + 注册/忘记密码入口）
 * - 外壳组件化到 antd：Divider（三方分隔线）、Typography/Tag（标题区）、
 *   Button(circle)（三方按钮）、Flex/Space（布局）；登录方式切换保留
 *   原药丸式自定义标签（.loginTypeTabs），其余自定义样式仅玻璃卡片与三方品牌 hover 色
 * - 动画走 Ant Motion（CSSMotion）：整页动效统一在 ../../motion 规整，
 *   本组件消费 loginCard / loginView / loginTab 三个预设，模块 CSS 无 keyframes
 * - 三态视图（login/register/forgot）共用一张卡壳：卡不重挂载（入场动画只在
 *   首次播放），内容区按 view key 切换重挂载 + 淡入，避免整卡反复弹跳
 * - 子表单的 login-success 回调透传给页面层，跳转与 store 写入由页面处理
 */
import { useMemo, useState } from 'react'
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
import { loginMotions } from '../../motion'
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
  // out-in 页签切换状态机：activeType 即时高亮；displayType 为实际渲染的表单。
  // 切换时先 visible=false 播离场（旧表单淡出），onLeaveEnd 再换内容 + visible=true
  // 播入场（新表单淡入上浮）——等价原 transition tab-fade mode=out-in
  const [activeLoginType, setActiveLoginType] = useState<LoginType>('account')
  const [displayLoginType, setDisplayLoginType] = useState<LoginType>('account')
  const [tabLeaving, setTabLeaving] = useState(false)

  const switchLoginType = (next: LoginType) => {
    if (next === activeLoginType) return
    setActiveLoginType(next) // 标签高亮即时反馈
    setTabLeaving(true) // 触发旧内容离场；离场中再点其它标签只更新目标，天然防抖
  }

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
    <CSSMotion visible motionAppear {...loginMotions.loginCard}>
      {({ style: cardStyle }) => (
        <div className={styles.loginBox} style={cardStyle}>
          {/* 内容区按 view 切换重挂载（CSSMotion 重新 appear）：卡壳不动，只有内容做轻量淡入 */}
          <CSSMotion key={view} visible motionAppear {...loginMotions.loginView}>
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
                      {/* 滑动指示器（药丸滑块）：绝对定位于首格，随选中项 translateX 左右滑动。
                          索引取标签数组下标（等分三格，translateX(index*100%) 恰好逐格平移） */}
                      <span
                        className={styles.tabThumb}
                        style={{ transform: `translateX(${Math.max(loginTabs.findIndex((tab) => tab.name === activeLoginType), 0) * 100}%)` }}
                        aria-hidden="true"
                      />
                      {loginTabs.map((tab) => (
                        <div
                          key={tab.name}
                          className={`${styles.tabItem}${activeLoginType === tab.name ? ` ${styles.active}` : ''}`}
                          onClick={() => switchLoginType(tab.name)}
                        >
                          {tab.label}
                        </div>
                      ))}
                    </div>

                    <div className={styles.tabContent}>
                      {/* out-in 交叉切换：visible=false 播离场（旧表单淡出）→
                          onLeaveEnd 换 displayLoginType 并回 true 播入场（淡入上浮）。
                          removeOnLeave=false 保证离场期间节点保留，动画由内联样式驱动 */}
                      <CSSMotion
                        visible={!tabLeaving}
                        motionAppear
                        motionEnter
                        motionLeave
                        removeOnLeave={false}
                        {...loginMotions.loginTab}
                        onLeaveEnd={() => {
                          setDisplayLoginType(activeLoginType)
                          setTabLeaving(false)
                          // 返回 false 阻止引擎清空离场样式（opacity 0）：换内容的那一帧
                          // 新表单仍处透明，紧接着的 enter 阶段无缝接管，避免闪一帧全显
                          return false
                        }}
                      >
                        {({ style, className }) => (
                          <div style={style} className={className}>
                            {/* 账号密码登录 */}
                            {displayLoginType === 'account' && (
                              <AccountPasswordLogin
                                onSwitchToForgotPassword={() => setView('forgot')}
                                onLoginSuccess={onLoginSuccess}
                              />
                            )}
                            {/* 手机登录 */}
                            {displayLoginType === 'phone' && (
                              <PhoneLogin onLoginSuccess={onLoginSuccess} />
                            )}
                            {/* 邮箱登录 */}
                            {displayLoginType === 'email' && (
                              <EmailLogin onLoginSuccess={onLoginSuccess} />
                            )}
                          </div>
                        )}
                      </CSSMotion>
                    </div>

                    {/* 第三方登录方式（Divider 自带分隔线；按钮圆形/Tooltip 均由 antd
                        承载，颜色跟随明暗主题，仅保留品牌色 hover 覆写） */}
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
                            icon={<img src={wechatIcon} alt="" width={24} height={24} />}
                          />
                        </Tooltip>
                        <Tooltip title={t('login.social.qq')} placement="bottom">
                          <Button
                            type="text"
                            shape="circle"
                            size="large"
                            className={`${styles.socialBtn} ${styles.qqBtn}`}
                            aria-label={t('login.social.qq')}
                            onClick={debouncedHandleQQLogin}
                            icon={<img src={qqIcon} alt="" width={24} height={24} />}
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
