/**
 * 【business】AccountPasswordLogin —— 账号密码登录方式
 * - 提交前统一 validateFields（回车 / 按钮同一入口），rules 的 blur/change 仅做即时提示
 * - ElForm/ElInput/ElSelect → AntD Form/Input/Select；loading/成功写 store/
 *   实时通道均由 useAuthLogin 统一管理
 * - 验证码暂不上线（先跑通登录主流程）；后续恢复可参考 other/RegisterForm
 *   中现成的 CaptchaField 实现（输入框 + canvas 受控子树）
 */
import { useEffect } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntApp, Button, Checkbox, Form, Input, Select } from 'antd'
import { BankOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
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
  remember: boolean
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
  remember: false,
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
  // 保证第一项为 default 主站，前端不假设其内容）。
  // react-query：偶发失败（导航中断/网络抖动）自动重试兜住「选择器空白」，
  // 彻底失败后下拉内可点击重试，不再需要刷新整页
  const { data: schools, isPending: schoolsLoading, refetch: refetchSchools } = useQuery({
    queryKey: ['public-tenants'],
    queryFn: fetchPublicTenants,
    enabled: IS_MAIN_SITE,
    retry: 2,
    staleTime: 5 * 60_000,
    // 空列表同样归一为空 options（原逻辑：空列表视为失败态，走 notFound 重试）
    select: (list) =>
      Array.isArray(list) && list.length > 0
        ? list.map((opt) => ({ value: opt.tenantId, label: opt.name }))
        : [],
  })
  const schoolOptions = schools ?? []

  // 默认选中第一项（最常见登录路径）；仅当用户尚未选择时回填，不覆盖用户操作
  useEffect(() => {
    if (IS_MAIN_SITE && schoolOptions.length > 0 && !form.getFieldValue('school')) {
      form.setFieldsValue({ school: schoolOptions[0].value })
    }
  }, [schoolOptions, form])

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

  // 登录处理函数：提交前统一校验（validateFields 会校验全部字段，不受 validateTrigger 限制）
  const handleLogin = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return
    const { school, userId, password } = values
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

  // 等价 el-form 的 @keyup.enter
  const handleEnterKey = (e: ReactKeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') handleLogin()
  }

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
            options={schoolOptions}
            loading={IS_MAIN_SITE && schoolsLoading}
            notFoundContent={
              // 两种空态分开：选项列表为空 = 加载中 / 加载失败（可点击重试）；
              // 列表有数据时的空 = 搜索无匹配 → 不覆写，走 antd 默认文案
              // （ConfigProvider locale 已配 zhCN，显示「无匹配结果」）
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

      <Form.Item>
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
