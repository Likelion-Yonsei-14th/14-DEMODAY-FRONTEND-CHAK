import { useMemo } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronRight,
  Gift,
  Heart,
  Share2,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { mergeSupportMessages } from '@/features/supporter/seededMessages'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './WrappedPages.css'

const wrappedSummary = {
  days: 73,
  people: 26,
  messages: 183,
  photos: 31,
}

const revealedNames = [
  '민지',
  '수빈',
  '현우',
  '유나',
  '준',
  '서연',
]

const offers = [
  {
    id: 'cafe',
    category: '카페',
    title: '수험생 음료 20% 할인',
    partner: '제휴 카페 · 신촌권',
    period: '11월 19일 – 11월 30일',
    condition: '수험표 또는 수험생 확인 화면 제시',
    description:
      '수능이 끝난 뒤 친구들과 쉬어갈 수 있도록 준비한 음료 혜택이에요.',
  },
  {
    id: 'photo',
    category: '사진',
    title: '우정사진 촬영 할인',
    partner: '제휴 사진관',
    period: '11월 19일 – 12월 15일',
    condition: '2인 이상 방문 · 사전 예약',
    description:
      '고생한 시간을 친구들과 사진으로 남길 수 있는 수험생 전용 혜택이에요.',
  },
  {
    id: 'culture',
    category: '문화',
    title: '전시·공연 티켓 할인',
    partner: '제휴 문화공간',
    period: '11월 20일 – 12월 31일',
    condition: '본인 수험표 확인',
    description:
      '시험이 끝난 뒤 새로운 시간을 즐길 수 있도록 준비한 문화 혜택이에요.',
  },
]

function WrappedBack({
  to,
  label,
}: {
  to: string
  label: string
}) {
  const navigate = useNavigate()
  return (
    <IconButton
      label={label}
      icon={<ArrowLeft size={21} aria-hidden />}
      onClick={() => navigate(to)}
    />
  )
}

export function WrappedHomePage() {
  const navigate = useNavigate()

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/wrapped/intro')}
        >
          내 응원 기록 보기
        </Button>
      }
    >
      <main className="wrapped-home">
        <span className="wrapped-home__mark" aria-hidden>
          <Heart size={27} />
        </span>
        <p className="wrapped-home__eyebrow">2027학년도 수능</p>
        <h1>
          정말
          <br />
          수고했어요.
        </h1>
        <p>
          수능을 기다리는 동안 친구들이 남긴 마음을
          한 번 천천히 돌아볼까요?
        </p>
      </main>
    </AppShell>
  )
}

export function WrappedIntroPage() {
  const navigate = useNavigate()

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="나의 응원 기록"
          leading={
            <WrappedBack
              to="/prototype/wrapped"
              label="이전으로"
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/wrapped/insight')}
        >
          어떤 마음들이 모였는지 보기
        </Button>
      }
    >
      <main className="wrapped-page">
        <section className="wrapped-page__heading">
          <p>수능을 기다린 시간 동안</p>
          <h1>
            이렇게 많은 마음이
            <br />
            곁에 있었어요.
          </h1>
        </section>

        <div className="wrapped-stats wrapped-stats--hero">
          <WrappedStat
            icon={<CalendarDays size={19} />}
            value={wrappedSummary.days}
            unit="일"
            label="응원을 모은 시간"
          />
          <WrappedStat
            icon={<UsersRound size={19} />}
            value={wrappedSummary.people}
            unit="명"
            label="마음을 남긴 친구"
          />
          <WrappedStat
            icon={<Heart size={19} />}
            value={wrappedSummary.messages}
            unit="개"
            label="도착한 응원"
          />
        </div>
      </main>
    </AppShell>
  )
}

export function WrappedInsightPage() {
  const navigate = useNavigate()

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="응원 속 마음"
          leading={
            <WrappedBack
              to="/prototype/wrapped/intro"
              label="이전으로"
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/wrapped/friends')}
        >
          함께한 친구들 보기
        </Button>
      }
    >
      <main className="wrapped-page">
        <section className="wrapped-page__heading">
          <span className="wrapped-page__sparkle" aria-hidden>
            <Sparkles size={20} />
          </span>
          <h1>
            친구들은 이런 마음을
            <br />
            가장 많이 전했어요.
          </h1>
        </section>

        <section className="wrapped-insight-card wrapped-insight-card--main">
          <span>가장 많이 담긴 마음</span>
          <strong>“잘해야 해”보다 “이미 잘하고 있어”</strong>
          <p>
            결과를 재촉하기보다 지금까지 버틴 시간을 알아봐주는 응원이 가장 많았어요.
          </p>
        </section>

        <div className="wrapped-keywords" aria-label="응원 키워드">
          <span>끝까지</span>
          <span>괜찮아</span>
          <span>같이</span>
          <span>수고했어</span>
          <span>끝나고 놀자</span>
        </div>

        <section className="wrapped-quote">
          <span>대표 문장</span>
          <blockquote>
            “여기까지 온 것만으로도 정말 대단해.”
          </blockquote>
        </section>
      </main>
    </AppShell>
  )
}

export function WrappedFriendsPage() {
  const navigate = useNavigate()

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="함께한 친구들"
          leading={
            <WrappedBack
              to="/prototype/wrapped/insight"
              label="이전으로"
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/wrapped/records')}
        >
          전체 기록 보기
        </Button>
      }
    >
      <main className="wrapped-page">
        <section className="wrapped-page__heading">
          <h1>
            이름을 남겨도 좋다고 한
            <br />
            친구들이에요.
          </h1>
          <p>공개에 동의한 친구의 이름만 보여줘요.</p>
        </section>

        <div className="wrapped-friends">
          {revealedNames.map((name, index) => (
            <div
              className="wrapped-friend"
              key={name}
              style={{
                '--friend-rotation':
                  `${[-2, 1.5, -.6, 2, -1.2, .8][index] ?? 0}deg`,
              } as React.CSSProperties}
            >
              <span>{name.slice(0, 1)}</span>
              <strong>{name}</strong>
            </div>
          ))}
        </div>

        <p className="wrapped-friends__rest">
          그리고 이름을 공개하지 않은 친구들의 마음도
          이 기록 안에 함께 있어요.
        </p>
      </main>
    </AppShell>
  )
}

export function WrappedRecordsPage() {
  const navigate = useNavigate()
  const storedMessages = usePrototypeStore((state) => state.messages)
  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="전체 기록"
          leading={
            <WrappedBack
              to="/prototype/wrapped/friends"
              label="이전으로"
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/wrapped/share')}
        >
          내 기록 한 장으로 보기
        </Button>
      }
    >
      <main className="wrapped-page">
        <section className="wrapped-page__heading">
          <h1>숫자로 남은 것도, 마음으로 남은 것도.</h1>
          <p>누가 더 많이 받았는지 비교하지 않고 내 기록만 보여줘요.</p>
        </section>

        <div className="wrapped-record-grid">
          <WrappedStat
            icon={<Heart size={18} />}
            value={wrappedSummary.messages}
            unit="개"
            label="응원"
          />
          <WrappedStat
            icon={<UsersRound size={18} />}
            value={wrappedSummary.people}
            unit="명"
            label="친구"
          />
          <WrappedStat
            icon={<Camera size={18} />}
            value={wrappedSummary.photos}
            unit="장"
            label="사진"
          />
          <WrappedStat
            icon={<CalendarDays size={18} />}
            value={wrappedSummary.days}
            unit="일"
            label="함께한 시간"
          />
        </div>

        <section className="wrapped-record-list">
          <h2>기억하고 싶은 응원</h2>
          {messages.slice(0, 4).map((message) => (
            <article key={message.id}>
              <span>{message.senderName}</span>
              <p>
                {message.textElements[0]?.text ??
                  '마음이 담긴 응원이 도착했어요.'}
              </p>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  )
}

export function WrappedSharePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()

  const share = async () => {
    const text =
      `73일 동안 26명의 친구에게 183개의 응원을 받았어요. 수능까지 함께해준 마음을 기록으로 남겼어요.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: '나의 수능 응원 기록',
          text,
        })
        return
      }

      await navigator.clipboard.writeText(text)
      showToast('공유할 내용을 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="공유하기"
          leading={
            <WrappedBack
              to="/prototype/wrapped/records"
              label="이전으로"
            />
          }
        />
      }
    >
      <main className="wrapped-page wrapped-share-page">
        <section className="wrapped-share-card" aria-label="공유 이미지 미리보기">
          <span className="wrapped-share-card__eyebrow">
            MY CSAT SUPPORT RECORD
          </span>
          <h1>
            73일 동안
            <br />
            183개의 마음과 함께했어요.
          </h1>
          <div className="wrapped-share-card__numbers">
            <span><strong>26</strong>친구</span>
            <span><strong>31</strong>사진</span>
            <span><strong>73</strong>일</span>
          </div>
          <p>원문 메시지 없이 집계된 기록만 공유돼요.</p>
        </section>

        <Button
          variant="brand"
          fullWidth
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={share}
        >
          이 기록 공유하기
        </Button>

        <button
          type="button"
          className="wrapped-share-page__offers"
          onClick={() => navigate('/prototype/offers')}
        >
          <Gift size={17} aria-hidden />
          <span>
            <strong>이제 진짜 끝!</strong>
            올해 고생한 수험생 혜택 보기
          </span>
          <ChevronRight size={18} aria-hidden />
        </button>
      </main>
    </AppShell>
  )
}

export function OffersPage() {
  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="수험생 혜택"
          leading={
            <WrappedBack
              to="/prototype/wrapped/share"
              label="응원 기록으로 돌아가기"
            />
          }
        />
      }
    >
      <main className="offers-page">
        <section className="wrapped-page__heading">
          <p>올해 정말 고생했으니까</p>
          <h1>수험생을 위한 혜택을 모았어요.</h1>
        </section>

        <div className="offers-categories">
          <span>전체</span>
          <span>카페</span>
          <span>사진</span>
          <span>문화</span>
        </div>

        <div className="offers-list">
          {offers.map((offer) => (
            <Link
              className="offer-card"
              to={`/prototype/offers/${offer.id}`}
              key={offer.id}
            >
              <span className="offer-card__category">
                {offer.category}
              </span>
              <strong>{offer.title}</strong>
              <p>{offer.partner}</p>
              <span className="offer-card__period">
                {offer.period}
              </span>
              <ChevronRight size={19} aria-hidden />
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  )
}

export function OfferDetailPage() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const offer = offers.find((item) => item.id === offerId)

  if (!offer) {
    return <Navigate to="/prototype/offers" replace />
  }

  return (
    <AppShell
      surface="base"
      contentClassName="wrapped-shell"
      appBar={
        <AppBar
          title="혜택 상세"
          leading={
            <WrappedBack
              to="/prototype/offers"
              label="혜택 목록으로 돌아가기"
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() =>
            showToast('제휴처에서 보여줄 수험생 확인 화면을 열었어요.')
          }
        >
          혜택 사용하기
        </Button>
      }
    >
      <main className="offer-detail">
        <span className="offer-detail__category">
          {offer.category}
        </span>
        <h1>{offer.title}</h1>
        <p className="offer-detail__partner">{offer.partner}</p>

        <section className="offer-detail__hero">
          <Gift size={28} aria-hidden />
        </section>

        <section className="offer-detail__info">
          <div>
            <span>사용 기간</span>
            <strong>{offer.period}</strong>
          </div>
          <div>
            <span>사용 조건</span>
            <strong>{offer.condition}</strong>
          </div>
        </section>

        <p className="offer-detail__description">
          {offer.description}
        </p>

        <button
          type="button"
          className="offer-detail__back"
          onClick={() => navigate('/prototype/offers')}
        >
          다른 혜택 더 보기
        </button>
      </main>
    </AppShell>
  )
}

function WrappedStat({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode
  value: number
  unit: string
  label: string
}) {
  return (
    <div className="wrapped-stat">
      <span className="wrapped-stat__icon" aria-hidden>
        {icon}
      </span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <span>{label}</span>
    </div>
  )
}
