/**
 * 【business】CounselingCenterView —— 心理咨询中心主页
 * - AI 咨询师入口按钮 + Tabs 页内面板（booking/consultants/notice/faq）+ AI 伴侣跳转页签 + 悬浮客服
 * - route.query.tab → useSearchParams 读写（tabQueryMap 映射，未知/缺省回退 booking）
 * - el-tab-pane 默认立即渲染 → antd Tabs items 全部 forceRender: true
 *   （保证 consultants 页点「预约」时 bookingPanelRef 已挂载，prefill 可直接调用）
 */
import { useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConfigProvider, Tabs } from 'antd'
import { ArrowRightOutlined, MessageOutlined } from '@ant-design/icons'
import ModuleCover from '@/components/ModuleCover'
import { AssistantFab } from '@/features/ai'
import {
  BookingPanel,
  ConsultantsPanel,
  FaqPanel,
  NoticePanel,
  counselors,
} from '@/features/counseling'
import type { BookingPanelHandle } from '@/features/counseling'
import { useI18n } from '@/i18n'
import './CounselingCenterView.css'

const TAB_QUERY_MAP: Record<string, string> = {
  booking: 'booking',
  consultants: 'consultants',
  notice: 'notice',
  faq: 'faq',
}

/**
 * counseling 作用域组件 token：
 * 页签「极简文字」外观（原 CounselingCenterView.css 的 .ant-tabs-* 覆写）与
 * booking/faq 表单「科技蓝输入框」外观（原 BookingPanel.module.css /
 * FaqPanel.module.css 的 .ant-input* 覆写）收敛为嵌套 ConfigProvider
 * 官方注入，仅作用于本页。字重/字距/过渡、faq 搜索框 12px 圆角（与 booking
 * 的 10px 不同）等差异项仍保留在组件 css。
 */
const counselingThemeComponents = {
  Tabs: {
    titleFontSize: 14,
    itemColor: 'var(--ink-400)',
    itemHoverColor: 'var(--navy-950)',
    itemSelectedColor: 'var(--navy-950)',
    horizontalItemPadding: '0 0 14px',
    horizontalItemGutter: 32,
    horizontalMargin: '0 0 40px 0',
    inkBarColor: 'var(--navy-950)',
  },
  Input: {
    borderRadius: 10,
    colorBgContainer: 'var(--slate-50)',
    colorBorder: 'var(--slate-200)',
    colorText: 'var(--ink-800)',
    paddingInline: 14,
    paddingBlock: 8,
    hoverBorderColor: 'var(--brand-primary)',
    hoverBg: '#ffffff',
    activeBorderColor: 'var(--brand-primary)',
    activeBg: '#ffffff',
    activeShadow: '0 0 0 3px color-mix(in srgb, var(--brand-primary) 10%, transparent)',
    motionDurationMid: '0.25s',
  },
}

export function CounselingCenterView() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL ?tab= → 页签（映射表收窄合法值，未知/缺省回退 booking，等价 Vue watch route.query.tab）
  const activeTab = TAB_QUERY_MAP[searchParams.get('tab') ?? ''] ?? 'booking'

  function switchTab(key: string) {
    // AI 伴侣为独立对话子页：点击页签即跳转（其余页签为页内面板，写回 URL 供刷新/分享保持）
    if (key === 'companion') {
      void navigate('/counseling/companion')
      return
    }
    setSearchParams(key === 'booking' ? {} : { tab: key }, { replace: true })
  }

  // 跨 tab 预约：预填表单 → 切到预约页签（等价 Vue bookingPanelRef.prefill + activeTab 赋值）
  const bookingPanelRef = useRef<BookingPanelHandle | null>(null)
  function goBookWith(id: number | undefined) {
    if (id === undefined) return
    bookingPanelRef.current?.prefill(id)
    switchTab('booking')
  }

  const items = [
    {
      key: 'booking',
      label: t('counseling.tabs.booking'),
      forceRender: true,
      children: (
        <>
          <ModuleCover
            eyebrow={t('counseling.cover.booking.eyebrow')}
            no="No.01"
            title={t('counseling.cover.booking.title')}
            desc={t('counseling.cover.booking.desc')}
          />
          <BookingPanel ref={bookingPanelRef} onGoNotice={() => switchTab('notice')} />
        </>
      ),
    },
    {
      key: 'consultants',
      label: t('counseling.tabs.counselors'),
      forceRender: true,
      children: (
        <>
          <ModuleCover
            eyebrow={t('counseling.cover.counselors.eyebrow')}
            no="No.02"
            title={t('counseling.cover.counselors.title')}
            desc={
              counselors.length + t('counseling.counselors.count') + t('counseling.cover.counselors.desc')
            }
          />
          <ConsultantsPanel onBook={goBookWith} />
        </>
      ),
    },
    {
      key: 'notice',
      label: t('counseling.tabs.notice'),
      forceRender: true,
      children: (
        <>
          <ModuleCover
            eyebrow={t('counseling.cover.notice.eyebrow')}
            no="No.03"
            title={t('counseling.cover.notice.title')}
            desc={t('counseling.cover.notice.desc')}
          />
          <NoticePanel />
        </>
      ),
    },
    {
      key: 'faq',
      label: t('counseling.tabs.faq'),
      forceRender: true,
      children: (
        <>
          <ModuleCover
            eyebrow={t('counseling.cover.faq.eyebrow')}
            no="No.04"
            title={t('counseling.cover.faq.title')}
            desc={t('counseling.cover.faq.desc')}
          />
          <FaqPanel onBook={() => switchTab('booking')} />
        </>
      ),
    },
    // AI 伴侣：仅页签（点击跳转独立子页，无页内内容）
    { key: 'companion', label: t('counseling.tabs.companion'), children: undefined },
  ]

  return (
    <ConfigProvider theme={{ components: counselingThemeComponents }}>
      <div className="counseling-page">
      {/* AI 咨询师入口 */}
      <button
        type="button"
        className="ai-consult-entry"
        onClick={() => navigate('/counseling/ai-chat')}
      >
        <span className="entry-icon">
          <MessageOutlined />
        </span>
        <span className="entry-text">
          <strong>{t('counseling.aiChat.entryTitle')}</strong>
          <small>{t('counseling.aiChat.entryDesc')}</small>
        </span>
        <ArrowRightOutlined className="entry-arrow" />
      </button>

      {/* 主体功能区 */}
      <Tabs
        className="main-tabs"
        activeKey={activeTab}
        onChange={switchTab}
        items={items}
      />

      {/* AI 客服（悬浮窗） */}
      <AssistantFab />
      </div>
    </ConfigProvider>
  )
}

export default CounselingCenterView
