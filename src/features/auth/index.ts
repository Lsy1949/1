/**
 * auth feature 对外出口：外部一律 import from '@/features/auth'。
 * 组件仅供 pages 层组合；hooks 为认证相关请求态与登出动作。
 */
export { LoginForm } from './components/LoginForm'
export { Propaganda } from './components/Propaganda'
export {
  fetchUserInfoById,
  logout,
  sendEmailCode,
  useAuthLogin,
  useForgotPassword,
  useRegister,
} from './hooks/useAuth'
