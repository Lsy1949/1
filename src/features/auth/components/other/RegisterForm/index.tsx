/**
 * 【business】RegisterForm —— 注册表单（大厂式三步向导）
 * Step 1 身份信息（学校 + 学号 + 邮箱）→ Step 2 邮箱验证（服务端验证码，
 * 60s 限流）→ Step 3 设置密码（强度条）→ 成功页倒计时自动回登录。
 *
 * - 单 Form 实例贯穿三步：每步「下一步」只校验当前步字段，values 累积不丢
 * - 学校选择器与登录页同源（/api/tenants/public，React Query 同 key 复用缓存）；
 *   子域站点隐藏选择器，tenantId 由站点解析注入
 * - 客户端 canvas 验证码已废弃：验证码由服务端签发校验（契约 §1.4），
 *   mock 通过 devCode 字段回传演示码
 * - 异步状态全部 useMutation（React Query 统一管理），错误码 → i18n 见 utils/errcode
 */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntApp, Button, Flex, Form, Input, Select, Steps } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BankOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useRegister,
  useSendEmailCode,
  useVerifyEmailCode,
} from '@/features/auth/hooks/useAuth'
import { useCountdown } from '@/features/auth/hooks/useCountdown'
import { fetchPublicTenants } from '@/api/modules/auth'
import { resolveTenantId } from '@/config/tenant/resolve'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'
import { authErrorMessage } from '@/features/auth/utils/errcode'
import PasswordStrength from '../../shared/PasswordStrength'
import AuthSuccess from '../../shared/AuthSuccess'
import styles from './RegisterForm.module.css'

interface RegisterFormProps {
  /** 注册成功后返回登录 */
  onSwitchToLogin?: () => void
}

/** 注册表单数据（三步共用一个 Form 实例，字段按步渲染） */
interface RegisterFormState {
  school: string
  username: string
  email: string
  code: string
  password: string
  confirmPassword: string
}

/** 与登录页一致的主域判定：主域显示学校选择器，子域由站点注入租户 */
const IS_MAIN_SITE =
  resolveTenantId() === DEFAULT_TENANT_ID && !import.meta.env.VITE_PRIVATE_TENANT

/** 成功页自动返回登录的倒计时秒数 */
const SUCCESS_COUNTDOWN = 5

/** 验证码重发间隔（与后端 60s 限流对齐） */
const RESEND_SECONDS = 60

const initialValues: Partial<RegisterFormState> = {
  school: '',
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()

  const [form] = Form.useForm<RegisterFormState>()

  // 向导状态：当前步 / 一次性凭证 / 已发送的目标邮箱（脱敏展示）
  const [step, setStep] = useState(0)
  const [verifyToken, setVerifyToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')

  const codeCountdown = useCountdown()
  const successCountdown = useCountdown()
  const [done, setDone] = useState(false)

  // 学校选择器数据源：与登录页同 key，React Query 直接复用缓存
  const { data: schools, isPending: schoolsLoading, refetch: refetchSchools } = useQuery({
    queryKey: ['public-tenants'],
    queryFn: fetchPublicTenants,
    enabled: IS_MAIN_SITE,
    retry: 2,
    staleTime: 5 * 60_000,
    select: (list) =>
      Array.isArray(list) && list.length > 0
        ? list.map((opt) => ({ value: opt.tenantId, label: opt.name }))
        : [],
  })
  const schoolOptions = schools ?? []

  // 默认选中第一项（仅当用户未选择时回填，不覆盖用户操作）
  useEffect(() => {
    if (IS_MAIN_SITE && schoolOptions.length > 0 && !form.getFieldValue('school')) {
      form.setFieldsValue({ school: schoolOptions[0].value })
    }
  }, [schoolOptions, form])

  const passwordValue = Form.useWatch('password', form)

  // Step 1 → 2：发送验证码（后端校验邮箱未占用 + 60s 限流）
  const { run: runSendCode, loading: sendLoading } = useSendEmailCode({
    onSuccess: (result) => {
      setMaskedEmail(result.emailMasked)
      codeCountdown.start(RESEND_SECONDS)
      // mock 无法发信：devCode 随 toast 透出，便于联调；真实后端不下发该字段
      const devHint = result.devCode ? ` [${t('login.code.devHint', { code: result.devCode })}]` : ''
      message.success(`${t('login.code.sentTo', { email: result.emailMasked })}${devHint}`)
      setStep(1)
    },
    onError: (error) => {
      message.error(authErrorMessage(t, error))
    },
  })

  // Step 2 → 3：校验验证码，换取一次性 verifyToken
  const { run: runVerify, loading: verifyLoading } = useVerifyEmailCode({
    onSuccess: (result) => {
      setVerifyToken(result.verifyToken)
      setStep(2)
    },
    onError: (error) => {
      message.error(authErrorMessage(t, error))
    },
  })

  // Step 3：提交注册（成功 → 成功页 + 倒计时自动回登录）
  const { run: runRegister, loading: registerLoading } = useRegister({
    onSuccess: () => {
      setDone(true)
      successCountdown.start(SUCCESS_COUNTDOWN)
    },
    onError: (error) => {
      message.error(authErrorMessage(t, error))
    },
  })

  /** 每步需要校验的字段（学校选择器仅主域存在） */
  const stepFields = useMemo<(keyof RegisterFormState)[]>(() => {
    if (step === 0) {
      return IS_MAIN_SITE ? ['school', 'username', 'email'] : ['username', 'email']
    }
    if (step === 1) return ['code']
    return ['password', 'confirmPassword']
  }, [step])

  /** 当前步的提交动作（下一步 / 提交注册） */
  const handleStepNext = async () => {
    const values = await form.validateFields(stepFields).catch(() => null)
    if (!values) return
    const tenantId = IS_MAIN_SITE ? form.getFieldValue('school') : resolveTenantId()
    const email = form.getFieldValue('email')
    if (step === 0) {
      runSendCode({ email, scene: 'register' })
      return
    }
    if (step === 1) {
      runVerify({ email, scene: 'register', code: form.getFieldValue('code') })
      return
    }
    runRegister({
      tenantId,
      username: form.getFieldValue('username'),
      password: form.getFieldValue('password'),
      email,
      verifyToken,
    })
  }

  /** 重发验证码（限流由后端 60s 窗口兜底，前端倒计时同步冷却） */
  const handleResend = () => {
    runSendCode({ email: form.getFieldValue('email'), scene: 'register' })
  }

  // 成功页倒计时归零 → 自动返回登录
  useEffect(() => {
    if (done && successCountdown.countdown === 0) {
      onSwitchToLogin?.()
    }
  }, [done, successCountdown.countdown, onSwitchToLogin])

  const nextLoading = sendLoading || verifyLoading || registerLoading

  if (done) {
    return (
      <AuthSuccess
        titleKey="login.register.success.title"
        descKey="login.register.success.desc"
        countdown={successCountdown.countdown}
        onBackToLogin={() => onSwitchToLogin?.()}
      />
    )
  }

  return (
    <Form
      form={form}
      className="register-form-content"
      initialValues={initialValues}
    >
      {/* 步骤导航（大厂向导标配：位置感 + 可回退预期） */}
      <Steps
        size="small"
        current={step}
        className={styles.steps}
        items={[
          { title: t('login.steps.account') },
          { title: t('login.steps.verify') },
          { title: t('login.steps.password') },
        ]}
      />

      {/* Step 1 身份信息 */}
      {step === 0 && (
        <>
          {IS_MAIN_SITE && (
            <Form.Item
              name="school"
              validateTrigger="onChange"
              rules={[{ required: true, message: t('login.form.schoolRequired'), validateTrigger: 'onChange' }]}
            >
              <Select
                placeholder={t('login.form.schoolPlaceholder')}
                size="large"
                showSearch
                optionFilterProp="label"
                prefix={<BankOutlined />}
                options={schoolOptions}
                loading={schoolsLoading}
                notFoundContent={
                  schoolOptions.length === 0 ? (
                    schoolsLoading ? (
                      t('common.loading')
                    ) : (
                      <Button type="link" size="small" onClick={() => void refetchSchools()}>
                        {t('login.form.schoolLoadFailed')}
                      </Button>
                    )
                  ) : undefined
                }
              />
            </Form.Item>
          )}

          <Form.Item
            name="username"
            validateTrigger="onBlur"
            rules={[
              { required: true, message: t('login.form.userIdRequired'), validateTrigger: 'onBlur' },
              { min: 1, max: 20, message: t('login.form.userIdLength'), validateTrigger: 'onBlur' },
            ]}
          >
            <Input
              placeholder={t('login.form.userIdPlaceholder')}
              prefix={<UserOutlined />}
              size="large"
              allowClear
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
        </>
      )}

      {/* Step 2 邮箱验证 */}
      {step === 1 && (
        <>
          <p className={styles.sentTip}>{t('login.code.sentTo', { email: maskedEmail })}</p>
          <Form.Item
            name="code"
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
              allowClear
            />
          </Form.Item>
          <Flex justify="end" className={styles.resendRow}>
            <Button
              type="link"
              size="small"
              disabled={codeCountdown.countdown > 0 || sendLoading}
              onClick={handleResend}
            >
              {codeCountdown.countdown > 0
                ? t('login.form.codeResend', { n: codeCountdown.countdown })
                : t('login.form.getCode')}
            </Button>
          </Flex>
        </>
      )}

      {/* Step 3 设置密码 */}
      {step === 2 && (
        <>
          <Form.Item
            name="password"
            validateTrigger="onBlur"
            rules={[
              { required: true, message: t('login.form.passwordRequired'), validateTrigger: 'onBlur' },
              { min: 6, max: 20, message: t('login.form.passwordLength'), validateTrigger: 'onBlur' },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
                message: t('login.form.passwordFormat'),
                validateTrigger: 'onBlur',
              },
            ]}
          >
            <Input.Password
              placeholder={t('login.form.passwordPlaceholder')}
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>

          <PasswordStrength value={passwordValue} />

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            validateTrigger="onBlur"
            rules={[
              { required: true, message: t('login.form.confirmRequired'), validateTrigger: 'onBlur' },
              {
                validator: (_rule, value: string | undefined) =>
                  value !== form.getFieldValue('password')
                    ? Promise.reject(new Error(t('login.form.confirmMismatch')))
                    : Promise.resolve(),
                validateTrigger: 'onBlur',
              },
            ]}
          >
            <Input.Password
              placeholder={t('login.form.confirmPlaceholder')}
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>
        </>
      )}

      {/* 步骤按钮：上一步（保留已填值）/ 下一步 / 提交注册 */}
      <Flex gap={8} className={styles.stepActions}>
        {step > 0 && (
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => setStep(step - 1)}
            className={styles.prevButton}
          >
            {t('login.common.prev')}
          </Button>
        )}
        <Button
          type="primary"
          size="large"
          block
          shape="round"
          className={styles.registerButton}
          loading={nextLoading}
          icon={step < 2 ? <ArrowRightOutlined /> : <UserOutlined />}
          onClick={() => void handleStepNext()}
        >
          {step < 2 ? t('login.common.next') : t('login.register.submit')}
        </Button>
      </Flex>
    </Form>
  )
}

export default RegisterForm
