import type { useI18n } from '@/i18n'

type TFunc = ReturnType<typeof useI18n>['t']

/**
 * 认证流程稳定错误码 → i18n 文案（契约 §1.4-1.6：mock/后端下发错误码，
 * 前端统一映射；未识别错误显示原始 message）。
 */
export function authErrorMessage(t: TFunc, err: unknown): string {
  const code = err instanceof Error ? err.message : ''
  const map: Record<string, string> = {
    INVALID_EMAIL: t('login.errors.invalidEmail'),
    EMAIL_TAKEN: t('login.errors.emailTaken'),
    USERNAME_TAKEN: t('login.errors.usernameTaken'),
    USER_NOT_FOUND: t('login.errors.userNotFound'),
    EMAIL_MISMATCH: t('login.errors.emailMismatch'),
    CODE_TOO_FREQUENT: t('login.errors.codeTooFrequent'),
    CODE_EXPIRED: t('login.errors.codeExpired'),
    CODE_INVALID: t('login.errors.codeInvalid'),
    CODE_LOCKED: t('login.errors.codeLocked'),
    VERIFY_TOKEN_INVALID: t('login.errors.verifyTokenInvalid'),
  }
  if (map[code]) return map[code]
  return err instanceof Error ? err.message : String(err)
}
