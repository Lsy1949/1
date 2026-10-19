import type { LoginParams, LoginResult, UserInfo } from '../modules/types'

/**
 * 认证 mock 实现（Q1 决策：VITE_USE_MOCK_LOGIN=true 时启用）。
 * 逻辑复刻旧 stores/auth.js 的 mock 行为（跳过 API 校验直接发 token），
 * 保证开发期登录链路在新旧两套 store 间行为一致。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(params: LoginParams): Promise<LoginResult> {
  await delay(300) // 模拟网络延迟

  const token = `mock-token-${Date.now()}`
  const userInfo: UserInfo = {
    name: params.userId || params.phone || params.email || '测试用户',
    roleId: params.roleId,
    userId: params.userId || '',
    school: params.school || '',
  }

  return { token, userInfo, roleId: params.roleId, message: '登录成功' }
}

export async function mockRegister(data: Record<string, unknown>): Promise<{ message: string }> {
  await delay(300)
  void data
  return { message: '注册成功' }
}

export async function mockForgotPassword(data: Record<string, unknown>): Promise<{ message: string }> {
  await delay(300)
  void data
  return { message: '密码重置成功' }
}
