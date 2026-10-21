/**
 * 【business】RegisterForm —— 注册表单组件
 * - 源码语义：先整表校验再提交 → AntD Form onFinish（失败自动在表单项下展示错误）
 * - loading / 成功提示 / 回登录页由 useRegister 托管
 * - 验证码行封装为受控子组件 CaptchaField（等价「输入框 + canvas」整行绑定）
 */
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { App as AntApp, Button, Form, Input, Select } from 'antd'
import {
  ArrowLeftOutlined,
  BankOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useRegister } from '@/features/auth/hooks/useAuth'
import { useI18n } from '@/i18n'
import styles from './RegisterForm.module.css'

interface RegisterFormProps {
  /** 注册成功后返回登录 */
  onSwitchToLogin?: () => void
}

// 注册表单数据
interface RegisterFormState {
  school: string
  userId: string
  password: string
  confirmPassword: string
  captcha: string
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

const initialValues: Partial<RegisterFormState> = {
  school: '',
  userId: '',
  password: '',
  confirmPassword: '',
  captcha: '',
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

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [form] = Form.useForm<RegisterFormState>()

  // 验证码 Canvas 引用
  const captchaCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // 验证码文本（非渲染态，用 ref 供 rules 闭包读取）
  const captchaTextRef = useRef('')

  // 确认密码一致性校验
  const validateConfirmPassword = useMemo(
    () =>
      (_rule: unknown, value: string | undefined): Promise<void> => {
        if (value !== form.getFieldValue('password')) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
    [form],
  )

  // 验证码校验器
  const validateCaptcha = useMemo(
    () =>
      (_rule: unknown, value: string | undefined): Promise<void> => {
        const v = value ?? ''
        if (v.toLowerCase() !== captchaTextRef.current.toLowerCase()) {
          return Promise.reject(new Error('验证码错误'))
        }
        return Promise.resolve()
      },
    [],
  )

  // 生成验证码（画布逻辑逐字平移）
  const generateCaptcha = () => {
    const canvas = captchaCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 生成随机验证码文本
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let text = ''
    for (let i = 0; i < 4; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    captchaTextRef.current = text

    // 绘制验证码
    ctx.font = '20px Arial'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // 绘制字符
    for (let i = 0; i < text.length; i++) {
      ctx.fillStyle = `rgb(${Math.floor(Math.random() * 155 + 100)}, ${Math.floor(
        Math.random() * 155 + 100,
      )}, ${Math.floor(Math.random() * 155 + 100)})`
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillText(text[i], 20 + i * 20, 20)
    }

    // 绘制干扰线
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

  // 注册提交：loading / 成功提示 / 回登录页均由 useRegister 托管
  const { run: runRegister, loading: registerLoading } = useRegister({
    onSuccess: (result) => {
      message.success(result.message)
      // 注册成功后返回登录页面
      onSwitchToLogin?.()
    },
    onError: (error) => {
      message.error(error.message || '注册失败')
    },
  })

  // 等价源码：await validate() 通过后再提交（AntD onFinish 自带整表校验）
  const handleFinish = (values: RegisterFormState) => {
    runRegister({ ...values })
  }

  // 组件挂载时生成验证码
  useEffect(() => {
    generateCaptcha()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Form
      form={form}
      className="register-form-content"
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <Form.Item
        name="school"
        validateTrigger="onChange"
        rules={[{ required: true, message: '请选择学校', validateTrigger: 'onChange' }]}
      >
        <Select
          placeholder="请选择学校"
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
          { required: true, message: '请输入学号', validateTrigger: 'onBlur' },
          { min: 1, max: 20, message: '学号长度为1-20个字符', validateTrigger: 'onBlur' },
        ]}
      >
        <Input placeholder="请输入学号" prefix={<UserOutlined />} size="large" allowClear />
      </Form.Item>

      <Form.Item
        name="password"
        validateTrigger="onBlur"
        rules={[
          { required: true, message: '请输入密码', validateTrigger: 'onBlur' },
          { min: 6, max: 20, message: '密码长度为6-20个字符', validateTrigger: 'onBlur' },
          {
            pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
            message: '密码至少包含一个字母和一个数字',
            validateTrigger: 'onBlur',
          },
        ]}
      >
        <Input.Password placeholder="请输入密码" prefix={<LockOutlined />} size="large" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        validateTrigger="onBlur"
        rules={[
          { required: true, message: '请再次输入密码', validateTrigger: 'onBlur' },
          { validator: validateConfirmPassword, validateTrigger: 'onBlur' },
        ]}
      >
        <Input.Password placeholder="请再次输入密码" prefix={<LockOutlined />} size="large" />
      </Form.Item>

      <Form.Item
        name="captcha"
        className={styles.captchaFormItem}
        validateTrigger="onBlur"
        rules={[
          { required: true, message: '请输入验证码', validateTrigger: 'onBlur' },
          { min: 4, max: 4, message: '验证码为4位字符', validateTrigger: 'onBlur' },
          { validator: validateCaptcha, validateTrigger: 'onBlur' },
        ]}
      >
        <CaptchaField
          placeholder="请输入验证码"
          canvasRef={captchaCanvasRef}
          onRefresh={generateCaptcha}
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          size="large"
          block
          shape="round"
          className={styles.registerButton}
          htmlType="submit"
          loading={registerLoading}
          icon={<UserOutlined />}
        >
          注册账号
        </Button>
      </Form.Item>

      <Form.Item className={styles.backToLogin}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => onSwitchToLogin?.()}
        >
          返回登录
        </Button>
      </Form.Item>
    </Form>
  )
}

export default RegisterForm
