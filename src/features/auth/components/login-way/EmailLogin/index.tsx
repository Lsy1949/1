/**
 * 【business】EmailLogin —— 邮箱验证码登录方式（契约 §1.1 loginType=email）
 * - 学校选择器与登录页同源（/api/tenants/public，React Query 同 key 复用缓存）；
 *   子域站点隐藏选择器，tenantId 由站点解析注入
 * - 发送验证码前仅校验 email 字段；60s 重发倒计时（共享 useCountdown）
 * - 登录前统一 validateFields（校验收敛到点击时）；成功后跳转由页面层处理
 */
import { useEffect } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntApp, Button, Form, Input, Select } from 'antd'
import { BankOutlined, MailOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import { useAuthLogin, sendEmailCode } from '@/features/auth/hooks/useAuth'
import { useCountdown } from '@/features/auth/hooks/useCountdown'
import { fetchPublicTenants } from '@/api/modules/auth'
import { resolveTenantId } from '@/config/tenant/resolve'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'
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

// 与登录页一致的主域判定：主域显示学校选择器，子域由站点注入租户
const IS_MAIN_SITE =
  resolveTenantId() === DEFAULT_TENANT_ID && !import.meta.env.VITE_PRIVATE_TENANT

const initialValues: Partial<EmailLoginFormState> = {
  school: '',
  email: '',
  code: '',
}

export function EmailLogin({ onLoginSuccess }: EmailLoginProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [form] = Form.useForm<EmailLoginFormState>()

  // 重发倒计时（共享 hook：归零自动停表，卸载自动清理）
  const { countdown: emailCountdown, start: startCountdown } = useCountdown()

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

  // 发送邮箱验证码（server 层统一出口；错误已归一化；mock devCode 随 toast 透出）
  const handleSendEmailCode = async () => {
    // 等价 validateField('email')：仅校验邮箱，失败静默（错误已展示在表单项下）
    const emailValid = await form
      .validateFields(['email'])
      .then(() => true)
      .catch(() => false)
    if (!emailValid) return

    const { email } = form.getFieldsValue()
    try {
      const result = await sendEmailCode({ email, scene: 'login' })
      const devHint = result.devCode ? ` [${t('login.code.devHint', { code: result.devCode })}]` : ''
      message.success(`${t('login.form.codeSent')}${devHint}`)
      startCountdown(60)
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

  // 邮箱登录处理函数：提交前统一校验（校验收敛到点击时，与账号密码登录一致）
  const handleEmailLogin = async () => {
    const fields = IS_MAIN_SITE ? ['school', 'email', 'code'] : ['email', 'code']
    const values = await form.validateFields(fields).catch(() => null)
    if (!values) return
    runLogin({
      roleId: 'student',
      loginType: 'email',
      tenantId: IS_MAIN_SITE ? form.getFieldValue('school') : resolveTenantId(),
      email: form.getFieldValue('email'),
      code: form.getFieldValue('code'),
    })
  }

  // 等价 el-form 的 @keyup.enter
  const handleEnterKey = (e: ReactKeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') void handleEmailLogin()
  }

  return (
    <Form
      form={form}
      className={styles.loginForm}
      initialValues={initialValues}
      onKeyDown={handleEnterKey}
    >
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
            onClick={() => void handleSendEmailCode()}
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
          onClick={() => void handleEmailLogin()}
        >
          {t('login.form.emailBtn')}
        </Button>
      </Form.Item>
    </Form>
  )
}

export default EmailLogin
