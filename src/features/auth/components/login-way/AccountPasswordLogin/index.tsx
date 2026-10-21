/**
 * 【business】AccountPasswordLogin —— 账号密码登录方式
 * - 沿用旧语义：提交暂跳过前端校验（回车 / 按钮直调 runLogin）
 * - rules 保留失焦/变更时的即时校验展示（等价 Element Plus trigger 行为：
 *   输入类 blur、下拉 change）
 * - ElForm/ElInput/ElSelect → AntD Form/Input/Select；loading/成功写 store/
 *   实时通道均由 useAuthLogin 统一管理
 * - 验证码行「输入框 + canvas」需整体作为 Form.Item 受控子树，
 *   故封装 CaptchaField 接收 value/onChange（模块级定义，避免重挂载丢焦点）
 */
import { useEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react'
import { App as AntApp, Button, Checkbox, Form, Input, Select } from 'antd'
import { BankOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import { readCssColor } from '@/utils/cssVar'
import { useAuthLogin } from '@/features/auth/hooks/useAuth'
import styles from './AccountPasswordLogin.module.css'

interface AccountPasswordLoginProps {
  /** 跳转忘记密码（跳转由页面层处理，business 不碰 router） */
  onSwitchToForgotPassword?: () => void
  /** 登录成功（remember 写入与跳转由页面层处理） */
  onLoginSuccess?: (payload: { remember: boolean }) => void
}

// 登录表单数据
interface LoginFormState {
  school: string
  userId: string
  password: string
  captcha: string
  remember: boolean
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

const initialValues: Partial<LoginFormState> = {
  school: '',
  userId: '',
  password: '',
  captcha: '',
  remember: false,
}

/** 验证码行（输入框 + 刷新画布），作为 Form.Item 的受控子组件 */
interface CaptchaFieldProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  canvasRef: RefObject<HTMLCanvasElement>
  onRefresh: () => void
}

function CaptchaField({ value, onChange, placeholder, canvasRef, onRefresh }: CaptchaFieldProps) {
  const { t } = useI18n()
  return (
    <div className={styles.captchaInputContainer}>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        size="large"
        maxLength={4}
      />
      <button
        type="button"
        className={`${styles.captchaImage} btn-reset`}
        aria-label={t('auth.captcha.refresh')}
        onClick={onRefresh}
      >
        <canvas ref={canvasRef} width={100} height={40} />
      </button>
    </div>
  )
}

export function AccountPasswordLogin({
  onSwitchToForgotPassword,
  onLoginSuccess,
}: AccountPasswordLoginProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [form] = Form.useForm<LoginFormState>()

  // 验证码 Canvas 引用
  const captchaCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // 验证码文本（非渲染态，用 ref 供 rules 闭包读取）
  const captchaTextRef = useRef('')

  // 验证码校验器（对比 canvas 生成的文本）
  const validateCaptcha = useMemo(
    () =>
      (_rule: unknown, value: string | undefined): Promise<void> => {
        const v = value ?? ''
        if (v.toLowerCase() !== captchaTextRef.current.toLowerCase()) {
          return Promise.reject(new Error(t('login.form.captchaError')))
        }
        return Promise.resolve()
      },
    [t],
  )

  // 生成验证码（画布逻辑逐字平移）
  const generateCaptcha = () => {
    const canvas = captchaCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布实际尺寸
    canvas.width = 100
    canvas.height = 40

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 设置背景：跟随明暗主题（canvas 需实色，故经 readCssColor 解析语义变量）
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, readCssColor('var(--bg-soft)'))
    gradient.addColorStop(1, readCssColor('var(--bg-blue-tint)'))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 生成随机验证码文本
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let text = ''
    for (let i = 0; i < 4; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    captchaTextRef.current = text

    // 绘制验证码
    ctx.font = 'bold 20px Arial'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // 绘制字符，添加随机变化
    for (let i = 0; i < text.length; i++) {
      // 随机颜色
      const r = Math.floor(Math.random() * 155 + 100)
      const g = Math.floor(Math.random() * 155 + 100)
      const b = Math.floor(Math.random() * 155 + 100)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

      // 添加随机旋转和位置
      const x = 15 + i * 20
      const y = 20
      const angle = (Math.random() - 0.5) * 0.4 // 小幅度旋转

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }

    // 绘制少量干扰线
    ctx.lineWidth = 0.5
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 155 + 100)}, ${Math.floor(
        Math.random() * 155 + 100,
      )}, ${Math.floor(Math.random() * 155 + 100)})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }
  }

  // 登录：loading / 成功写 store / 实时通道建立均由 useAuthLogin 统一管理
  const { run: runLogin, loading } = useAuthLogin({
    onSuccess: (result) => {
      message.success(result.message ?? '登录成功')
      onLoginSuccess?.({ remember: form.getFieldValue('remember') === true })
    },
    onError: (error) => {
      message.error(error.message || t('login.form.loginFail'))
    },
  })

  // 登录处理函数（沿用旧语义：暂跳过前端校验）
  const handleLogin = () => {
    const { school, userId, password } = form.getFieldsValue()
    runLogin({
      roleId: 'student',
      loginType: 'account',
      school,
      userId,
      password,
    })
  }

  // 等价 el-form 的 @keyup.enter
  const handleEnterKey = (e: ReactKeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') handleLogin()
  }

  // 组件挂载时生成验证码（等价 onMounted：effect 在 DOM 提交后执行）
  useEffect(() => {
    generateCaptcha()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        name="userId"
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
        name="password"
        validateTrigger="onBlur"
        rules={[
          { required: true, message: t('login.form.passwordRequired'), validateTrigger: 'onBlur' },
          { min: 6, max: 20, message: t('login.form.passwordLength'), validateTrigger: 'onBlur' },
        ]}
      >
        <Input.Password
          placeholder={t('login.form.passwordPlaceholder')}
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="captcha"
        className={styles.captchaFormItem}
        validateTrigger="onBlur"
        rules={[
          { required: true, message: t('login.form.captchaRequired'), validateTrigger: 'onBlur' },
          { min: 4, max: 4, message: t('login.form.captchaLength'), validateTrigger: 'onBlur' },
          { validator: validateCaptcha, validateTrigger: 'onBlur' },
        ]}
      >
        <CaptchaField
          placeholder={t('login.form.captchaPlaceholder')}
          canvasRef={captchaCanvasRef}
          onRefresh={generateCaptcha}
        />
      </Form.Item>

      <Form.Item className={styles.loginOptions}>
        <div className={styles.loginOptionsContainer}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{t('login.form.remember')}</Checkbox>
          </Form.Item>
          <Button type="link" className={styles.forgotLink} onClick={onSwitchToForgotPassword}>
            {t('login.form.forgotPassword')}
          </Button>
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          size="large"
          block
          shape="round"
          className={styles.loginButton}
          loading={loading}
          icon={<UserOutlined />}
          onClick={handleLogin}
        >
          {t('login.form.accountBtn')}
        </Button>
      </Form.Item>
    </Form>
  )
}

export default AccountPasswordLogin
