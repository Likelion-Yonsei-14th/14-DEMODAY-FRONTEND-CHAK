import { useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { DISCOUNTS, DISCOUNTS_UPDATED, DISCOUNT_CATEGORIES } from './discountData'
import { periodLabel, seoulToday, sourceHost, timingOf, visibleDiscounts } from './discounts'
import './discounts.css'

const AREAS = ['서울', '경기', '인천', '강원', '대전', '충남', '부산', '경남', '전남'] as const

/** 수능 끝나고 수험표로 받을 수 있는 혜택 모음. 출처가 확인된 것만 싣고, 끝난 혜택은 저절로 빠진다. */
export function DiscountsPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<string | null>(null)
  const [area, setArea] = useState<string | null>(null)
  const today = seoulToday()
  const list = useMemo(() => visibleDiscounts(DISCOUNTS, today, { category, area }), [today, category, area])

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
          <p>
            2027학년도 수능 수험생 혜택을 모았어요. {Number(DISCOUNTS_UPDATED.slice(5, 7))}월 {Number(DISCOUNTS_UPDATED.slice(8, 10))}일
            기준이고, 업체 사정으로 바뀔 수 있으니 가기 전에 출처에서 한 번 더 확인해 주세요.
          </p>
        </header>

        <div className="discounts__filters">
          <div role="group" aria-label="종류">
            <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>
              전체
            </button>
            {DISCOUNT_CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)}>
                {c}
              </button>
            ))}
          </div>
          <div role="group" aria-label="지역">
            <button type="button" aria-pressed={area === null} onClick={() => setArea(null)}>
              모든 지역
            </button>
            {AREAS.map((a) => (
              <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <p className="discounts__count">{list.length}개</p>
        <ul className="discounts__list">
          {list.map((d) => {
            const soon = timingOf(d, today) === 'soon'
            return (
              <li key={`${d.brand}-${d.benefit}`} className="discount">
                <div className="discount__top">
                  <span className="discount__category">{d.category}</span>
                  <span className={soon ? 'discount__period is-soon' : 'discount__period'}>{periodLabel(d)}</span>
                </div>
                <h2>{d.brand}</h2>
                <p className="discount__benefit">{d.benefit}</p>
                {d.conditions && <p className="discount__conditions">{d.conditions}</p>}
                <div className="discount__bottom">
                  <span>{d.place || '전국'}</span>
                  <a href={d.sourceUrl} target="_blank" rel="noreferrer noopener">
                    {sourceHost(d.sourceUrl)} <ExternalLink size={12} aria-hidden />
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
        {list.length === 0 && <p className="discounts__empty">이 조건에 맞는 혜택이 아직 없어요.</p>}

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
