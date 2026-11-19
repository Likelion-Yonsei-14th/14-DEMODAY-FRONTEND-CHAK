import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, ExternalLink, LocateFixed, Map as MapIcon, Search, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type DiscountPlacement } from '@/api/discounts'
import { AppBar, IconButton } from '@/design-system'
import { AdBanner } from '@/features/ads/AdBanner'
import { AppShell } from '@/layout/AppShell'
import { DISCOUNT_CATEGORIES, type Discount } from './discountData'
import { DISCOUNT_AREAS, periodLabel, seoulToday, sourceHost, timingOf, urgencyLabel, visibleDiscounts } from './discounts'
import { DISCOUNTS_MAP_PATH } from './discountRoutes'
import { useDiscounts } from './useDiscounts'
import {
  formatKm,
  reportSponsoredClick,
  useMyLocation,
  useSponsoredImpression,
  useSponsoredOrder,
  withSponsoredFirst,
  type SponsoredMeta,
} from './sponsored'
import './discounts.css'

const md = (date: string) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`

/**
 * 혜택 카드 한 장. 어드민의 미리보기도 같은 카드를 쓴다.
 * ad가 있으면 제휴 혜택: '제휴' 표시와 거리를 보여 주고, 화면에 보이면 노출·링크를 누르면 클릭을 센다.
 */
export function DiscountCard({
  d,
  today,
  defaultOpen = false,
  ad,
}: {
  d: Discount
  today: string
  defaultOpen?: boolean
  ad?: SponsoredMeta & { placement: DiscountPlacement }
}) {
  const [open, setOpen] = useState(defaultOpen)
  const cardRef = useRef<HTMLLIElement>(null)
  useSponsoredImpression(cardRef, d.id, ad ? ad.placement : null)
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(d.image) && !imageFailed
  const soon = timingOf(d, today) === 'soon'
  const urgent = urgencyLabel(d, today)
  const hasBring = Boolean(d.bring && d.bring.length > 0)
  const details: [string, string][] = [
    ['챙길 것', hasBring ? d.bring!.join(', ') : ''],
    ['받는 방법', d.howTo ?? ''],
    // 광고주가 정한 항목(참여 조건, 증정, 이용 시간…)은 받는 방법 다음에 적힌 순서대로.
    ...(d.extras ?? []).map((extra): [string, string] => [extra.label, extra.value]),
    ['같이 가면', d.companions ?? ''],
    ['적용 지점', d.branches || d.place || ''],
    ['조건', d.conditions],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <li className={ad ? 'discount is-sponsored' : 'discount'} ref={cardRef}>
      {showImage && (
        // 제휴 매장은 배너 광고와 같은 시안을 대표 이미지로 쓴다. 어드민 미리보기(ad 없음)에서도 같은 비율로 보이게 d.sponsored로 정한다.
        <figure className={d.sponsored ? 'discount__image is-banner' : 'discount__image'}>
          <img
            src={d.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
          {d.imageSource && <figcaption>이미지: {sourceHost(d.imageSource)}</figcaption>}
        </figure>
      )}
      <div className="discount__top">
        <span className="discount__category">
          {ad && <span className="discount__sponsor">제휴</span>}
          {d.category}
        </span>
        <span className="discount__when">
          {urgent && <span className={soon ? 'discount__badge is-soon' : 'discount__badge'}>{urgent}</span>}
          <span className={soon ? 'discount__period is-soon' : 'discount__period'}>{periodLabel(d)}</span>
        </span>
      </div>
      <div className="discount__head">
        <div>
          <h2>{d.brand}</h2>
          <p className="discount__benefit">{d.benefit}</p>
        </div>
        {d.highlight && <strong className="discount__highlight">{d.highlight}</strong>}
      </div>

      {(hasBring || d.howTo) && (
        <ul className="discount__chips" aria-label={hasBring ? '챙길 것' : '받는 방법'}>
          {(d.bring ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {d.howTo && <li className="is-how">{d.howTo}</li>}
        </ul>
      )}

      {details.length > 0 && (
        <button
          type="button"
          className="discount__more"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '접기' : '자세히 보기'} <ChevronDown size={14} aria-hidden />
        </button>
      )}
      {open && (
        <dl className="discount__details">
          {/* 추가 항목은 이름이 겹칠 수 있어(증정 두 줄 등) 순서도 key에 넣는다. */}
          {details.map(([label, value], index) => (
            <div key={`${index}-${label}`}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="discount__bottom">
        <span>
          {ad?.distanceKm != null && <b className="discount__distance">{formatKm(ad.distanceKm)} · </b>}
          {d.address || d.place || '전국'}
        </span>
        <a
          href={d.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          onClick={ad ? () => reportSponsoredClick(d.id, ad.placement) : undefined}
        >
          {sourceHost(d.sourceUrl)}{d.sourceDate ? ` · ${md(d.sourceDate)}` : ''} <ExternalLink size={12} aria-hidden />
        </a>
      </div>
    </li>
  )
}

/** 수능 끝나고 수험표로 받을 수 있는 혜택 모음. 출처가 확인된 것만 싣고, 끝난 혜택은 저절로 빠진다. */
export function DiscountsPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<string | null>(null)
  const [area, setArea] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const today = seoulToday()
  const loaded = useDiscounts()
  const all = loaded?.items
  const location = useMyLocation()
  const order = useSponsoredOrder(location.point)
  // 제휴 혜택은 가까운 곳·덜 본 광고 순으로 맨 위에(서버가 사람마다 정한다). 나머지는 마감이 가까운 순.
  const { items: list, meta } = useMemo(
    () => withSponsoredFirst(visibleDiscounts(all ?? [], today, { category, area, query }), order),
    [all, today, category, area, query, order],
  )
  const hasSponsored = (all ?? []).some((d) => d.sponsored)
  const mappable = (all ?? []).some((d) => d.sponsored && d.latitude !== undefined && d.longitude !== undefined)
  const live = useMemo(() => visibleDiscounts(all ?? [], today, { category: null, area: null }), [all, today])
  const usedCategories = DISCOUNT_CATEGORIES.filter((c) => live.some((d) => d.category === c))
  // 혜택이 있는 지역만 버튼으로 보여 준다(어드민에서 새 지역을 넣으면 저절로 생긴다).
  const usedAreas = DISCOUNT_AREAS.filter((a) => live.some((d) => d.area === a))
  const endingSoon = live.filter((d) => {
    const label = urgencyLabel(d, today)
    return label !== null && timingOf(d, today) === 'ongoing'
  }).length

  return (
    <AppShell
      surface="base"
      contentClassName="discounts-shell"
      appBar={
        <AppBar
          title="수험표 할인 모음"
          leading={
            <IconButton
              label="뒤로 가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            />
          }
        />
      }
    >
      <main className="discounts">
        <header className="discounts__intro">
          <h1>수험표 한 장으로 받는 혜택</h1>
          {loaded ? (
            <p>
              2027학년도 수능 수험생 혜택 {live.length}개를 모았어요{endingSoon > 0 ? ` · 일주일 안에 끝나는 혜택 ${endingSoon}개` : ''}.{' '}
              {md(loaded.updated)} 기준이고, 업체 사정으로 바뀔 수 있으니 가기 전에 출처에서 한 번 더 확인해 주세요.
            </p>
          ) : (
            <p>혜택을 불러오고 있어요...</p>
          )}
        </header>

        {/* 광고 배너는 홈·편지 화면과 같은 모양으로 맨 위에. 등록된 광고가 없으면 아무것도 그리지 않는다. */}
        <AdBanner className="discounts__ad" />

        <section className="discounts__tips" aria-label="챙길 것">
          <strong>가기 전에 챙기세요</strong>
          <ul>
            <li>수험표 <b>원본</b> (사진·캡처는 안 되는 곳이 많아요)</li>
            <li>본인 확인용 <b>신분증</b></li>
            <li>예약이 필요한 곳은 미리 예약하기</li>
          </ul>
        </section>

        {hasSponsored && (
          <div className="discounts__nearby">
            {mappable && (
              <button type="button" className="discounts__map-link" onClick={() => navigate(DISCOUNTS_MAP_PATH)}>
                <MapIcon size={18} aria-hidden />
                <span>
                  <strong>지도에서 제휴 매장 찾기</strong>
                  <small>내 주변 수험생 할인 매장을 지도로 봐요</small>
                </span>
              </button>
            )}
            <button
              type="button"
              className="discounts__locate"
              aria-pressed={location.state === 'ok'}
              disabled={location.state === 'asking'}
              onClick={location.request}
            >
              <LocateFixed size={16} aria-hidden />
              {location.state === 'ok'
                ? '내 주변 제휴 매장부터 보는 중'
                : location.state === 'asking'
                  ? '위치 확인 중...'
                  : '내 주변 제휴 매장부터 보기'}
            </button>
            {location.state === 'denied' && (
              <p className="discounts__locate-note">위치 권한이 꺼져 있어요. 브라우저 설정에서 켜면 가까운 곳부터 보여요.</p>
            )}
            {location.state === 'unavailable' && <p className="discounts__locate-note">지금은 위치를 알 수 없어요.</p>}
          </div>
        )}

        <label className="discounts__search">
          <Search size={17} aria-hidden />
          <input
            type="search"
            placeholder="브랜드나 지역 찾기 (예: 안경, 부산)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="혜택 찾기"
          />
        </label>

        <div className="discounts__filters">
          <div role="group" aria-label="종류">
            <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>
              전체 {live.length}
            </button>
            {usedCategories.map((c) => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)}>
                {c} {live.filter((d) => d.category === c).length}
              </button>
            ))}
          </div>
          <div role="group" aria-label="지역">
            <button type="button" aria-pressed={area === null} onClick={() => setArea(null)}>
              모든 지역
            </button>
            {usedAreas.map((a) => (
              <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {loaded && (
          <p className="discounts__count">
            {list.length}개 · {meta.size > 0 ? '제휴 매장 먼저, 그다음 마감이 가까운 순' : '마감이 가까운 순'}
          </p>
        )}
        <ul className="discounts__list">
          {list.map((d) => (
            <DiscountCard
              key={d.id ?? `${d.brand}-${d.benefit}`}
              d={d}
              today={today}
              ad={d.id !== undefined && meta.has(d.id) ? { ...meta.get(d.id)!, placement: 'LIST' } : undefined}
            />
          ))}
        </ul>
        {loaded && list.length === 0 && <p className="discounts__empty">이 조건에 맞는 혜택이 아직 없어요.</p>}

        <button type="button" className="discounts__partner" onClick={() => navigate('/promotion')}>
          <Store size={18} aria-hidden />
          <span>
            <strong>우리 매장 혜택도 올리고 싶다면</strong>
            <small>수능 착에 수험생 혜택을 알려 주세요</small>
          </span>
        </button>
      </main>
    </AppShell>
  )
}
