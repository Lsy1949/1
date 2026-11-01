/**
 * 【business】ForgotPasswordForm —— 忘记密码（大厂式三步向导）
 * Step 1 身份验证（学校 + 学号 + 注册邮箱，后端校验账号与邮箱匹配）
 * → Step 2 邮箱验证码（脱敏邮箱展示 + 60s 限流）→ Step 3 设置新密码 → 成功页。
 *
 * - 安全语义：新密码必须凭邮箱验证码换取的 verifyToken 设置，
 *   不再支持「仅凭学号+邮箱一步改密」（原实现的安全缺陷）
 * - 单 Form 实例贯穿三步；学校选择器与登录页同源；
 *   异步状态全部 useMutation，错误码 → i18n 见 utils/errcode
 */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntApp, Button, Flex, Form, Input, Select, Steps } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BankOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useI18n } from '@/i18n'
import {
  useResetPassword,
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
import styles from './ForgotPasswordForm.module.css'

interface ForgotPasswordFormProps {
  /** 返回登录 */
  onSwitchToLogin?: () => void
}

/** 忘记密码表单数据（三步共用一个 Form 实例） */
interface ForgotPasswordFormState {
  school: string
  username: string
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

/** 与登录页一致的主域判定：主域显示学校选择器，子域由站点注入租户 */
const IS_MAIN_SITE =
  resolveTenantId() === DEFAULT_TENANT_ID && !import.meta.env.VITE_PRIVATE_TENANT

/** 成功页自动返回登录的倒计时秒数 */
const SUCCESS_COUNTDOWN = 5

/** 验证码重发间隔（与后端 60s 限流对齐） */
const RESEND_SECONDS = 60

const initialValues: Partial<ForgotPasswordFormState> = {
  school: '',
  username: '',
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp()

  const [form] = Form.useForm<ForgotPasswordFormState>()

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

  useEffect(() => {
    if (IS_MAIN_SITE && schoolOptions.length > 0 && !form.getFieldValue('school')) {
      form.setFieldsValue({ school: schoolOptions[0].value })
    }
  }, [schoolOptions, form])

  const passwordValue = Form.useWatch('newPassword', form)

  // Step 1 → 2：发送验证码（后端校验「账号存在 + 邮箱匹配」+ 60s 限流）
  const { run: runSendCode, loading: sendLoading } = useSendEmailCode({
    onSuccess: (result) => {
      setMaskedEmail(result.emailMasked)
      codeCountdown.start(RESEND_SECONDS)
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

  // Step 3：提交重置（成功 → 成功页 + 倒计时自动回登录）
  const { run: runReset, loading: resetLoading } = useResetPassword({
    onSuccess: () => {
      setDone(true)
      successCountdown.start(SUCCESS_COUNTDOWN)
    },
    onError: (error) => {
      message.error(authErrorMessage(t, error))
    },
  })

  const stepFields = useMemo<(keyof ForgotPasswordFormState)[]>(() => {
    if (step === 0) {
      return IS_MAIN_SITE ? ['school', 'username', 'email'] : ['username', 'email']
    }
    if (step === 1) return ['code']
    return ['newPassword', 'confirmPassword']
  }, [step])

  const handleStepNext = async () => {
    const values = await form.validateFields(stepFields).catch(() => null)
    if (!values) return
    const tenantId = IS_MAIN_SITE ? form.getFieldValue('school') : resolveTenantId()
    const email = form.getFieldValue('email')
    const username = form.getFieldValue('username')
    if (step === 0) {
      runSendCode({ email, scene: 'reset', tenantId, username })
      return
    }
    if (step === 1) {
      runVerify({ email, scene: 'reset', code: form.getFieldValue('code') })
      return
    }
    runReset({
      tenantId,
      username,
      newPassword: form.getFieldValue('newPassword'),
      email,
      verifyToken,
    })
  }

  const handleResend = () => {
    runSendCode({
      email: form.getFieldValue('email'),
      scene: 'reset',
      tenantId: IS_MAIN_SITE ? form.getFieldValue('school') : resolveTenantId(),
      username: form.getFieldValue('username'),
    })
  }

  useEffect(() => {
    if (done && successCountdown.countdown === 0) {
      onSwitchToLogin?.()
    }
  }, [done, successCountdown.countdown, onSwitchToLogin])

  const nextLoading = sendLoading || verifyLoading || resetLoading

  if (done) {
    return (
      <AuthSuccess
        titleKey="login.forgot.success.title"
        descKey="login.forgot.success.desc"
        countdown={successCountdown.countdown}
        onBackToLogin={() => onSwitchToLogin?.()}
      />
    )
  }

  return (
    <Form
      form={form}
      className="forgot-password-form-content"
      initialValues={initialValues}
    >
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

      {/* Step 1 身份验证 */}
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
              placeholder={t('login.form.registeredEmailPlaceholder')}
              prefix={<MailOutlined />}
              size="large"
              allowClear
            />
          </Form.Item>
        </>
      )}

      {/* Step 2 邮箱验证（脱敏邮箱由后端下发，防枚举） */}
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

      {/* Step 3 设置新密码 */}
      {step === 2 && (
        <>
          <Form.Item
            name="newPassword"
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
              placeholder={t('login.forgot.newPasswordPlaceholder')}
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>

          <PasswordStrength value={passwordValue} />

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            validateTrigger="onBlur"
            rules={[
              { required: true, message: t('login.form.confirmRequired'), validateTrigger: 'onBlur' },
              {
                validator: (_rule, value: string | undefined) =>
                  value !== form.getFieldValue('newPassword')
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
          className={styles.forgotPasswordButton}
          loading={nextLoading}
          icon={step < 2 ? <ArrowRightOutlined /> : <KeyOutlined />}
          onClick={() => void handleStepNext()}
        >
          {step < 2 ? t('login.common.next') : t('login.forgot.submit')}
        </Button>
      </Flex>
    </Form>
  )
}

export default ForgotPasswordForm
