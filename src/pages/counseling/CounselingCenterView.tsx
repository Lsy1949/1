/**
 * 【business】CounselingCenterView —— 心理咨询中心主页
 * - 页面层拉取 `GET /api/counseling/info`，统一处理 Skeleton / Error 三态；
 * - 数据经 props 下发给四个 Panel；预约提交由本页 useMutation 管理；
 * - route.query.tab → useSearchParams 读写（tabQueryMap 映射，未知/缺省回退 booking）
 * - el-tab-pane 默认立即渲染 → antd Tabs items 全部 forceRender: true
 *   （保证 consultants 页点「预约」时 bookingPanelRef 已挂载，prefill 可直接调用）
 */
import { useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ConfigProvider, Result, Skeleton, Tabs } from 'antd'
import { ArrowRightOutlined, MessageOutlined } from '@ant-design/icons'
import ModuleCover from '@/components/ModuleCover'
import { AssistantFab } from '@/features/ai'
import {
  BookingPanel,
  ConsultantsPanel,
  FaqPanel,
  NoticePanel,
} from '@/features/counseling'
import type { BookingPanelHandle } from '@/features/counseling'
import { useI18n } from '@/i18n'
import {
  useCancelBooking,
  useCounselingInfo,
  useCreateBooking,
  useMyBookings,
} from './counselingQuery'
import './CounselingCenterView.css'

const TAB_QUERY_MAP: Record<string, string> = {
  booking: 'booking',
  consultants: 'consultants',
  notice: 'notice',
  faq: 'faq',
}

/**
 * counseling 作用域组件 token：
 * 页签「极简文字」外观（原 CounselingCenterView.css 的 .ant-tabs-* 覆写）
 * 收敛为嵌套 ConfigProvider 官方注入，仅作用于本页。
 * booking/faq 表单「科技蓝输入框」外观已统一由 src/main.tsx 的全局 Input token
 * 提供，本页只保留更紧凑的形态差异（paddingInline 14）。
 */
const counselingThemeComponents = {
  Tabs: {
    titleFontSize: 14,
    itemColor: 'var(--text-faint)',
    itemHoverColor: 'var(--text-heading)',
    itemSelectedColor: 'var(--text-heading)',
    horizontalItemPadding: '0 0 14px',
    horizontalItemGutter: 32,
    horizontalMargin: '0 0 40px 0',
    inkBarColor: 'var(--text-heading)',
  },
  Input: {
    borderRadius: 10,
    colorText: 'var(--text-regular)',
    paddingInline: 14,
  },
}

export function CounselingCenterView() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 只读数据：类型 / 专长 / 老师 / FAQ 一次拉取
  const { data: info, isPending, isError, refetch } = useCounselingInfo()

  // 我的预约：完全由 React Query 管理
  const {
    data: bookings = [],
    isPending: bookingsPending,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useMyBookings()

  const createBooking = useCreateBooking()
  const cancelBooking = useCancelBooking()

  const counselors = info?.counselors ?? []
  const consultationTypes = info?.consultationTypes ?? []
  const specialties = info?.specialties ?? []
  const faqs = info?.faqs ?? []

  // URL ?tab= → 页签（映射表收窄合法值，未知/缺省回退 booking）
  const activeTab = TAB_QUERY_MAP[searchParams.get('tab') ?? ''] ?? 'booking'

  function switchTab(key: string) {
    // AI 伴侣为独立对话子页：点击页签即跳转（其余页签为页内面板，写回 URL 供刷新/分享保持）
    if (key === 'companion') {
      void navigate('/counseling/companion')
      return
    }
    setSearchParams(key === 'booking' ? {} : { tab: key }, { replace: true })
  }

  // 跨 tab 预约：预填表单 → 切到预约页签
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
          <BookingPanel
            ref={bookingPanelRef}
            consultationTypes={consultationTypes}
            counselors={counselors}
            bookings={bookings}
            bookingsLoading={bookingsPending}
            bookingsError={bookingsError}
            onReloadBookings={() => void refetchBookings()}
            onCancelBooking={cancelBooking.mutate}
            onGoNotice={() => switchTab('notice')}
            onSubmit={(values) => createBooking.mutateAsync(values)}
            isSubmitting={createBooking.isPending}
          />
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
          <ConsultantsPanel
            counselors={counselors}
            specialties={specialties}
            onBook={goBookWith}
          />
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
          <FaqPanel faqs={faqs} onBook={() => switchTab('booking')} />
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

        {isPending ? (
          <div className="counseling-state">
            <Skeleton active title={{ width: '42%' }} paragraph={{ rows: 3 }} />
            <Skeleton active title={false} paragraph={{ rows: 6 }} />
          </div>
        ) : isError ? (
          <div className="counseling-state">
            <Result
              status="error"
              title={t('common.loadFailed')}
              extra={
                <Button type="primary" onClick={() => void refetch()}>
                  {t('common.retry')}
                </Button>
              }
            />
          </div>
        ) : (
          <Tabs
            className="main-tabs"
            activeKey={activeTab}
            onChange={switchTab}
            items={items}
          />
        )}

        {/* AI 客服（悬浮窗） */}
        <AssistantFab />
      </div>
    </ConfigProvider>
  )
}

export default CounselingCenterView
