/**
 * 【business】PhoneLogin —— 手机号验证码登录方式
 * - 沿用旧语义：提交暂跳过前端校验（回车 / 按钮直调 runLogin）
 * - 发送验证码前仅校验 phone 字段；沿用旧实现：暂为前端模拟，
 *   后端短信契约就绪后接入 server 层
 * - 登录成功后跳转由页面层处理（business 不碰 router）
 */
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { App as AntApp, Button, Form, Input, Select } from 'antd'
import { BankOutlined, MobileOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import { useAuthLogin } from '@/features/auth/hooks/useAuth'
import styles from './PhoneLogin.module.css'

interface PhoneLoginProps {
  /** 登录成功（跳转由页面层处理） */
  onLoginSuccess?: () => void
}

// 登录表单数据
interface PhoneLoginFormState {
  school: string
  phone: string
  code: string
}

// 学校选项
interface SchoolOption {
  value: string
  label: string
}

const schools: SchoolOption[] = [
  { value: 'tsinghua', label: '清华大学' },
  { value: 'pku', label: '北京大学' },
  { value: 'fudan', label: '复旦大学' },
  { value: 'sjtu', label: '上海交通大学' },
  { value: 'zju', label: '浙江大学' },
]

const initialValues: Partial<PhoneLoginFormState> = {
  school: '',
  phone: '',
  code: '',
}

export function PhoneLogin({ onLoginSuccess }: PhoneLoginProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [form] = Form.useForm<PhoneLoginFormState>()

  // 倒计时
  const [phoneCountdown, setPhoneCountdown] = useState(0)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // 开始重发倒计时
  function startCountdown(): void {
    setPhoneCountdown(60)
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    countdownTimer.current = setInterval(() => {
      setPhoneCountdown((n) => {
        if (n <= 1 && countdownTimer.current) {
          clearInterval(countdownTimer.current)
          countdownTimer.current = null
        }
        return n - 1
      })
    }, 1000)
  }

  // 发送手机验证码（沿用旧实现：暂为前端模拟，后端短信契约就绪后接入 server 层）
  const sendPhoneCode = async () => {
    // 等价 validateField('phone')：仅校验手机号，失败静默（错误已展示在表单项下）
    const phoneValid = await form
      .validateFields(['phone'])
      .then(() => true)
      .catch(() => false)
    if (!phoneValid) return

    // 模拟发送验证码成功
    message.success(t('login.form.codeSent'))

    // 开始倒计时
    startCountdown()
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

  // 手机登录处理函数（沿用旧语义：暂跳过前端校验）
  const handlePhoneLogin = () => {
    const { phone, code } = form.getFieldsValue()
    runLogin({
      roleId: 'student',
      loginType: 'phone',
      phone,
      code,
    })
  }

  // 等价 el-form 的 @keyup.enter
  const handleEnterKey = (e: ReactKeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') handlePhoneLogin()
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
        name="phone"
        validateTrigger="onBlur"
        rules={[
          { required: true, message: t('login.form.phoneRequired'), validateTrigger: 'onBlur' },
          {
            pattern: /^1[3-9]\d{9}$/,
            message: t('login.form.phoneFormat'),
            validateTrigger: 'onBlur',
          },
        ]}
      >
        <Input
          placeholder={t('login.form.phonePlaceholder')}
          prefix={<MobileOutlined />}
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
            disabled={phoneCountdown > 0}
            onClick={sendPhoneCode}
          >
            {phoneCountdown > 0
              ? t('login.form.codeResend', { n: phoneCountdown })
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
          icon={<MobileOutlined />}
          onClick={handlePhoneLogin}
        >
          {t('login.form.phoneBtn')}
        </Button>
      </Form.Item>
    </Form>
  )
}

export default PhoneLogin
