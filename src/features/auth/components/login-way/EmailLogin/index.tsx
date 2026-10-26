/**
 * 【business】EmailLogin —— 邮箱验证码登录方式
 * - 沿用旧语义：提交暂跳过前端校验（回车 / 按钮直调 runLogin）
 * - 发送验证码前仅校验 email 字段（等价 validateField('email')）
 * - 登录成功后跳转由页面层处理（business 不碰 router）
 */
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { App as AntApp, Button, Form, Input, Select } from 'antd'
import { BankOutlined, MailOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import { useAuthLogin, sendEmailCode } from '@/features/auth/hooks/useAuth'
import styles from './EmailLogin.module.css'

interface EmailLoginProps {
  /** 登录成功（跳转由页面层处理） */
  onLoginSuccess?: () => void
}

// 登录表单数据
interface EmailLoginFormState {
  school: string
  email: string
  code: string
}

// 学校选项
interface SchoolOption {
  value: string
  label: string
}

const schools: SchoolOption[] = [
  { value: 'tsinghua', label: '清华大学' },
  { value: 'nist', label: '宁夏理工学院' },
]

const initialValues: Partial<EmailLoginFormState> = {
  school: '',
  email: '',
  code: '',
}

export function EmailLogin({ onLoginSuccess }: EmailLoginProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [form] = Form.useForm<EmailLoginFormState>()

  // 倒计时
  const [emailCountdown, setEmailCountdown] = useState(0)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // 开始重发倒计时
  function startCountdown(): void {
    setEmailCountdown(60)
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    countdownTimer.current = setInterval(() => {
      setEmailCountdown((n) => {
        if (n <= 1 && countdownTimer.current) {
          clearInterval(countdownTimer.current)
          countdownTimer.current = null
        }
        return n - 1
      })
    }, 1000)
  }

  // 发送邮箱验证码（server 层统一出口；错误已归一化）
  const handleSendEmailCode = async () => {
    // 等价 validateField('email')：仅校验邮箱，失败静默（错误已展示在表单项下）
    const emailValid = await form
      .validateFields(['email'])
      .then(() => true)
      .catch(() => false)
    if (!emailValid) return

    const { email } = form.getFieldsValue()
    try {
      await sendEmailCode({ email, scene: 'login' })
      message.success(t('login.form.codeSent'))
      startCountdown()
    } catch {
      message.error(t('login.form.codeSendRetry'))
    }
  }

  // 登录：loading / 成功写 store / 实时通道建立均由 useAuthLogin 统一管理
  const { run: runLogin, loading } = useAuthLogin({
    onSuccess: (result) => {
      message.success(result.message ?? '登录成功')
      onLoginSuccess?.()
    },
    onError: (error) => {
      message.error(error.message || t('login.form.loginFail'))
    },
  })

  // 邮箱登录处理函数（沿用旧语义：暂跳过前端校验）
  const handleEmailLogin = () => {
    const { email, code } = form.getFieldsValue()
    runLogin({
      roleId: 'student',
      loginType: 'email',
      email,
      code,
    })
  }

  // 等价 el-form 的 @keyup.enter
  const handleEnterKey = (e: ReactKeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') handleEmailLogin()
  }

  // 组件卸载前清理倒计时定时器，避免内存泄漏
  useEffect(
    () => () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current)
        countdownTimer.current = null
      }
    },
    [],
  )

  return (
    <Form
      form={form}
      className={styles.loginForm}
      initialValues={initialValues}
      onKeyDown={handleEnterKey}
    >
      <Form.Item
        name="school"
        validateTrigger="onChange"
        rules={[{ required: true, message: t('login.form.schoolRequired'), validateTrigger: 'onChange' }]}
      >
        <Select
          placeholder={t('login.form.schoolPlaceholder')}
          size="large"
          allowClear
          showSearch
          optionFilterProp="label"
          prefix={<BankOutlined />}
          options={schools}
        />
      </Form.Item>

      <Form.Item
        name="email"
        validateTrigger="onBlur"
        rules={[
          { required: true, message: t('login.form.emailRequired'), validateTrigger: 'onBlur' },
          {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: t('login.form.emailFormat'),
            validateTrigger: 'onBlur',
          },
        ]}
      >
        <Input
          placeholder={t('login.form.emailPlaceholder')}
          prefix={<MailOutlined />}
          size="large"
          allowClear
        />
      </Form.Item>

      <Form.Item className={styles.captchaFormItem}>
        <div className={styles.captchaInputContainer}>
          <Form.Item
            name="code"
            noStyle
            validateTrigger="onBlur"
            rules={[
              { required: true, message: t('login.form.codeRequired'), validateTrigger: 'onBlur' },
              { pattern: /^\d{6}$/, message: t('login.form.codeFormat'), validateTrigger: 'onBlur' },
            ]}
          >
            <Input
              placeholder={t('login.form.codePlaceholder')}
              size="large"
              maxLength={6}
            />
          </Form.Item>
          <Button
            size="large"
            className={styles.codeBtn}
            disabled={emailCountdown > 0}
            onClick={handleSendEmailCode}
          >
            {emailCountdown > 0
              ? t('login.form.codeResend', { n: emailCountdown })
              : t('login.form.getCode')}
          </Button>
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          size="large"
          block
          className={styles.loginButton}
          loading={loading}
          icon={<MailOutlined />}
          onClick={handleEmailLogin}
        >
          {t('login.form.emailBtn')}
        </Button>
      </Form.Item>
    </Form>
  )
}

export default EmailLogin
