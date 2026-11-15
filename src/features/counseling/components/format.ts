// 咨询模块展示格式化工具（纯函数，无副作用）

/** 联系方式脱敏展示：手机号 138****8888 / 邮箱 a***@x.com */
export function maskContact(value: string): string {
  if (!value) return value
  if (value.includes('@')) {
    const [user, domain] = value.split('@')
    return `${user.slice(0, 1)}***@${domain}`
  }
  return value.length >= 7 ? `${value.slice(0, 3)}****${value.slice(-4)}` : value
}
