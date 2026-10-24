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
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react'
import { App as AntApp, Button, Checkbox, Form, Input, Select } from 'antd'
import { BankOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import { readCssColor } from '@/utils/cssVar'
import { useAuthLogin } from '@/features/auth/hooks/useAuth'
import { fetchPublicTenants } from '@/api/modules/auth'
import { resolveTenantId } from '@/config/tenant/resolve'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'
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

/**
 * 主域判定：resolveTenantId() === 主域租户 且非私有化构建。
 * 覆盖 localhost（→主域 显示选择器）、nist.localhost（→nist 隐藏）、
 * www.psy.com（www 在子域排除规则内 → 主域 显示）三种输入；
 * 私有化构建（VITE_PRIVATE_TENANT 锁定）永远不显示选择器。
 */
const IS_MAIN_SITE =
  resolveTenantId() === DEFAULT_TENANT_ID && !import.meta.env.VITE_PRIVATE_TENANT

const initialValues: Partial<LoginFormState> = {
  // school 不预填：主域等 /api/tenants/public 返回后默认选中列表第一项（后端驱动）
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

  // 学校选择器数据源：仅主域拉取 /api/tenants/public，完全后端驱动——
  // 不塞前端兜底项、不预填默认值；成功后默认选中列表第一项（后端契约
  // 保证第一项为 default 主站，前端不假设其内容）；失败明示（空列表 + 提示）
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [schoolsFailed, setSchoolsFailed] = useState(false)
  useEffect(() => {
    if (!IS_MAIN_SITE) return
    fetchPublicTenants()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const options = list.map((opt) => ({ value: opt.tenantId, label: opt.name }))
          setSchools(options)
          // 默认选中第一项（最常见登录路径）；列表回来前用户无从选择，直接 set 安全
          form.setFieldsValue({ school: options[0].value })
          setSchoolsFailed(false)
        }
      })
      .catch((err) => {
        // 后端返回为主：失败不伪造兜底数据，明示失败等用户刷新重试
        setSchoolsFailed(true)
        console.warn('[Login] /api/tenants/public 拉取失败', err)
      })
  }, [form])

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
    // 主域选择器为空（列表未返回/加载失败）时拦截：不提交空 tenantId
    if (IS_MAIN_SITE && !school) {
      message.warning(t('login.form.schoolLoadFailed'))
      return
    }
    runLogin({
      roleId: 'student',
      loginType: 'account',
      // 主域由选择器提交；子域显式带站点 tenantId（接口形态一致，不依赖后端按 header 猜）
      tenantId: IS_MAIN_SITE ? school : resolveTenantId(),
      userId,
      password,
    })
  }

  // 切换学校：清空账号/密码 + 提示（不同学校账号体系隔离，留着会误导）
  const handleSchoolChange = () => {
    form.setFieldsValue({ userId: '', password: '' })
    message.info('已切换学校，请重新输入账号')
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
      {/* 学校选择器：仅主域（default 站）显示；子域/私有化租户由站点注入，隐藏 */}
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
            options={schools}
            loading={IS_MAIN_SITE && schools.length === 0 && !schoolsFailed}
            notFoundContent={t('login.form.schoolLoadFailed')}
            onChange={handleSchoolChange}
          />
        </Form.Item>
      )}

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
