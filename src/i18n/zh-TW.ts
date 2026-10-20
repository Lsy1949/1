/* i18n 文案（繁體中文）—— 全量迁移自 Vue 版 locales/zh-TW.ts，键名结构为各批次共用契约 */

export default {
  nav: {
    brand: '生涯心旅',
    menu: { evaluation: '測評中心', articles: '文章資訊', activities: '活動中心', counseling: '心理諮詢' },
    group: { mentalScales: '心理量表', careerScales: '職業量表', hotPicks: '熱門推薦', browseByCategory: '分類瀏覽', featuredActivities: '特色活動', professionalService: '專業服務', aiColumn: 'AI 專欄', counselingSupport: '諮詢輔助' },
    item: { phq9: '抑鬱自評 (PHQ-9)', gad7: '焦慮自評 (GAD-7)', pss: '壓力感量表 (PSS)', riasec: '霍蘭德興趣 (RIASEC)', mbti: '性格測試 (MBTI)', daily: '每日精選', featured: '專題報導', articleList: '全部文章', psychology: '心理健康', career: '生涯導航', stories: '成長故事', timeCapsule: '時光膠囊', square: '交流廣場', booking: '預約諮詢', aiConsult: 'AI 諮詢師', aiCompanion: 'AI 伴侶', consultants: '諮詢師簡介', notice: '諮詢須知', faq: '常見問題' },
    search: '搜尋',
    theme: { light: '淺色', dark: '深色', auto: '跟隨系統' },
    user: { login: '登入', guest: '訪客', profile: '個人中心', settings: '帳號設定', logout: '退出登入' },
    mobile: { menuTitle: '選單導航', enterCenter: '進入測評中心首頁', appearance: '外觀主題', language: '語言設定' }
  },
  common: {
    back: '返回', confirm: '確認', cancel: '取消', submit: '提交', save: '儲存',
    delete: '刪除', edit: '編輯', view: '檢視', loading: '載入中...', noData: '暫無資料',
    loadFailed: '載入失敗', retry: '重試',
    deleteConfirm: '確定要刪除嗎？刪除後無法恢復。',
    deleteTitle: '刪除確認', deleteOk: '確定刪除',
    searchPlaceholder: '搜尋…',
    optional: '選填', required: '帶 * 為必填',
    detail: '詳情', close: '關閉', all: '全部'
  },
  home: {
    carousel: {
      exploreTag: '探索發現',
      learnMore: '了解詳情',
      scrollDown: 'Scroll Down',
      preparing: '準備：{text}',
      slide1: { title: '專業心理健康服務', tag: '心靈呵護', desc: '我們提供專業的心理健康服務，幫助您解決情緒困擾、人際關係、壓力管理等問題', btn: '了解更多' },
      slide2: { title: '豐富多彩活動中心', tag: '精彩體驗', desc: '參與心理沙龍、講座與團輔活動，在互動中探索自我，在交流中收穫成長', btn: '查看活動' },
      slide3: { title: '智能匹配諮詢師', tag: '智慧匹配', desc: '根據您的需求和偏好，智能匹配最適合的諮詢師，提供個性化服務', btn: '立即匹配' }
    },
    marquee: { users: '10,000+ 服務用戶', experts: '50+ 專家團隊', satisfaction: '98% 滿意度', aiPsych: 'AI + 心理學', support: '7×24h 線上支援', slogan: '閱讀，看見更廣闊的自己' },
    news: { badge: 'NEWS & UPDATES', title: '最新動態', subtitle: '洞察行業前沿，把握成長機遇', jumpTip: '正在跳轉到文章中心',
      items: [
        { category: '平台更新', title: '生涯心旅推出全新 AI 心理評估系統', summary: '引入基於人工智能技术的心理評估系統，更精準地了解你的心理狀態與需求。', date: '2026-01-04' },
        { category: '健康指南', title: '冬季心理健康指南：如何應對季節性情緒波動', summary: '實用的方法幫助你在寒冷季節裡保持心理健康，走出季節性低落。', date: '2025-12-28' },
        { category: '服務報告', title: '線上心理諮詢服務滿意度調查結果公佈', summary: '95% 的用戶對我們的線上心理諮詢服務表示滿意，我們將繼續努力提供優質服務。', date: '2025-12-20' },
        { category: '團隊動態', title: '心理健康專家團隊擴大：歡迎新成員加入', summary: '三位資深心理健康專家加入生涯心旅團隊，提供更專業、多元化的心理支持。', date: '2025-12-15' }
      ]
    },
    about: {
      badge: 'ABOUT US',
      title1: '科技賦能', title2: '用心呵護每一份成長',
      p1: '生涯心旅致力於為用戶提供專業的心理健康服務。我們結合人工智能大數據與專業心理學知識，構建精準的心理支持模型。',
      p2: '我們的使命是通過科技的力量，打破時間和空間的限制，讓每個人都能享受高質量、個性化的心理健康服務。',
      statUsers: '服務用戶', statExperts: '專家團隊', statSatisfaction: '滿意度', alt: '關於我們'
    },
    services: { badge: 'OUR SERVICES', title: '我們的服務', subtitle: '全方位的心理健康與生涯發展支持體系', learnMore: '了解詳情',
      items: [
        { icon: 'DataAnalysis', title: '測評中心', desc: 'PHQ-9、GAD-7、MBTI 等權威量表，多維度科學認識真實的自我。' },
        { icon: 'ChatLineRound', title: '心理諮詢', desc: '專業諮詢師一對一服務，守護你的情緒與心理健康。' },
        { icon: 'Clock', title: '時光膠囊', desc: '記錄此刻心路，與未來的自己對話，讓成長有跡可循。' },
        { icon: 'Reading', title: '文章資訊', desc: '精選心理健康與生涯發展內容，閱讀，看見更廣闊的自己。' }
      ]
    },
    features: { badge: 'FEATURES', title: '平台特色功能', subtitle: '前沿科技驅動，助您更好成長',
      items: [
        { icon: 'DataAnalysis', title: '專業量表', desc: 'PHQ-9、GAD-7、MBTI 等權威量表，科學評估心理狀態。' },
        { icon: 'Connection', title: '智能匹配', desc: '根據需求與偏好，智能匹配最適合的諮詢師。' },
        { icon: 'Clock', title: '時光記錄', desc: '時光膠囊記錄成長心路，與未來開啟對話。' },
        { icon: 'TrendCharts', title: '成長追蹤', desc: '成長看板追蹤測評軌跡與情緒趨勢，可視化成長。' },
        { icon: 'ChatDotRound', title: '社區交流', desc: '交流廣場與同路人分享心得，共同成長。' },
        { icon: 'Lock', title: '隱私保護', desc: '嚴格保護用戶隱私，確保資訊安全無虞。' }
      ]
    },
    contact: {
      title: '聯繫我們', desc: '無論是建議、反饋還是諮詢，我們都樂意傾聽。',
      phone: '電話', email: '郵箱', formTitle: '留言諮詢',
      name: '姓名', namePlaceholder: '您的姓名',
      emailLabel: '郵箱', emailPlaceholder: '您的郵箱',
      message: '留言內容', messagePlaceholder: '請留下您的問題或建議',
      submit: '發送留言', submitSuccess: '留言提交成功！我們會盡快與您聯繫。'
    },
    nav: { quick: '快速導航', top: '首頁', news: '最新動態', about: '關於我們', services: '我們的服務', features: '平台特色', contact: '聯繫我們' },
    validation: { nameRequired: '請輸入您的姓名', emailRequired: '請輸入郵箱地址', emailFormat: '請輸入正確的郵箱地址', messageRequired: '請輸入您的留言' },
    aiAssistant: {
      fab: 'AI 客服',
      title: 'AI 客服',
      subtitle: '你好，我是生涯心旅 AI 助手',
      greeting: '你好呀，我是生涯心旅的 AI 客服。平台的功能、心理小知識，或者你此刻的心情，都可以和我聊聊。有什麼可以幫你的嗎？',
      placeholder: '輸入你想說的…',
      send: '傳送',
      stop: '停止產生',
      restart: '清空重新開始',
      disclaimer: 'AI 回覆由演算法產生，僅供參考，不能取代專業心理諮詢。緊急情況請撥打 12356。',
      quickPrompts: ['這個平台能做什麼？', '最近壓力有點大', '總是睡不好', '怎麼預約心理老師？']
    }
  },
  assessment: {
    tabs: { scales: '測評廣場', mine: '我的', dashboard: '成長看板' },
    cover: {
      scales: { title: '測評<em>廣場</em>', desc: '多維度探索真實的自我 —— 心理健康、生涯發展、認知能力、電競潛能' },
      mine: { title: '成長<em>探索者</em>', desc: '每一次測評，都是向內探索的旅程。' },
      dashboard: { title: '成長<em>看板</em>', desc: '追蹤身心能量、情緒趨勢與測評分佈，AI 交叉分析為你生成專屬成長洞察。' }
    },
    searchPlaceholder: '搜尋測評…',
    categories: { all: '全部', mental: '心理健康', career: '生涯發展', cognitive: '認知能力', esports: '電競能力', learning: '學習風格', social: '人際關係' },
    submitted: '測評已完成！',
    unit: { items: '項', questions: '題', score: '分', minutes: '分鐘' },
    status: { completed: '已完成', comingSoon: '即將上線' },
    empty: '沒有找到匹配的測評',
    disclaimer: '測評結果僅供個人探索參考，不具備臨床醫療診斷效力。',
    comingSoonTip: '「{name}」即將上線，敬請期待',
    profile: {
      completed: '已完成', growthPoints: '成長積分', assessmentDays: '測評天數',
      badges: '已獲勳章', growthLevel: '成長等級',
      joinedOn: '加入於 {date}', toNextLevel: '距下一級 {points} 積分',
      historyTitle: '測評歷史', clearHistory: '清空記錄', historyEmpty: '還沒有測評記錄，去完成第一個測評吧',
      goAssess: '去測評', viewDetails: '查看詳情', retake: '重新測評',
      badgesTitle: '我的勳章', unlocked: '已解鎖'
    },
    dashboard: {
      kpi: { total: '累計測評', points: '成長積分', avg: '平均得分', days: '活躍天數' },
      monthlyGoal: '本月成長目標',
      goalDesc: '目標 {target} 次測評，已完成 {done} 次，最愛維度：{dim}',
      quickEntry: '快速入口',
      radar: '身心能量雷達', radarTip: '藍色為您的狀態，灰色虛線為群體均值',
      yourStatus: '您的狀態', groupAvg: '群體均值',
      moodTrend: '情緒趨勢波動', range7: '近7天', range30: '近30天', rangeAll: '全部',
      high: '高', mid: '中', low: '低', avgLabel: '均值', noTrendData: '暫無趨勢數據',
      typeDist: '測評類型分佈', totalLabel: '總測評', distEmpty: '完成測評後查看分佈',
      aiInsight: 'AI 交叉分析洞察', summary: '狀態總結', strength: '核心優勢', risk: '潛在風險', suggestion: '行動建議',
      aiEmpty: '完成至少 2 項不同維度的測評，AI 將為您揭示深層關聯。',
      progress: '進步對比', recent: '最近：', improve: '改善', attention: '需關注', flat: '持平', up: '提升', down: '下降',
      progressEmpty: '同一量表完成2次以上可查看進步對比',
      recommend: '智能推薦', history: '歷史足跡', filterScale: '篩選量表', exportCsv: '匯出 CSV',
      col: { date: '測評日期', scale: '量表名稱', score: '得分', conclusion: '結論', action: '操作' },
      detail: '詳情', noHistory: '還沒有完成任何測評'
    },
    dialog: {
      estimatedTime: '預計耗時', questionCount: '題目數量', reliability: '測評信度', reliabilityHigh: '高 (0.85+)',
      notice: '測評須知',
      tip1: '請在安靜、不受干擾的環境下進行測評。',
      tip2: '請根據您近兩週的真實情況和第一直覺作答。',
      tip3: '測評結果僅供自我探索參考，非臨床診斷。',
      start: '進入沉浸式答題',
      completedOn: '測評完成於 {date}',
      deepAnalysis: '深度解析', actionSuggestion: '行動建議',
      mbtiDim: '維度傾向性', riasecDim: '六大維度得分',
      retake: '重新測評', saveReport: '儲存報告', share: '分享',
      reportGenerated: '報告已生成並準備下載 (Mock)',
      shareCopied: '分享連結已複製到剪貼簿 (Mock)'
    },
    history: {
      clearConfirm: '確定要清空所有測評記錄嗎？此操作不可恢復。',
      clearTitle: '提示', clearOk: '確定清空', cleared: '測評記錄已清空',
      noExport: '暫無測評記錄可匯出', exported: '已匯出測評記錄',
      allScales: '全部量表',
      csvHeaders: { date: '測評日期', scale: '量表名稱', score: '得分', level: '等級', title: '結果標題' }
    },
    action: { viewDetails: '查看詳情', retake: '重新測評', goAssess: '去測評' }
  },
  counseling: {
    tabs: { booking: '預約諮詢', counselors: '心理老師', notice: '諮詢須知', faq: '常見問題', companion: 'AI 伴侶' },
    types: { individual: '個別諮詢', couple: '伴侶諮詢', family: '家庭諮詢', group: '團體輔導' },
    aiChat: {
      eyebrow: '— AI Counselor',
      title: 'AI<em>諮詢師</em>',
      desc: '隨時在線的 AI 心理陪伴：傾聽你的情緒，陪你梳理困擾。全天候可用，對話完全保密。',
      entryTitle: 'AI 諮詢師 · 隨時傾訴',
      entryDesc: '與 AI 心理諮詢師對話，即時獲得情緒陪伴與支持',
      greeting: '你好，我是這裡的 AI 諮詢師。這是一個安全、保密的空間，你可以按自己的節奏，聊聊最近的狀態、情緒或困擾。我在聽。',
      placeholder: '說說你最近的狀態或困擾…',
      send: '傳送',
      stop: '停止產生',
      disclaimer: 'AI 回覆由演算法產生，僅供情緒陪伴與自我探索參考，不能取代專業心理諮詢或醫療診斷。若你正處於危機之中，請立即撥打心理援助專線 12356，或聯繫學校心理老師。',
      footnote: '想獲得更深入的支持？',
      bookLink: '預約真人心理老師',
      quickPrompts: ['最近壓力很大，喘不過氣', '情緒低落，提不起勁', '和室友鬧矛盾了', '對未來很迷茫']
    },
    companion: {
      eyebrow: '— AI Companion',
      title: 'AI<em>伴侶</em>',
      desc: '一個隨時的樹洞與陪伴：不評判、不說教，只是安靜地聽你說話，陪你度過每一個平常或難熬的日子。',
      greeting: '嗨，我在呢。今天過得怎麼樣？不管想聊什麼——開心的、煩心的、或者只是隨口碎碎念，我都陪著你。',
      placeholder: '隨便說點什麼，我都在…',
      send: '傳送',
      stop: '停止產生',
      disclaimer: 'AI 回覆由演算法產生，僅供日常陪伴與自我探索參考，不能取代專業心理諮詢或醫療診斷。若你正處於危機之中，請立即撥打心理援助專線 12356，或聯繫學校心理老師。',
      footnote: '想要更專業的心理支持？',
      bookLink: '預約真人心理老師',
      quickPrompts: ['今天有點累，想找人聊聊', '陪我聊聊最近的煩心事', '睡不著，陪我說說話', '給我一點放鬆的小建議']
    },
    cover: {
      booking: { eyebrow: '— Booking', title: '預約<em>諮詢</em>', desc: '四步完成預約：選擇類型 → 挑選老師 → 確定時間 → 填寫資訊。' },
      counselors: { eyebrow: '— Counselors', title: '心理<em>老師</em>', desc: '專業心理老師，覆蓋情緒、關係、家庭、創傷等多個方向，找到最適合你的那一位。' },
      notice: { eyebrow: '— Guide', title: '諮詢<em>須知</em>', desc: '了解諮詢流程、保密原則、諮詢準備、服務說明與取消改約規則，讓諮詢更順暢。' },
      faq: { eyebrow: '— FAQ', title: '常見<em>問題</em>', desc: '關於心理諮詢的常見疑問與解答，搜尋或瀏覽分類，找到你想知道的。' }
    },
    step: { type: '諮詢類型', counselor: '心理老師', time: '諮詢時間', info: '個人資訊' },
    btn: { confirmBooking: '確認預約', online: '視頻', offline: '面對面', book: '預約', onlineConsult: '線上諮詢', close: '關閉', bookThis: '預約此老師' },
    summary: { title: '預約摘要', type: '諮詢類型', counselor: '心理老師', date: '日期', time: '時間', mode: '方式', serviceType: '服務性質', freeTag: '校內免費', onlineValue: '視頻諮詢', offlineValue: '面對面諮詢', empty: '未選擇' },
    myBookings: '我的預約',
    form: { name: '稱呼', namePlaceholder: '如何稱呼您', contact: '聯繫方式', contactPlaceholder: '手機號或郵箱', datePlaceholder: '選擇諮詢日期', description: '問題描述', descPlaceholder: '簡單描述您想探討的話題', optional: '選填', required: '帶 * 為必填', first: '首次', followup: '複診', experience: '諮詢經歷', agreePrefix: '我已閱讀並同意', noticeLink: '《諮詢須知》', and: '與', consentLink: '《知情同意書》' },
    validation: { nameRequired: '請填寫稱呼', contactRequired: '請填寫聯繫方式', agreeRequired: '請閱讀並同意相關條款', formIncomplete: '請完整填寫必填資訊', typeRequired: '請選擇諮詢類型', counselorRequired: '請選擇心理老師', dateRequired: '請選擇諮詢日期', slotRequired: '請選擇諮詢時段' },
    message: { bookingSuccess: '預約提交成功！心理老師將在24小時內確認', cancelConfirm: '確定取消此預約嗎？', cancelTitle: '提示', cancelled: '已取消預約' },
    counselors: {
      searchPlaceholder: '搜尋姓名 / 專長', searchPlaceholderAlt: '搜尋姓名 / 專長…',
      specialty: '專長', gender: '性別', male: '男', female: '女', sort: '排序',
      sortByRating: '評分優先', sortByExperience: '經驗優先', sortBySessions: '諮詢次數',
      count: '位', sessionsSuffix: '次諮詢', yearsSuffix: '年經驗', sessionsUnit: '次',
      filteredHint: '為您篩選擅長「{type}」的老師',
      empty: '沒有找到匹配的心理老師',
      dialog: { intro: '專業介紹', specialties: '擅長領域', background: '受訓背景', reviews: '來訪者評價' }
    },
    section: { confidentiality: '保密原則', preparation: '諮詢前後如何準備', service: '服務說明', cancellation: '取消與改約', process: '諮詢流程' },
    process: {
      heroLabel: 'Process · 諮詢流程',
      step1: { title: '提交預約', desc: '線上選擇心理老師與時段' },
      step2: { title: '初步評估', desc: '首次訪談確認議題與目標' },
      step3: { title: '正式諮詢', desc: '按節奏展開諮詢，通常6-12次' },
      step4: { title: '結案回顧', desc: '回顧成長，規劃後續' }
    },
    confidentiality: {
      warning: '例外情況：涉及自傷/傷人風險、未成年人受虐、法律強制要求時，心理老師有義務突破保密。',
      items: ['諮詢內容、記錄、測評結果嚴格保密', '未經同學書面同意，不向第三方透露任何資訊', '所有諮詢記錄加密儲存，僅心理老師本人可查閱', '督導討論時會隱去同學身份資訊', '諮詢關係結束後，保密義務繼續有效']
    },
    prep: { before: '諮詢前', during: '諮詢中', after: '諮詢後',
      beforeItems: ['提前 5 分鐘到達諮詢室或登入視頻房間', '簡單梳理近期困擾和想探討的話題', '保持開放、真誠的心態'],
      duringItems: ['按自己的節奏表達，不必勉強', '對心理老師的方法或反饋有疑問可以隨時提出', '情緒波動屬於正常過程'],
      afterItems: ['給自己一些安靜時間消化', '記錄諮詢中獲得的啟發', '完成心理老師佈置的"練習任務"']
    },
    service: {
      freeTitle: '本校心理輔導服務完全免費', freeDesc: '面向全體在校同學開放，不收取任何費用',
      firstWarning: '首次諮詢通常為評估訪談，時長可能延長至 60-80 分鐘，同樣免費。',
      info: { target: '服務對象', targetValue: '全體在校同學', nature: '服務性質', natureValue: '學校免費心理輔導', duration: '單次時長', durationValue: '約 50 分鐘', frequency: '建議頻率', frequencyValue: '每週 1 次', format: '諮詢形式', formatValue: '面對面 / 視頻諮詢', cycle: '預約週期', cycleValue: '可提前 7 天預約' }
    },
    cancellation: {
      items: ['提前 24 小時以上可線上取消或改約，無任何影響', '提前 12-24 小時取消，建議補約一次以保持連續性', '不足 12 小時或爽約將影響後續預約優先級', '因心理老師原因取消，將協助重新安排合適時段', '特殊情況（突發疾病、不可抗力）可說明情況申請豁免']
    },
    faq: {
      searchPlaceholder: '搜尋問題關鍵詞...',
      contactPrompt: '沒有找到答案？', contactBtn: '線上諮詢',
      categories: { all: '全部問題', booking: '預約相關', service: '服務說明', effect: '諮詢效果', confidentiality: '保密相關' },
      empty: '沒有找到相關問題'
    },
    booking: { cancelBtn: '取消', empty: '暫無預約記錄', emptyHint: '暫無預約，去預約一位老師吧' },
    empty: { noCounselor: '沒有找到匹配的老師', noBookings: '暫無預約記錄', noFaq: '沒有找到相關問題' },
    freeTag: '校內免費',
    weekdays: { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' },
    timeSlots: { morning: '上午', afternoon: '下午', evening: '晚間' },
    bookingStatus: { pending: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消' }
  },
  article: {
    categories: { all: '精選推薦', daily: '每日精選', featured: '專題報導', psychology: '心理科普', career: '生涯導航', stories: '成長故事' },
    intro: {
      all: { title: '閱讀，<em>看見</em><br>更廣闊的自己', sub: '每日精選心理學深度文章、生涯導航與成長故事' },
      daily: { title: '每日精選', sub: '每日甄選的高品質內容，值得你花時間閱讀' },
      featured: { title: '專題報導', sub: '深度專題報導，沉浸式閱讀體驗' },
      psychology: { title: '心理科普', sub: '探索心理學的奧秘，理解內心的運作機制' },
      career: { title: '生涯導航', sub: '指引你的職業方向與成長路徑' },
      stories: { title: '成長故事', sub: '真實的故事，與你共鳴共成長' }
    },
    stats: { articles: '深度文章', categories: '主題分類', update: '每日更新', count: '篇內容' },
    search: '搜尋你感興趣的話題...',
    spotlight: { title: '今日焦點', sub: '為您甄選的最佳深度內容', read: '立即閱讀' },
    grid: { all: '全部文章', viewAll: '查看全部' },
    collections: {
      title: '專題合集', sub: '沉浸式學習，深度掌握知識體系', viewAll: '查看全部', enter: '進入專題',
      countUnit: '篇精選',
      items: [
        { title: '新生適應指南', desc: '從校園到職場的無縫銜接，助你快速融入新環境。' },
        { title: '情緒調節手冊', desc: '掌握心理學工具，在壓力之下保持內心的平靜與從容。' },
        { title: '高效學習方法', desc: '科學的學習策略，讓你的認知效率實現質的飛躍。' },
        { title: '職場溝通藝術', desc: '在複雜的職場環境中，用溝通搭建信任與合作的橋樑。' }
      ]
    },
    empty: '暫無相關內容，換個詞試試？',
    detail: {
      comments: {
        title: '評論',
        count: '{n} 條評論',
        placeholder: '寫下你的想法...',
        submit: '發表評論',
        reply: '回覆',
        empty: '還沒有評論，來說點什麼吧',
        like: '讚',
        liked: '已讚',
        anon: '匿名'
      }
    }
  },
  capsule: {
    list: {
      eyebrow: 'TIME CAPSULE · 時光檔案',
      title: '我的<em>膠囊</em>',
      desc: '寫給未來的信，在時間中等待開啟',
      stats: { total: '總計', pending: '待開啟', opened: '已開啟', auditing: '審核中' },
      filter: { all: '全部', pending: '待開啟', opened: '已開啟' },
      countdown: '{days} 天後開啟',
      status: { auditing: '審核中', rejected: '未通過', pending: '未開啟', failed: '發送失敗', opened: '已開啟' },
      method: { email: '電子郵件', letter: '手寫信' },
      delete: '刪除',
      deleteConfirm: '確定要刪除這個時光膠囊嗎？刪除後無法恢復。',
      deleteTitle: '刪除確認', deleteOk: '確定刪除', deleteCancelled: '取消', deleteSuccess: '刪除成功',
      empty: { title: '檔案<em>空白</em>', hint: '把此刻的心情封存，寫給未來的自己', btn: '建立第一個膠囊' },
      fab: '新建膠囊'
    },
    create: {
      back: '返回廣場',
      eyebrow: '— New Capsule',
      title: '新建<em>膠囊</em>',
      subtitle: '把此刻的心情，封存進時光膠囊',
      sections: { title: '膠囊標題', openDate: '開啟時間', method: '開啟方式', emailInfo: '郵件資訊', letterInfo: '收件人資訊', anonymous: '匿名發送', public: '公開到廣場', content: '膠囊內容', photo: '添加照片', mood: '此刻心情' },
      placeholders: { title: '請輸入標題', date: '選擇開啟日期', email: '收件人郵箱地址', name: '收件人姓名', phone: '收件人手機號', address: '詳細地址（街道、門牌號等）', editor: '說些什麼吧...' },
      hints: { dateRange: '注：最多支援設定 5 年後的時間', contentOptional: '（內容或圖片至少一項）' },
      methods: { email: '電子郵件', letter: '手寫信' },
      tips: { anonymous: '將不會知道膠囊是你發送的', public: '膠囊到期開啟後，將分享到交流廣場', commentOff: '已關閉評論', commentOn: '已開啟評論', disableComment: '關閉評論' },
      photo: { add: '點擊添加', upload: '點擊上傳照片（最多 6 張）', alt: '照片', maxWarning: '最多上傳 6 張圖片' },
      submit: '立即封存', submitting: '封存中...',
      validation: { title: '請輸入膠囊標題', date: '請選擇開啟時間', content: '請添加內容或圖片', email: '請輸入收件人郵箱', emailFormat: '郵箱格式不正確', letterName: '請輸入收件人姓名', letterPhone: '請輸入收件人手機號', letterAddress: '請輸入收件地址' },
      success: { title: '時光膠囊已封存', body: '封存成功！', desc: '我們已將您的心意妥善保存。請在 {date} 回來開啟它。', btn: '回到廣場' }
    },
    detail: {
      back: '返回廣場',
      title: '膠囊<em>詳情</em>',
      created: '建立於 {date}',
      remaining: '還有 {days} 天開啟',
      opened: '已開啟',
      info: { method: '開啟方式', email: '收件郵箱', recipient: '收件人', phone: '聯繫電話', address: '收件地址', anonymous: '匿名狀態' },
      methodValue: { email: '郵箱發送', letter: '信件郵寄' },
      anonymousValue: { yes: '匿名發送', no: '實名發送' },
      countdown: '還有 {days} 天',
      capsuleOpened: '膠囊已開啟',
      actions: { rewrite: '再寫一封', delete: '刪除' },
      loading: '載入中...',
      previewAlt: '預覽',
      deleteConfirm: '確定要刪除這個時光膠囊嗎？刪除後無法恢復。',
      deleteTitle: '提示', deleteOk: '確定刪除', deleteCancelled: '取消', deleteSuccess: '刪除成功',
      dayUnit: '天'
    }
  },
  square: {
    list: {
      eyebrow: 'SQUARE · 交流廣場',
      title: '交流<em>廣場</em>',
      desc: '分享心理經歷，看見彼此的成長',
      stats: { moments: '心得動態', capsules: '公開膠囊', interactions: '互動總數' },
      filter: { all: '全部', moment: '心得動態', capsule: '公開膠囊' },
      like: '點讚', comment: '評論', share: '分享',
      anonymous: '匿名同學',
      capsuleBadge: '時光膠囊',
      momentBadge: '心得動態',
      fab: '發布心得',
      hot: '熱議',
      pinned: '置頂',
      community: {
        online: '人線上',
        todayNew: '今日新帖',
        emptyMembers: '暫無活躍同學',
        emptyTopics: '暫無熱門話題',
        dailyPrompt: { label: '今日話題', question: '最近哪件小事，讓你覺得生活還挺值得的？', join: '參與討論' },
        sidebar: {
          activeMembers: '活躍同學',
          trending: '熱門話題',
          guidelines: '社區公約',
          guidelinesItems: ['尊重每一位分享者', '不評判，多傾聽', '鼓勵比建議更有力量', '遇到困擾請預約諮詢']
        }
      },
      empty: { title: '廣場還很安靜', hint: '成為第一個分享的人', btn: '發布心得' },
      emptyFiltered: '目前分類還沒有動態，換個分類看看吧'
    },
    create: {
      back: '返回廣場',
      eyebrow: '— New Post',
      title: '發布<em>心得</em>',
      subtitle: '把此刻的感悟，分享給同行的人',
      sections: { mood: '此刻心情', content: '心得內容', topic: '話題標籤', photo: '添加照片', anonymous: '匿名發布', comment: '允許評論' },
      placeholders: { content: '說些什麼吧...' },
      hints: { contentOptional: '（內容或圖片至少一項）' },
      topicPlaceholder: '添加話題標籤（回車確認，最多3個）',
      topicMaxTip: '最多添加 3 個話題',
      moods: { happy: '開心', excited: '興奮', calm: '平靜', sad: '低落', hopeful: '期待' },
      photo: { add: '點擊添加', upload: '點擊上傳照片（最多 6 張）', alt: '照片', maxWarning: '最多上傳 6 張圖片' },
      submit: '立即發布', submitting: '發布中...',
      validation: { content: '請添加內容或圖片' },
      success: { title: '發布成功', body: '你的心得已分享到廣場', btn: '回到廣場' }
    },
    detail: {
      back: '返回廣場',
      title: '動態<em>詳情</em>',
      createdAt: '發布於 {date}',
      anonymous: '匿名同學',
      like: '點讚', share: '分享',
      comments: {
        title: '評論',
        count: '{n} 條評論',
        placeholder: '寫下你的想法...',
        submit: '發表評論',
        empty: '還沒有評論，來搶沙發吧',
        reply: '回覆',
        replyTo: '回覆 {name}',
        repliedTo: '回覆 @{name}',
        cancelReply: '取消',
        submitted: '評論已發布'
      }
    }
  },
  profile: {
    eyebrow: '個人中心',
    title: '我的<em>檔案</em>',
    desc: '在這裡管理你的個人資訊、心理檔案與活動記錄，每一份成長都被妥善收藏。',
    hero: {
      editProfile: '編輯資料',
      viewStats: '查看統計',
      studentId: '學號',
      school: '學校',
      joinDate: '加入時間',
      bioEmpty: '這個人很懶，還沒有寫自我介紹'
    },
    card: {
      profile: {
        title: '基礎資料',
        desc: '維護你的身份資訊，方便在預約與諮詢中使用。',
        name: '姓名',
        studentId: '學號',
        school: '所在學校',
        enrollYear: '入學年份',
        gender: '性別',
        genderMale: '男',
        genderFemale: '女',
        genderOther: '其他',
        major: '專業',
        grade: '年級',
        roleStudent: '學生',
        roleTeacher: '教師',
        roleAdmin: '管理員',
        save: '儲存資料',
        saveSuccess: '個人資料已更新'
      },
      psychological: {
        title: '心理檔案',
        desc: '記錄你的性格類型與心理狀態，幫助諮詢師更好地了解你。',
        mbti: 'MBTI 類型',
        mbtiPlaceholder: '選擇你的 MBTI',
        interests: '興趣標籤',
        interestPlaceholder: '輸入後Enter鍵新增',
        bio: '自我介紹',
        stressLevel: '近期壓力水平',
        stressLow: '輕鬆',
        stressMid: '適中',
        stressHigh: '較大',
        sleepQuality: '睡眠品質',
        sleepPoor: '不佳',
        sleepFair: '一般',
        sleepGood: '良好',
        save: '儲存檔案',
        saveSuccess: '心理檔案已更新'
      },
      stats: {
        title: '活動統計',
        desc: '你在平台上的成長足跡一覽。',
        assessments: '參與測評',
        counseling: '諮詢次數',
        moments: '發佈心得',
        favorites: '收藏文章',
        capsules: '時光膠囊'
      },
      growth: {
        title: '成長足跡',
        desc: '最近的活動記錄，見證每一步成長。',
        items: {
          assessment: '完成了測評',
          counseling: '完成了一次諮詢',
          capsule: '建立了時光膠囊',
          article: '收藏了文章',
          square: '發布了心得',
          comment: '發表了評論',
          like: '點讚了內容',
          login: '首次登入平台',
          milestone: '達成成長里程碑'
        },
        viewAll: '查看全部',
        summary: '成長概覽',
        totalActivities: '累計活動',
        activeDays: '活躍天數',
        streak: '連續打卡',
        badges: '獲得徽章',
        badgeFirst: '初心者',
        badgeFirstDesc: '完成首次測評',
        badgeExplorer: '探索者',
        badgeExplorerDesc: '體驗全部模組',
        badgePersistent: '堅持者',
        badgePersistentDesc: '連續活躍7天',
        badgeCollector: '收藏家',
        badgeCollectorDesc: '收藏10篇文章',
        year2024: '2024年',
        year2025: '2025年',
        noMore: '沒有更多了'
      },
      danger: {
        title: '危險操作',
        desc: '註銷帳號將永久刪除你的所有資料，此操作不可恢復。',
        deleteBtn: '註銷帳號',
        confirmTitle: '確認註銷帳號',
        confirmMsg: '此操作將永久刪除你的帳號及所有相關資料，且無法恢復。是否繼續？',
        confirmBtn: '確認註銷',
        deleted: '帳號已註銷，即將返回首頁'
      }
    }
  },
  settings: {
    eyebrow: '帳號設定',
    title: '安全與<em>偏好</em>',
    desc: '管理帳號安全、通知偏好、隱私設定與個性化偏好，打造屬於你的使用體驗。',
    card: {
      security: {
        title: '帳號安全',
        desc: '保護你的帳號安全，定期更換密碼並保持聯繫方式有效。',
        changePassword: '修改密碼',
        oldPassword: '舊密碼',
        newPassword: '新密碼',
        confirmPassword: '確認新密碼',
        updatePassword: '更新密碼',
        passwordChanged: '密碼修改成功',
        passwordMismatch: '兩次輸入的密碼不一致',
        fillRequired: '請填寫完整的密碼資訊',
        boundAccounts: '已綁定的聯繫方式',
        phone: '手機',
        email: '郵箱',
        modify: '修改',
        loginDevices: '登入裝置管理',
        currentDevice: '目前裝置',
        lastLogin: '最近登入',
        revokeDevice: '移除裝置',
        deviceIp: 'IP 位址',
        deviceBrowser: '瀏覽器',
        deviceRevokeConfirm: '確定要移除此裝置嗎？移除後該裝置需要重新登入。',
        deviceRevokeTitle: '移除裝置',
        deviceRevoked: '裝置已移除',
        dialog: {
          modifyPhone: '修改手機號',
          modifyEmail: '修改郵箱',
          step1: '身分驗證',
          step2: '輸入新{type}',
          step3: '驗證新{type}',
          verifyPassword: '密碼驗證',
          verifyCode: '驗證碼驗證',
          currentPassword: '目前帳號密碼',
          currentPasswordPlaceholder: '請輸入目前帳號密碼',
          sendCodeToCurrent: '向目前{type}發送驗證碼',
          getCode: '獲取驗證碼',
          resendIn: '{n}s 後重發',
          codePlaceholder: '請輸入 6 位驗證碼',
          newValueLabel: '新{type}',
          newValuePlaceholder: '請輸入新{type}',
          sendCodeToNew: '向新{type}發送驗證碼',
          submit: '確認修改',
          next: '下一步',
          prev: '上一步',
          success: '聯繫方式修改成功',
          passwordError: '密碼不能為空',
          codeError: '驗證碼錯誤，請輸入 6 位數字',
          phoneFormat: '請輸入正確的手機號',
          emailFormat: '請輸入正確的郵箱',
          typePhone: '手機號',
          typeEmail: '郵箱',
          verifyCodeSent: '驗證碼已發送至目前{type}',
          newCodeSent: '驗證碼已發送至新{type}'
        }
      },
      notifications: {
        title: '通知偏好',
        desc: '選擇你想接收的通知類型，我們不會打擾你的寧靜。',
        save: '儲存設定',
        saveSuccess: '通知偏好已更新',
        items: {
          booking: '諮詢預約提醒',
          assessment: '測評結果通知',
          comment: '心得評論通知',
          activity: '活動推送',
          marketing: '營銷郵件'
        },
        hints: {
          booking: '諮詢前 24 小時及開始時提醒',
          assessment: '測評報告生成後通知',
          comment: '他人評論你的心得時通知',
          activity: '平台活動與講座資訊',
          marketing: '產品更新與優惠資訊'
        }
      },
      privacy: {
        title: '隱私設定',
        desc: '控制誰可以看到你的資訊，以及如何被他人發現。',
        visibility: '個人主頁可見範圍',
        visibilityPublic: '所有人',
        visibilityFriends: '僅好友',
        visibilityPrivate: '僅自己',
        searchable: '允許被搜尋',
        showProfile: '展示心理檔案',
        save: '儲存設定',
        saveSuccess: '隱私設定已更新'
      },
      preferences: {
        title: '偏好設定',
        desc: '個性化你的使用體驗，語言、主題與預設首頁。',
        language: '界面語言',
        theme: '顯示主題',
        defaultHome: '預設首頁',
        homePage: '首頁',
        assessmentPage: '測評中心',
        articlesPage: '文章資訊',
        zhCN: '簡體中文',
        zhTW: '繁體中文',
        enUS: 'English',
        languageChanged: '語言已切換',
        themeChanged: '主題已切換',
        themeAutoHint: '已跟隨系統',
        themeActualLight: '目前淺色',
        themeActualDark: '目前深色'
      },
      data: {
        title: '資料管理',
        desc: '管理你的資料，匯出或清除平台快取。',
        exportData: '匯出我的資料',
        exportBtn: '匯出資料',
        exportSuccess: '資料匯出請求已提交',
        clearCache: '清除本地快取',
        clearBtn: '清除快取',
        clearConfirm: '確定要清除本地快取嗎？這將移除臨時檔案，不影響你的帳號資料。',
        clearSuccess: '本地快取已清除',
        dateRange: '日期範圍',
        dataTypes: '資料類型',
        typeAssessment: '測評記錄',
        typeCounseling: '諮詢記錄',
        typeActivity: '活動資料',
        typeProfile: '個人資料',
        cacheTypes: '快取類別',
        cacheTemp: '臨時檔案',
        cacheHistory: '瀏覽歷史',
        cacheAssessment: '測評快取',
        cacheForm: '表單資料',
        selectAtLeastOne: '請至少選擇一項',
        exportDesc: '選擇要匯出的資料類型與日期範圍',
        clearCacheDesc: '選擇要清除的快取類別，操作不可恢復',
        startDate: '開始日期',
        endDate: '結束日期'
      }
    }
  },
  login: {
    header: {
      badge: '歡迎登入',
      title: '開啟成長之旅',
      desc: '登入您的帳號，探索專屬成長路徑',
      registerBadge: '加入我們',
      registerTitle: '建立帳號',
      registerDesc: '註冊您的帳戶，開始探索之旅',
      forgotBadge: '安全驗證',
      forgotTitle: '重設密碼',
      forgotDesc: '驗證身份後即可設定新密碼'
    },
    tabs: { account: '帳號密碼', phone: '手機號', email: '郵箱' },
    form: {
      schoolPlaceholder: '請選擇學校',
      userIdPlaceholder: '請輸入學號',
      passwordPlaceholder: '請輸入密碼',
      captchaPlaceholder: '請輸入驗證碼',
      phonePlaceholder: '請輸入手機號',
      emailPlaceholder: '請輸入郵箱',
      codePlaceholder: '請輸入驗證碼',
      remember: '保存登入資訊',
      forgotPassword: '忘記密碼？',
      getCode: '獲取驗證碼',
      codeResend: '{n}s後重發',
      accountBtn: '立即登入',
      phoneBtn: '手機登入',
      emailBtn: '郵箱登入',
      schoolRequired: '請選擇學校',
      userIdRequired: '請輸入學號',
      userIdLength: '學號長度為1-20個字元',
      passwordRequired: '請輸入密碼',
      passwordLength: '密碼長度為6-20個字元',
      captchaRequired: '請輸入驗證碼',
      captchaLength: '驗證碼為4位字元',
      captchaError: '驗證碼錯誤',
      phoneRequired: '請輸入手機號',
      phoneFormat: '請輸入正確的手機號碼',
      codeRequired: '請輸入驗證碼',
      codeFormat: '驗證碼為6位數字',
      emailRequired: '請輸入郵箱',
      emailFormat: '請輸入正確的郵箱格式',
      codeSent: '驗證碼已發送',
      codeSendFail: '驗證碼發送失敗',
      codeSendRetry: '驗證碼發送失敗，請稍後重試',
      validateFail: '表單驗證失敗',
      loginFail: '登入失敗'
    },
    social: { text: '其他登入方式', wechat: '微信登入', qq: 'QQ登入' },
    register: { prompt: '還沒有帳號？', btn: '立即註冊' }
  },
  notFound: {
    nav: {
      home: '首頁',
      career: '職業探索',
      treehole: '心理樹洞',
      about: '關於我們'
    },
    hero: {
      number: '404',
      title: '迷途驛站',
      quote: '此路尚未開通，但每條岔路都藏著新的可能。在這裡，迷路不是終點，而是探索的開始。',
      issue: '生涯心旅 · 特別專題',
      volume: '2026 夏季刊',
      page: '01',
      scroll: '繼續翻閱'
    },
    topics: {
      label: '專題',
      title: '選擇你的下一站',
      explore: '探索此專題',
      items: [
        { no: '01', en: 'COMFORT ZONE', zh: '溫暖小屋', desc: '在熟悉的空間裡，給自己一段安靜的時光，與內心對話。' },
        { no: '02', en: 'SKILL UNLOCK', zh: '技能之門', desc: '每一次學習，都是打開新世界的鑰匙。你比你想象的更強大。' },
        { no: '03', en: 'UNKNOWN PATH', zh: '迷霧小徑', desc: '未知的路上，藏著最美的風景。勇敢邁出那一步。' }
      ]
    },
    quote: {
      text: '你並不孤單。在生涯心旅，每一次迷路都是探索的開始，每一次停留都是為了更好地出發。',
      author: '— 生涯心旅編輯部'
    },
    community: {
      label: 'Community',
      title: '此刻迷路的人',
      subtitle: '{n} 人曾在這裡停留，留下他們的故事與心情',
      writeLabel: 'Write to us',
      writePlaceholder: '寫下你的故事…',
      empty: '說點什麼吧',
      hug: '擁抱',
      share: '分享',
      featured: '精選'
    },
    footer: {
      slogan: '每一次迷路，都是探索的開始',
      hotline: '求助熱線',
      copyright: '© 2026 生涯心旅 · 迷途驛站特別專題'
    }
  }
}
