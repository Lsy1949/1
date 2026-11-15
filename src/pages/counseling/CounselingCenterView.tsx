/**
 * 【business】CounselingCenterView —— 心理咨询中心主页
 * - 页面层拉取 `GET /api/counseling/info`，统一处理 Skeleton / Error 三态；
 * - 数据经 props 下发给五个 Panel；预约提交由本页 useMutation 管理；
 * - route.query.tab → useSearchParams 读写（tabQueryMap 映射，未知/缺省回退 booking）
 *
 * 桌面优先布局（移动端另行制作）：
 *   Hero（品牌主张 + 关键数据 + 主行动）
 *   └─ Workspace：左侧索引式导航（吸顶） + 右侧面板
 * 面板全部常驻挂载（hidden 切换）：保证 consultants 点「预约」时
 * bookingPanelRef 已存在，prefill 可直接调用；表单填写状态也不会因切页签丢失。
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, ConfigProvider, Result, Skeleton } from 'antd'
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CompassOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { AssistantFab } from '@/features/ai'
import {
  BookingPanel,
  ConsultantsPanel,
  FaqPanel,
  MinePanel,
  NoticePanel,
} from '@/features/counseling'
import type { BookingPanelHandle } from '@/features/counseling'
import { counselingApi } from '@/api'
import { useTranslation } from 'react-i18next'
import { useReveal } from '@/hooks/useReveal'
import {
  useCancelBooking,
  useCounselingInfo,
  useCounselingSummary,
  useCreateBooking,
  useFavoriteCounselorIds,
  useMyBookings,
  useRescheduleBooking,
  useSaveFavoriteCounselorIds,
  useSubmitBookingFeedback,
} from './counselingQuery'
import './CounselingCenterView.css'

type TabKey = 'booking' | 'mine' | 'consultants' | 'notice' | 'faq'

const TAB_QUERY_MAP: Record<string, TabKey> = {
  booking: 'booking',
  mine: 'mine',
  consultants: 'consultants',
  notice: 'notice',
  faq: 'faq',
}

/** 左侧索引导航：编号 + 页签文案 + 一句说明 */
const RAIL_ITEMS: { key: TabKey; no: string; Icon: typeof CalendarOutlined }[] = [
  { key: 'booking', no: '01', Icon: CalendarOutlined },
  { key: 'mine', no: '02', Icon: UserOutlined },
  { key: 'consultants', no: '03', Icon: CompassOutlined },
  { key: 'notice', no: '04', Icon: ReadOutlined },
  { key: 'faq', no: '05', Icon: QuestionCircleOutlined },
]

/** 面板头文案沿用 cover.* 命名（consultants 页签对应 cover.counselors） */
const COVER_KEY: Record<TabKey, 'booking' | 'mine' | 'counselors' | 'notice' | 'faq'> = {
  booking: 'booking',
  mine: 'mine',
  consultants: 'counselors',
  notice: 'notice',
  faq: 'faq',
}

/**
 * counseling 作用域组件 token：预约 / FAQ 表单输入框形态（圆角 10 + 更紧凑内边距）。
 * 外观基底由 src/main.tsx 的全局 Input token 提供，本页只做紧凑化差异。
 */
const counselingThemeComponents = {
  Input: {
    borderRadius: 10,
    colorText: 'var(--text-regular)',
    paddingInline: 14,
  },
}

/** 面板头：与全站编辑式封面同源，但更紧凑，服务工作台结构 */
function PanelHead({
  eyebrow,
  no,
  title,
  desc,
}: {
  eyebrow: string
  no: string
  title: string
  desc: string
}) {
  return (
    <header className="cx-panel-head">
      <div className="cx-ph-top">
        <span className="cx-ph-eyebrow">{eyebrow}</span>
        <span className="cx-ph-no">{no}</span>
      </div>
      <h2 className="cx-ph-title" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="cx-ph-desc">{desc}</p>
    </header>
  )
}

export function CounselingCenterView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const heroRef = useReveal<HTMLElement>()

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
  const rescheduleBooking = useRescheduleBooking()
  const submitFeedback = useSubmitBookingFeedback()
  const queryClient = useQueryClient()

  // 收藏老师与「我的」概览统计：均由后端下发
  const { data: favoriteIds = [] } = useFavoriteCounselorIds()
  const saveFavorites = useSaveFavoriteCounselorIds()
  const { data: summary, isPending: summaryPending } = useCounselingSummary()

  /** 收藏 / 取消收藏：整份列表提交（成功后失效咨询域缓存） */
  const toggleFavorite = useCallback(
    (id: number) => {
      const next = favoriteIds.includes(id)
        ? favoriteIds.filter((item) => item !== id)
        : [...favoriteIds, id]
      saveFavorites.mutate(next)
    },
    [favoriteIds, saveFavorites],
  )

  /** 可约时段查询：按「老师 + 日期」走 react-query 缓存，表单与改约弹窗共用 */
  const fetchTakenSlots = useCallback(
    (counselorId: number, date: string) =>
      queryClient.fetchQuery({
        queryKey: ['counseling', 'availability', counselorId, date],
        queryFn: ({ signal }) =>
          counselingApi
            .fetchSlotAvailability(counselorId, date, signal)
            .then((res) => res.takenSlots),
        staleTime: 30_000,
      }),
    [queryClient],
  )

  const counselors = info?.counselors ?? []
  const consultationTypes = info?.consultationTypes ?? []
  const specialties = info?.specialties ?? []
  const faqs = info?.faqs ?? []

  // URL ?tab= → 页签（映射表收窄合法值，未知/缺省回退 booking）
  const activeTab = TAB_QUERY_MAP[searchParams.get('tab') ?? ''] ?? 'booking'

  const panelRef = useRef<HTMLDivElement | null>(null)

  function switchTab(key: TabKey) {
    setSearchParams(key === 'booking' ? {} : { tab: key }, { replace: true })
    // 已滚过面板顶部时，切页签回到面板起点，避免停在半截内容处
    const el = panelRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (window.scrollY > top - 120) {
      window.scrollTo({ top: Math.max(top - 96, 0), behavior: 'smooth' })
    }
  }

  // 跨面板预约：预填表单 → 切到预约页签
  const bookingPanelRef = useRef<BookingPanelHandle | null>(null)
  function goBookWith(id: number | undefined) {
    if (id === undefined) return
    bookingPanelRef.current?.prefill(id)
    switchTab('booking')
  }

  // 从「我的收藏 / 我的预约」跳转过来时预填老师：/counseling?counselor=ID
  useEffect(() => {
    const raw = searchParams.get('counselor')
    if (!raw) return
    const counselorId = Number(raw)
    if (!Number.isFinite(counselorId)) return
    if (!counselors.length) return
    bookingPanelRef.current?.prefill(counselorId)
    // 预填后清理参数，避免刷新重复预填
    const next = new URLSearchParams(searchParams)
    next.delete('counselor')
    setSearchParams(next, { replace: true })
  }, [searchParams, counselors, setSearchParams])

  const goAiChat = () => void navigate('/counseling/ai-chat')

  const stats = [
    { value: counselors.length ? String(counselors.length) : '—', label: t('counseling.hero.stats.counselors') },
    { value: consultationTypes.length ? String(consultationTypes.length) : '—', label: t('counseling.hero.stats.types') },
    { value: '100%', label: t('counseling.hero.stats.free') },
    { value: '24h', label: t('counseling.hero.stats.confirm') },
  ]

  /** 面板头文案（编号与上方索引导航一一对应） */
  function panelHead(key: TabKey): ReactNode {
    const cover = COVER_KEY[key]
    const desc =
      key === 'consultants'
        ? `${counselors.length}${t('counseling.counselors.count')}${t(`counseling.cover.${cover}.desc`)}`
        : t(`counseling.cover.${cover}.desc`)
    return (
      <PanelHead
        eyebrow={t(`counseling.cover.${cover}.eyebrow`)}
        no={`No.${RAIL_ITEMS.find((item) => item.key === key)?.no ?? '01'}`}
        title={t(`counseling.cover.${cover}.title`)}
        desc={desc}
      />
    )
  }

  const panels: Record<TabKey, ReactNode> = {
    booking: (
      <>
        {panelHead('booking')}
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
          onGoMine={() => switchTab('mine')}
          onEditAccount={() => void navigate('/settings')}
          onSubmit={(values) => createBooking.mutateAsync(values)}
          isSubmitting={createBooking.isPending}
          fetchTakenSlots={fetchTakenSlots}
          onReschedule={rescheduleBooking.mutate}
          onSubmitFeedback={submitFeedback.mutate}
          mutationPending={rescheduleBooking.isPending || submitFeedback.isPending}
        />
      </>
    ),
    mine: (
      <>
        {panelHead('mine')}
        <MinePanel
          bookings={bookings}
          bookingsLoading={bookingsPending}
          bookingsError={bookingsError}
          onReloadBookings={() => void refetchBookings()}
          counselors={counselors}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          summary={summary}
          summaryLoading={summaryPending}
          onCancelBooking={cancelBooking.mutate}
          onReschedule={rescheduleBooking.mutate}
          onSubmitFeedback={submitFeedback.mutate}
          mutationPending={rescheduleBooking.isPending || submitFeedback.isPending}
          fetchTakenSlots={fetchTakenSlots}
          onBook={(counselorId) => {
            if (counselorId === undefined) switchTab('booking')
            else goBookWith(counselorId)
          }}
          onBrowseCounselors={() => switchTab('consultants')}
        />
      </>
    ),
    consultants: (
      <>
        {panelHead('consultants')}
        <ConsultantsPanel
          counselors={counselors}
          specialties={specialties}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onBook={goBookWith}
        />
      </>
    ),
    notice: (
      <>
        {panelHead('notice')}
        <NoticePanel />
      </>
    ),
    faq: (
      <>
        {panelHead('faq')}
        <FaqPanel faqs={faqs} onBook={() => switchTab('booking')} />
      </>
    ),
  }

  return (
    <ConfigProvider theme={{ components: counselingThemeComponents }}>
      <div className="counseling-page">
        {/* ============ Hero · 品牌主张 + 关键数据 + 主行动 ============ */}
        <section ref={heroRef} className="cx-hero">
          <div className="cx-hero-main">
            <span className="cx-eyebrow">{t('counseling.hero.eyebrow')}</span>
            <h1
              className="cx-title"
              dangerouslySetInnerHTML={{ __html: t('counseling.hero.title') }}
            />
            <p className="cx-desc">{t('counseling.hero.desc')}</p>

            <div className="cx-actions">
              <button type="button" className="cx-cta" onClick={() => switchTab('booking')}>
                {t('counseling.hero.primary')}
                <ArrowRightOutlined />
              </button>
              <button type="button" className="cx-cta-ghost" onClick={goAiChat}>
                <MessageOutlined />
                {t('counseling.hero.secondary')}
              </button>
            </div>

            <dl className="cx-stats">
              {stats.map((item) => (
                <div key={item.label} className="cx-stat">
                  <dt>{item.value}</dt>
                  <dd>{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 装饰性「呼吸光环」：纯 CSS 视觉锚点，不承载信息 */}
          <div className="cx-aura" aria-hidden="true">
            <span className="cx-aura-ring r1" />
            <span className="cx-aura-ring r2" />
            <span className="cx-aura-ring r3" />
            <span className="cx-aura-core" />
          </div>
        </section>

        {/* ============ Workspace · 索引导航 + 面板 ============ */}
        <div className="cx-workspace">
          <nav className="cx-rail" role="tablist" aria-label={t('counseling.hero.eyebrow')}>
            <span className="cx-rail-cap">Index</span>
            {RAIL_ITEMS.map(({ key, no, Icon }) => {
              const active = activeTab === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`cx-rail-item${active ? ' is-active' : ''}`}
                  onClick={() => switchTab(key)}
                >
                  <span className="cx-rail-num">{no}</span>
                  <span className="cx-rail-text">
                    <span className="cx-rail-label">
                      <Icon />
                      {t(`counseling.tabs.${COVER_KEY[key]}`)}
                    </span>
                    <span className="cx-rail-desc">{t(`counseling.rail.${key}`)}</span>
                  </span>
                </button>
              )
            })}

            {/* AI 两处入口：咨询师（独立子页）+ 伴侣（独立子页） */}
            <div className="cx-rail-ai-group">
              <button type="button" className="cx-rail-ai" onClick={goAiChat}>
                <span className="cx-rail-ai-icon">
                  <MessageOutlined />
                </span>
                <span className="cx-rail-text">
                  <span className="cx-rail-ai-title">{t('counseling.aiChat.entryTitle')}</span>
                  <span className="cx-rail-desc">{t('counseling.aiChat.entryDesc')}</span>
                </span>
              </button>
              <button
                type="button"
                className="cx-rail-ai"
                onClick={() => void navigate('/counseling/companion')}
              >
                <span className="cx-rail-ai-icon">06</span>
                <span className="cx-rail-text">
                  <span className="cx-rail-ai-title">{t('counseling.tabs.companion')}</span>
                  <span className="cx-rail-desc">{t('counseling.rail.companion')}</span>
                </span>
              </button>
            </div>
          </nav>

          <div className="cx-panel" ref={panelRef}>
            {isPending ? (
              <div className="cx-state">
                <Skeleton active title={{ width: '42%' }} paragraph={{ rows: 3 }} />
                <Skeleton active title={false} paragraph={{ rows: 6 }} />
              </div>
            ) : isError ? (
              <div className="cx-state">
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
              <>
                {(Object.keys(panels) as TabKey[]).map((key) => (
                  <div
                    key={key}
                    role="tabpanel"
                    className="cx-panel-body"
                    hidden={activeTab !== key}
                  >
                    {panels[key]}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* AI 客服（悬浮窗） */}
        <AssistantFab />
      </div>
    </ConfigProvider>
  )
}

export default CounselingCenterView
