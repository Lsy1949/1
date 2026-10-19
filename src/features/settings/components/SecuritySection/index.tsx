// 01 · 账号安全：密码修改 / 绑定联系方式 / 登录设备 + 三步换绑弹窗
import { useEffect, useMemo, useRef, useState } from 'react'
import { App as AntApp, Form, Input, Modal } from 'antd'
import { ExclamationCircleFilled, LockOutlined, MailOutlined, MobileOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './SecuritySection.module.css'

/* ===== 登录设备 ===== */
interface DeviceItem {
  id: number
  name: string
  current: boolean
  ip: string
  browser: string
  lastLogin: string
}

interface ContactDialogState {
  visible: boolean
  type: 'phone' | 'email'
  step: number
  currentCode: string
  newValue: string
  newCode: string
  countdown: number
}

const INITIAL_DEVICES: DeviceItem[] = [
  {
    id: 1,
    name: 'Windows · Chrome',
    current: true,
    ip: '192.168.1.108',
    browser: 'Chrome 121 / Windows 11',
    lastLogin: '2026-07-02 14:32'
  },
  {
    id: 2,
    name: 'iPhone · Safari',
    current: false,
    ip: '117.136.12.45',
    browser: 'Safari / iOS 17.2',
    lastLogin: '2026-06-30 09:15'
  },
  {
    id: 3,
    name: 'iPad · Safari',
    current: false,
    ip: '114.114.21.8',
    browser: 'Safari / iPadOS 17.1',
    lastLogin: '2026-06-20 20:48'
  }
]

export function SecuritySection() {
  const { t } = useI18n()
  const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox

  /* ===== 密码 ===== */
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' })

  function updatePassword() {
    if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
      message.warning(t('settings.card.security.fillRequired'))
      return
    }
    if (pwdForm.new !== pwdForm.confirm) {
      message.error(t('settings.card.security.passwordMismatch'))
      return
    }
    message.success(t('settings.card.security.passwordChanged'))
    setPwdForm({ old: '', new: '', confirm: '' })
  }

  /* ===== 联系方式 ===== */
  const [phone, setPhone] = useState('138****8888')
  const [email, setEmail] = useState('ex****@example.com')
  const maskedPhone = phone
  const maskedEmail = email

  const [contactDialog, setContactDialog] = useState<ContactDialogState>({
    visible: false,
    type: 'phone',
    step: 1,
    currentCode: '',
    newValue: '',
    newCode: '',
    countdown: 0
  })

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentTypeLabel = useMemo(
    () =>
      contactDialog.type === 'phone'
        ? t('settings.card.security.dialog.typePhone')
        : t('settings.card.security.dialog.typeEmail'),
    [contactDialog.type, t]
  )

  const stepLabels = useMemo(
    () => [
      t('settings.card.security.dialog.step1'),
      t('settings.card.security.dialog.step2', { type: currentTypeLabel }),
      t('settings.card.security.dialog.step3', { type: currentTypeLabel })
    ],
    [t, currentTypeLabel]
  )

  function stopCountdown() {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
    setContactDialog((prev) => (prev.countdown === 0 ? prev : { ...prev, countdown: 0 }))
  }

  function startCountdown() {
    stopCountdown()
    setContactDialog((prev) => ({ ...prev, countdown: 60 }))
    countdownTimer.current = setInterval(() => {
      setContactDialog((prev) => {
        if (prev.countdown <= 1) {
          if (countdownTimer.current) {
            clearInterval(countdownTimer.current)
            countdownTimer.current = null
          }
          return { ...prev, countdown: 0 }
        }
        return { ...prev, countdown: prev.countdown - 1 }
      })
    }, 1000)
  }

  // 等价 Vue 的 onBeforeUnmount(() => stopCountdown())
  useEffect(
    () => () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current)
        countdownTimer.current = null
      }
    },
    []
  )

  function openContactDialog(type: 'phone' | 'email') {
    setContactDialog({
      visible: true,
      type,
      step: 1,
      currentCode: '',
      newValue: '',
      newCode: '',
      countdown: 0
    })
    stopCountdown()
  }

  function closeContactDialog() {
    setContactDialog((prev) => ({ ...prev, visible: false }))
    stopCountdown()
  }

  function sendCode(target: 'current' | 'new') {
    startCountdown()
    const key = target === 'current' ? 'verifyCodeSent' : 'newCodeSent'
    message.success(t(`settings.card.security.dialog.${key}`, { type: currentTypeLabel }))
  }

  function validateContact(value: string, type: 'phone' | 'email') {
    if (type === 'phone') {
      return /^1[3-9]\d{9}$/.test(value)
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function nextStep() {
    if (contactDialog.step === 1) {
      if (!/^\d{6}$/.test(contactDialog.currentCode)) {
        message.error(t('settings.card.security.dialog.codeError'))
        return
      }
      setContactDialog((prev) => ({ ...prev, step: 2 }))
      stopCountdown()
    } else if (contactDialog.step === 2) {
      if (!validateContact(contactDialog.newValue, contactDialog.type)) {
        message.error(
          contactDialog.type === 'phone'
            ? t('settings.card.security.dialog.phoneFormat')
            : t('settings.card.security.dialog.emailFormat')
        )
        return
      }
      setContactDialog((prev) => ({ ...prev, step: 3 }))
      stopCountdown()
    }
  }

  function submitContactDialog() {
    if (!/^\d{6}$/.test(contactDialog.newCode)) {
      message.error(t('settings.card.security.dialog.codeError'))
      return
    }
    const v = contactDialog.newValue
    if (contactDialog.type === 'phone') {
      setPhone(v.slice(0, 3) + '****' + v.slice(-4))
    } else {
      const [name, domain] = v.split('@')
      setEmail(name.slice(0, 2) + '****@' + domain)
    }
    message.success(t('settings.card.security.dialog.success'))
    closeContactDialog()
  }

  /* ===== 登录设备 ===== */
  const [devices, setDevices] = useState<DeviceItem[]>(INITIAL_DEVICES)

  function revokeDevice(device: DeviceItem) {
    modal.confirm({
      title: t('settings.card.security.deviceRevokeTitle'),
      content: t('settings.card.security.deviceRevokeConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      icon: <ExclamationCircleFilled />,
      onOk() {
        setDevices((prev) => prev.filter((d) => d.id !== device.id))
        message.success(t('settings.card.security.deviceRevoked'))
      }
    })
  }

  return (
    <section id="sec-security" className={styles.editorialSection}>
      <div className={styles.sectionMarker}>
        <span className={styles.markerNum}>01</span>
        <span className={styles.markerRule}></span>
        <LockOutlined className={styles.markerIcon} />
        <span className={styles.markerLabel}>{t('settings.card.security.title')}</span>
      </div>
      <div className={styles.sectionHeadlineRow}>
        <h2 className={styles.sectionHeadline}>{t('settings.card.security.title')}</h2>
        <p className={styles.sectionDeck}>{t('settings.card.security.desc')}</p>
      </div>

      <div className={`${styles.editorialGrid} ${styles.twoCol}`}>
        {/* Column 1 · Password */}
        <div className={styles.editorialCol}>
          <h3 className={styles.colTitle}>{t('settings.card.security.changePassword')}</h3>
          <Form layout="vertical" colon={false} className={styles.pwdForm}>
            <div className={styles.fieldStack}>
              <Form.Item label={t('settings.card.security.oldPassword')}>
                <Input.Password
                  value={pwdForm.old}
                  onChange={(e) => setPwdForm((prev) => ({ ...prev, old: e.target.value }))}
                />
              </Form.Item>
              <Form.Item label={t('settings.card.security.newPassword')}>
                <Input.Password
                  value={pwdForm.new}
                  onChange={(e) => setPwdForm((prev) => ({ ...prev, new: e.target.value }))}
                />
              </Form.Item>
              <Form.Item label={t('settings.card.security.confirmPassword')}>
                <Input.Password
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm((prev) => ({ ...prev, confirm: e.target.value }))}
                />
              </Form.Item>
            </div>
          </Form>
          <div className={styles.fieldActions}>
            <button className={styles.editorialBtn} onClick={updatePassword}>
              {t('settings.card.security.updatePassword')}
            </button>
          </div>
        </div>

        {/* Column 2 · Contacts + Devices */}
        <div className={styles.editorialCol}>
          <h3 className={styles.colTitle}>{t('settings.card.security.boundAccounts')}</h3>
          <ul className={styles.entryList}>
            <li className={styles.entryRow}>
              <span className={styles.entryMark}><MobileOutlined /></span>
              <div className={styles.entryText}>
                <span className={styles.entryKey}>{t('settings.card.security.phone')}</span>
                <span className={styles.entryValue}>{maskedPhone}</span>
              </div>
              <button className={styles.linkBtn} onClick={() => openContactDialog('phone')}>
                {t('settings.card.security.modify')}
              </button>
            </li>
            <li className={styles.entryRow}>
              <span className={styles.entryMark}><MailOutlined /></span>
              <div className={styles.entryText}>
                <span className={styles.entryKey}>{t('settings.card.security.email')}</span>
                <span className={styles.entryValue}>{maskedEmail}</span>
              </div>
              <button className={styles.linkBtn} onClick={() => openContactDialog('email')}>
                {t('settings.card.security.modify')}
              </button>
            </li>
          </ul>

          <h3 className={`${styles.colTitle} ${styles.colTitleSpaced}`}>{t('settings.card.security.loginDevices')}</h3>
          <ul className={styles.deviceList}>
            {devices.map((device) => (
              <li key={device.id} className={`${styles.deviceRow}${device.current ? ` ${styles.current}` : ''}`}>
                <div className={styles.deviceHead}>
                  <span className={styles.deviceName}>{device.name}</span>
                  {device.current && (
                    <span className={styles.deviceTag}>{t('settings.card.security.currentDevice')}</span>
                  )}
                </div>
                <dl className={styles.deviceMeta}>
                  <div className={styles.metaItem}>
                    <dt>{t('settings.card.security.deviceIp')}</dt>
                    <dd>{device.ip}</dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt>{t('settings.card.security.deviceBrowser')}</dt>
                    <dd>{device.browser}</dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt>{t('settings.card.security.lastLogin')}</dt>
                    <dd>{device.lastLogin}</dd>
                  </div>
                </dl>
                {!device.current && (
                  <button className={`${styles.linkBtn} ${styles.linkBtnDanger}`} onClick={() => revokeDevice(device)}>
                    {t('settings.card.security.revokeDevice')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 三步换绑弹窗（原 contact-dialog 与 ant-modal-xx 结构覆写已 token 化为 Modal styles props） */}
      <Modal
        open={contactDialog.visible}
        onCancel={closeContactDialog}
        title={
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--ink-900)',
            }}
          >
            {contactDialog.type === 'phone'
              ? t('settings.card.security.dialog.modifyPhone')
              : t('settings.card.security.dialog.modifyEmail')}
          </span>
        }
        width={520}
        centered
        maskClosable={false}
        className={styles.contactDialog}
        styles={{
          content: { borderRadius: 0, border: '1px solid var(--ink-900)', padding: 0 },
          header: {
            margin: 0,
            padding: '20px 24px',
            borderBottom: '1px solid var(--ink-200)',
            background: 'transparent',
          },
          body: { padding: 24 },
          footer: {
            margin: 0,
            padding: '16px 24px 20px',
            borderTop: '1px solid var(--ink-200)',
          },
          /* 当前 antd 5.29（rc-dialog 9.6）ModalStyles 不含 close 键，
             关闭按钮定位退回 CSS 覆写（antd 6 起可迁入 styles.close） */
        }}
        footer={
          <div className={styles.dialogFooter}>
            <button className={`${styles.editorialBtn} ${styles.editorialBtnGhost}`} onClick={closeContactDialog}>
              {t('common.cancel')}
            </button>
            {contactDialog.step > 1 && (
              <button
                className={`${styles.editorialBtn} ${styles.editorialBtnGhost}`}
                onClick={() => setContactDialog((prev) => ({ ...prev, step: prev.step - 1 }))}
              >
                {t('settings.card.security.dialog.prev')}
              </button>
            )}
            {contactDialog.step < 3 ? (
              <button className={styles.editorialBtn} onClick={nextStep}>
                {t('settings.card.security.dialog.next')}
              </button>
            ) : (
              <button className={styles.editorialBtn} onClick={submitContactDialog}>
                {t('settings.card.security.dialog.submit')}
              </button>
            )}
          </div>
        }
      >
        {/* 步骤指示 */}
        <div className={styles.dialogSteps}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`${styles.dsItem}${contactDialog.step >= n ? ` ${styles.active}` : ''}${contactDialog.step === n ? ` ${styles.current}` : ''}`}
            >
              <span className={styles.dsNum}>{n}</span>
              <span className={styles.dsLabel}>{stepLabels[n - 1]}</span>
            </div>
          ))}
        </div>

        {/* Step 1 · 身份验证 */}
        {contactDialog.step === 1 && (
          <div className={styles.dialogBody}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                {t('settings.card.security.dialog.sendCodeToCurrent', { type: currentTypeLabel })}
              </label>
              <div className={styles.codeRow}>
                <Input
                  value={contactDialog.currentCode}
                  placeholder={t('settings.card.security.dialog.codePlaceholder')}
                  onChange={(e) =>
                    setContactDialog((prev) => ({ ...prev, currentCode: e.target.value }))
                  }
                />
                <button
                  className={styles.sendBtn}
                  disabled={contactDialog.countdown > 0}
                  onClick={() => sendCode('current')}
                >
                  {contactDialog.countdown > 0
                    ? t('settings.card.security.dialog.resendIn', { n: contactDialog.countdown })
                    : t('settings.card.security.dialog.getCode')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 · 新联系方式 */}
        {contactDialog.step === 2 && (
          <div className={styles.dialogBody}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                {t('settings.card.security.dialog.newValueLabel', { type: currentTypeLabel })}
              </label>
              <Input
                value={contactDialog.newValue}
                placeholder={t('settings.card.security.dialog.newValuePlaceholder', { type: currentTypeLabel })}
                onChange={(e) =>
                  setContactDialog((prev) => ({ ...prev, newValue: e.target.value }))
                }
              />
            </div>
          </div>
        )}

        {/* Step 3 · 验证新联系方式 */}
        {contactDialog.step === 3 && (
          <div className={styles.dialogBody}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>{currentTypeLabel}</span>
              <strong className={styles.summaryValue}>{contactDialog.newValue}</strong>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                {t('settings.card.security.dialog.sendCodeToNew', { type: currentTypeLabel })}
              </label>
              <div className={styles.codeRow}>
                <Input
                  value={contactDialog.newCode}
                  placeholder={t('settings.card.security.dialog.codePlaceholder')}
                  onChange={(e) =>
                    setContactDialog((prev) => ({ ...prev, newCode: e.target.value }))
                  }
                  style={{ flex: 1 }}
                />
                <button
                  className={styles.sendBtn}
                  disabled={contactDialog.countdown > 0 || !contactDialog.newValue}
                  onClick={() => sendCode('new')}
                >
                  {contactDialog.countdown > 0
                    ? t('settings.card.security.dialog.resendIn', { n: contactDialog.countdown })
                    : t('settings.card.security.dialog.getCode')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default SecuritySection
