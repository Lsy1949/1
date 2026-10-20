/**
 * 【business】ContactSection —— 联系我们区块（信息栏 + 留言表单）
 * - 表单校验/提交反馈完全内聚，无路由/store 依赖，无需对外回调
 * - 校验文案由 t() 驱动，语言切换实时更新
 * - 输入框外观由 src/main.tsx 全局 Input token 提供；本页差异仅在 .techForm 覆写 --input-bg
 */
import { App, Button, Col, Form, Input, Row } from 'antd'
import { MessageOutlined, PhoneOutlined, RightOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './ContactSection.module.css'

interface ContactFormValues {
  name: string
  email: string
  message: string
}

export function ContactSection() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const [form] = Form.useForm<ContactFormValues>()

  // 提交留言（校验失败由 AntD 在表单项下方自动显示错误信息）
  const submitContactForm = async () => {
    try {
      await form.validateFields()
      message.success(t('home.contact.submitSuccess'))
      form.resetFields()
    } catch {
      // 表单验证失败
    }
  }

  return (
    <section id="contact" className={styles.contactSection}>
      {/* container 为全局工具类（main.css），保持字面量 */}
      <div className="container">
        <div className={`${styles.contactWrapper} scroll-reveal`}>
          <div className={styles.contactInfo}>
            <div className={styles.contactBgShape}></div>
            <div className={styles.contactHeader}>
              <h2>{t('home.contact.title')}</h2>
              <p>{t('home.contact.desc')}</p>
            </div>
            <div className={styles.contactMethods}>
              <div className={styles.methodItem}>
                <div className={styles.methodIcon}><PhoneOutlined /></div>
                <div className={styles.methodText}>
                  <label>{t('home.contact.phone')}</label>
                  <span>400-123-4567</span>
                </div>
              </div>
              <div className={styles.methodItem}>
                <div className={styles.methodIcon}><MessageOutlined /></div>
                <div className={styles.methodText}>
                  <label>{t('home.contact.email')}</label>
                  <span>contact@shengyaxinlv.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.contactFormWrapper}>
            <h3>{t('home.contact.formTitle')}</h3>
            <Form form={form} layout="vertical" className={styles.techForm} validateTrigger="onBlur">
              <Row gutter={20}>
                <Col span={12} xs={24}>
                  <Form.Item
                    name="name"
                    label={t('home.contact.name')}
                    rules={[{ required: true, message: t('home.validation.nameRequired') }]}
                  >
                    <Input placeholder={t('home.contact.namePlaceholder')} />
                  </Form.Item>
                </Col>
                <Col span={12} xs={24}>
                  <Form.Item
                    name="email"
                    label={t('home.contact.emailLabel')}
                    rules={[
                      { required: true, message: t('home.validation.emailRequired') },
                      { type: 'email', message: t('home.validation.emailFormat') }
                    ]}
                  >
                    <Input placeholder={t('home.contact.emailPlaceholder')} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="message"
                label={t('home.contact.message')}
                rules={[{ required: true, message: t('home.validation.messageRequired') }]}
              >
                <Input.TextArea rows={4} placeholder={t('home.contact.messagePlaceholder')} />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  className={styles.submitBtn}
                  icon={<RightOutlined />}
                  iconPosition="end"
                  onClick={submitContactForm}
                >
                  {t('home.contact.submit')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
