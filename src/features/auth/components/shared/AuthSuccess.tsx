/**
 * 【shared】AuthSuccess —— 注册 / 重置密码成功视图
 * - 大厂通用模式：成功态 + 倒计时自动返回登录（countdown 到 0 由父级触发跳转）
 * - 纯展示组件：文案 / 跳转动作由父级传入
 */
import { Button, Flex, Typography } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { I18nKey } from '@/i18n/dataHelper'
import styles from './AuthSuccess.module.css'

interface AuthSuccessProps {
  /** 结果标题 i18n key */
  titleKey: I18nKey
  /** 结果描述 i18n key */
  descKey: I18nKey
  /** 剩余秒数（0 时父级负责跳转，本组件不再渲染倒计时行） */
  countdown: number
  /** 立即返回登录 */
  onBackToLogin: () => void
}

export function AuthSuccess({ titleKey, descKey, countdown, onBackToLogin }: AuthSuccessProps) {
  const { t } = useTranslation()
  return (
    <Flex vertical align="center" gap={4} className={styles.wrapper}>
      <CheckCircleFilled className={styles.icon} aria-hidden="true" />
      <Typography.Title level={4} className={styles.title}>
        {t(titleKey)}
      </Typography.Title>
      <Typography.Text type="secondary" className={styles.desc}>
        {t(descKey)}
      </Typography.Text>
      <Button type="primary" size="large" block className={styles.button} onClick={onBackToLogin}>
        {t('login.common.backToLoginNow')}
      </Button>
      {countdown > 0 && (
        <Typography.Text type="secondary" className={styles.autoBack}>
          {t('login.common.autoBack', { n: countdown })}
        </Typography.Text>
      )}
    </Flex>
  )
}

export default AuthSuccess
