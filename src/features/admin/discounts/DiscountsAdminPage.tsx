import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createAdminDiscount,
  deleteAdminDiscount,
  fetchAdminDiscounts,
  toDiscount,
  updateAdminDiscount,
  type ApiDiscount,
  type DiscountInput,
} from '@/api/discounts'
import { DISCOUNT_CATEGORIES } from '@/features/discounts/discountData'
import { DISCOUNT_AREAS, periodLabel, seoulToday, timingOf } from '@/features/discounts/discounts'
import { DiscountCard } from '@/features/discounts/DiscountsPage'
import { downloadDataUrl } from '../ads/adPreviewImage'
import { formatDateTime } from '../adminFormat'
import '@/features/discounts/discounts.css'
import '../ads/adsAdmin.css'
import './discountsAdmin.css'

const HOW_TO = ['현장', '사전 예약', '앱·온라인', '전화 예약'] as const

type Form = {
  brand: string
  category: string
  benefit: string
  highlight: string
  start: string
  end: string
  area: string
  place: string
  branches: string
  howTo: string
  /** 한 줄에 하나씩 */
  bring: string
  companions: string
  conditions: string
  sourceUrl: string
  sourceDate: string
  image: string
  imageSource: string
  visible: boolean
}

const EMPTY_FORM = (): Form => ({
  brand: '',
  category: DISCOUNT_CATEGORIES[0],
  benefit: '',
  highlight: '',
  start: '',
  end: '',
  area: '전국',
  place: '',
  branches: '',
  howTo: '',
  bring: '2027학년도 수험표 원본\n신분증',
  companions: '',
  conditions: '',
  sourceUrl: '',
  sourceDate: seoulToday(),
  image: '',
  imageSource: '',
  visible: true,
})

const fromApi = (d: ApiDiscount): Form => ({
  brand: d.brand,
  category: d.category,
  benefit: d.benefit,
  highlight: d.highlight ?? '',
  start: d.start ?? '',
  end: d.end ?? '',
  area: d.area,
  place: d.place ?? '',
  branches: d.branches ?? '',
  howTo: d.howTo ?? '',
  bring: d.bring.join('\n'),
  companions: d.companions ?? '',
  conditions: d.conditions ?? '',
  sourceUrl: d.sourceUrl,
  sourceDate: d.sourceDate ?? '',
  image: d.image ?? '',
  imageSource: d.imageSource ?? '',
  visible: d.visible,
})

const orNull = (value: string) => (value.trim() ? value.trim() : null)

function toInput(form: Form): DiscountInput {
  return {
    brand: form.brand.trim(),
    category: form.category,
    benefit: form.benefit.trim(),
    highlight: orNull(form.highlight),
    start: orNull(form.start),
    end: orNull(form.end),
    area: form.area,
    place: orNull(form.place),
    branches: orNull(form.branches),
    howTo: orNull(form.howTo),
    bring: form.bring.split('\n').map((line) => line.trim()).filter(Boolean),
    companions: orNull(form.companions),
    conditions: orNull(form.conditions),
    sourceUrl: form.sourceUrl.trim(),
    sourceDate: orNull(form.sourceDate),
    image: orNull(form.image),
    imageSource: orNull(form.imageSource),
    visible: form.visible,
  }
}

/** 저장 전에 화면에서 먼저 막는 것. 서버도 같은 것을 다시 확인한다. */
function problemOf(input: DiscountInput): string | null {
  if (!input.brand || !input.benefit) return '브랜드와 혜택을 넣어 주세요.'
  if (!/^https?:\/\//.test(input.sourceUrl)) return '출처 주소(https://...)를 넣어 주세요. 출처가 확인된 혜택만 올려요.'
  if (input.start && input.end && input.start > input.end) return '시작일이 마지막 날보다 늦어요.'
  if (input.image && !/^https?:\/\//.test(input.image)) return '이미지 주소는 https://로 시작해야 해요.'
  return null
}

type StatusFilter = 'all' | 'shown' | 'hidden' | 'ended'

const TIMING_LABEL = { ongoing: '진행 중', soon: '시작 전', ended: '끝남' } as const

/** 어드민 > 혜택함 관리: 수험표 할인 모음의 혜택을 올리고, 고치고, 숨기고, 지운다. */
export function DiscountsAdminPage() {
  const [items, setItems] = useState<ApiDiscount[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const today = seoulToday()

  const load = useCallback(() => {
    fetchAdminDiscounts()
      .then((list) => {
        setItems(list)
        setLoaded(true)
        setError(null)
      })
      .catch(() => setError('혜택을 불러오지 못했어요.'))
  }, [])

  useEffect(() => load(), [load])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }))

  const lastUpdated = items.reduce<string | null>((max, d) => (!max || d.updatedAt > max ? d.updatedAt : max), null)
  const counts = useMemo(() => {
    const shown = items.filter((d) => d.visible && timingOf(toDiscount(d), today) !== 'ended').length
    return { shown, hidden: items.filter((d) => !d.visible).length, ended: items.filter((d) => timingOf(toDiscount(d), today) === 'ended').length }
  }, [items, today])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((d) => {
        const timing = timingOf(toDiscount(d), today)
        if (statusFilter === 'shown') return d.visible && timing !== 'ended'
        if (statusFilter === 'hidden') return !d.visible
        if (statusFilter === 'ended') return timing === 'ended'
        return true
      })
      .filter((d) => !q || [d.brand, d.benefit, d.place ?? '', d.area, d.category].some((t) => t.toLowerCase().includes(q)))
  }, [items, query, statusFilter, today])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input = toInput(form)
    const problem = problemOf(input)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      if (editingId === null) {
        const created = await createAdminDiscount(input)
        setItems((current) => [created, ...current])
        setNotice(`'${created.brand}' 혜택을 올렸어요.`)
      } else {
        const updated = await updateAdminDiscount(editingId, input)
        setItems((current) => [updated, ...current.filter((d) => d.id !== updated.id)])
        setNotice(`'${updated.brand}' 혜택을 고쳤어요.`)
      }
      setEditingId(null)
      setForm(EMPTY_FORM())
      setError(null)
    } catch {
      setError('저장하지 못했어요. 주소와 날짜를 확인하고 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const edit = (d: ApiDiscount) => {
    setEditingId(d.id)
    setForm(fromApi(d))
    setNotice(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setVisible = async (d: ApiDiscount, visible: boolean) => {
    setBusy(true)
    try {
      const updated = await updateAdminDiscount(d.id, { ...toInput(fromApi(d)), visible })
      setItems((current) => [updated, ...current.filter((item) => item.id !== updated.id)])
      setNotice(visible ? `'${d.brand}'을(를) 다시 보이게 했어요.` : `'${d.brand}'을(를) 숨겼어요. 사용자 목록에서 빠져요.`)
      setError(null)
    } catch {
      setError('바꾸지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (d: ApiDiscount) => {
    if (!window.confirm(`'${d.brand}' 혜택을 지울까요? 되돌릴 수 없어요.\n잠시 내리기만 하려면 '숨기기'를 쓰세요.`)) return
    setBusy(true)
    try {
      await deleteAdminDiscount(d.id)
      setItems((current) => current.filter((item) => item.id !== d.id))
      if (editingId === d.id) {
        setEditingId(null)
        setForm(EMPTY_FORM())
      }
      setNotice(`'${d.brand}' 혜택을 지웠어요.`)
      setError(null)
    } catch {
      setError('지우지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const previewInput = toInput(form)
  const preview = toDiscount({ ...previewInput, id: editingId ?? 0, updatedByName: null, updatedAt: '' })

  return (
    <>
      <header className="admin__header">
        <h1>혜택함 관리</h1>
        <p className="admin__muted">
          수험표 할인 모음에 보이는 혜택이에요. 고치면 바로 사용자 화면에 반영돼요(최대 1분).
          {lastUpdated && ` 사용자 화면에는 마지막으로 고친 날(${formatDateTime(lastUpdated)})이 '기준'으로 보여요.`}
        </p>
      </header>
      {error && <p className="admin__error">{error}</p>}
      {notice && !error && <p className="admin__muted">{notice}</p>}

      <section className="admin__panel">
        <h2>{editingId === null ? '새 혜택' : `혜택 고치기 #${editingId}`}</h2>
        <div className="ads-editor discounts-editor">
          <form className="ads-form discounts-form" onSubmit={submit}>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>브랜드 · 시설</span>
                <input value={form.brand} maxLength={100} onChange={(e) => set('brand', e.target.value)} />
              </label>
              <label className="admin-field">
                <span>종류</span>
                <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {DISCOUNT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="admin-field">
              <span>혜택 (한 문장)</span>
              <input
                value={form.benefit}
                maxLength={200}
                placeholder="수험생 이용권 2만원, 동반 최대 3명 1인 3만원"
                onChange={(e) => set('benefit', e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>크게 보여 줄 한마디 (선택, 예: 2만원 · 50%)</span>
              <input value={form.highlight} maxLength={30} onChange={(e) => set('highlight', e.target.value)} />
            </label>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>시작일 (비우면 이미 진행 중)</span>
                <input type="date" value={form.start} onChange={(e) => set('start', e.target.value)} />
              </label>
              <label className="admin-field">
                <span>마지막 날 (비우면 모름)</span>
                <input type="date" value={form.end} onChange={(e) => set('end', e.target.value)} />
              </label>
            </div>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>지역 (걸러 보기용)</span>
                <select value={form.area} onChange={(e) => set('area', e.target.value)}>
                  <option value="전국">전국</option>
                  {DISCOUNT_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>자세한 위치 (예: 경기 용인)</span>
                <input value={form.place} maxLength={100} onChange={(e) => set('place', e.target.value)} />
              </label>
            </div>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>적용 지점</span>
                <input
                  value={form.branches}
                  maxLength={200}
                  placeholder="전국 매장(일부 제외)"
                  onChange={(e) => set('branches', e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>받는 방법</span>
                <select value={form.howTo} onChange={(e) => set('howTo', e.target.value)}>
                  <option value="">(없음)</option>
                  {HOW_TO.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="admin-field">
              <span>챙길 것 (한 줄에 하나씩)</span>
              <textarea rows={3} value={form.bring} onChange={(e) => set('bring', e.target.value)} />
            </label>
            <label className="admin-field">
              <span>같이 가면 (선택)</span>
              <input
                value={form.companions}
                maxLength={200}
                placeholder="동반 3명까지 같은 가격"
                onChange={(e) => set('companions', e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>조건 (선택)</span>
              <textarea rows={2} maxLength={1000} value={form.conditions} onChange={(e) => set('conditions', e.target.value)} />
            </label>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>출처 주소 (기사 · 공식 공지)</span>
                <input placeholder="https://" maxLength={500} value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} />
              </label>
              <label className="admin-field">
                <span>출처가 올라온 날</span>
                <input type="date" value={form.sourceDate} onChange={(e) => set('sourceDate', e.target.value)} />
              </label>
            </div>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>대표 이미지 주소 (공식 페이지의 이미지만)</span>
                <input placeholder="https://" maxLength={500} value={form.image} onChange={(e) => set('image', e.target.value)} />
              </label>
              <label className="admin-field">
                <span>이미지를 가져온 페이지</span>
                <input placeholder="https://" maxLength={500} value={form.imageSource} onChange={(e) => set('imageSource', e.target.value)} />
              </label>
            </div>
            <label className="admin-check">
              <input type="checkbox" checked={form.visible} onChange={(e) => set('visible', e.target.checked)} />
              <span>사용자에게 보이기 (끄면 지우지 않고 목록에서만 내려요)</span>
            </label>
            <div className="admin-actions">
              <button type="submit" className="ads-btn ads-btn--primary" disabled={busy}>
                {editingId === null ? '혜택 올리기' : '고친 내용 저장'}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  className="ads-btn"
                  onClick={() => {
                    setEditingId(null)
                    setForm(EMPTY_FORM())
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </form>

          <div>
            <h3 className="ads-editor__title">미리보기</h3>
            <DiscountPreview discount={preview} today={today} name={form.brand} />
          </div>
        </div>
      </section>

      <section className="admin__panel discounts-admin__list">
        <div className="discounts-admin__toolbar">
          <div className="ads-regions" role="group" aria-label="상태">
            {(
              [
                ['all', `전체 ${items.length}`],
                ['shown', `보이는 중 ${counts.shown}`],
                ['hidden', `숨김 ${counts.hidden}`],
                ['ended', `끝남 ${counts.ended}`],
              ] as const
            ).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="discounts-admin__search"
            placeholder="브랜드 · 지역 찾기"
            aria-label="혜택 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>혜택</th><th>기간</th><th>지역</th><th>상태</th><th>마지막 수정</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const timing = timingOf(toDiscount(d), today)
                return (
                  <tr key={d.id} className={d.visible ? undefined : 'discounts-admin__hidden'}>
                    <td>
                      <strong>{d.brand}</strong>
                      <span className="admin__muted"> · {d.category}</span>
                      <br />
                      {d.benefit}
                    </td>
                    <td>{periodLabel(toDiscount(d))}</td>
                    <td>{d.place || d.area}</td>
                    <td>
                      <span className={`admin-badge${d.visible && timing !== 'ended' ? ' ads-badge--live' : ' admin-badge--muted'}`}>
                        {!d.visible ? '숨김' : TIMING_LABEL[timing]}
                      </span>
                    </td>
                    <td className="admin__muted">
                      {formatDateTime(d.updatedAt)}
                      {d.updatedByName && <><br />{d.updatedByName}</>}
                    </td>
                    <td>
                      <span className="admin-actions">
                        <button type="button" className="ads-btn" disabled={busy} onClick={() => edit(d)}>
                          고치기
                        </button>
                        <button type="button" className="ads-btn" disabled={busy} onClick={() => setVisible(d, !d.visible)}>
                          {d.visible ? '숨기기' : '보이기'}
                        </button>
                        <button type="button" className="ads-btn discounts-admin__delete" disabled={busy} onClick={() => remove(d)}>
                          지우기
                        </button>
                      </span>
                    </td>
                  </tr>
                )
              })}
              {loaded && rows.length === 0 && (
                <tr><td colSpan={6} className="admin__muted">해당하는 혜택이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

/** 사용자 화면의 카드와 같은 모양으로 보여 주고, 그대로 이미지로 저장한다. */
function DiscountPreview({ discount, today, name }: { discount: ReturnType<typeof toDiscount>; today: string; name: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [withoutImage, setWithoutImage] = useState(false)
  const shown = withoutImage ? { ...discount, image: undefined, imageSource: undefined } : discount
  const timing = timingOf(discount, today)

  const save = async () => {
    const node = frameRef.current
    if (!node) return
    setSaving(true)
    setSaveError(null)
    try {
      const [{ toPng }, { buildFontEmbedCSS }] = await Promise.all([
        import('html-to-image'),
        import('@/features/ads/captureFonts'),
      ])
      const [fontEmbedCSS, imageReadable] = await Promise.all([
        buildFontEmbedCSS().catch(() => ''),
        // 다른 사이트 이미지는 보안 정책(CORS·connect-src) 때문에 못 가져오는 일이 많다. 빈 칸으로 남기지 않고 빼고 그린다.
        discount.image
          ? fetch(discount.image)
              .then((res) => res.ok)
              .catch(() => false)
          : Promise.resolve(true),
      ])
      if (!imageReadable) {
        // 그리는 동안만 이미지 없는 카드로 바꿔 둔다(복제본에서 빼면 원래 자리 크기가 남아 깨진다).
        setWithoutImage(true)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        fontEmbedCSS,
        backgroundColor: getComputedStyle(node).backgroundColor,
      })
      const fileName = `혜택함-${(name || '혜택').replace(/[\\/:*?"<>|]/g, '').slice(0, 30)}.png`
      downloadDataUrl(dataUrl, fileName)
    } catch {
      setSaveError('이미지를 만들지 못했어요. 다시 눌러 주세요.')
    } finally {
      setWithoutImage(false)
      setSaving(false)
    }
  }

  return (
    <div className="discount-preview">
      <div ref={frameRef} className="discount-preview__frame">
        <ul className="discounts__list">
          {/* 이미지 주소를 바꾸면 '못 불러옴' 상태를 처음부터 다시 본다. */}
          <DiscountCard key={shown.image ?? ''} d={shown} today={today} defaultOpen />
        </ul>
      </div>
      <button type="button" className="ads-btn" disabled={saving} onClick={save}>
        {saving ? '만드는 중...' : '이미지로 저장'}
      </button>
      {saveError && <p className="admin__error">{saveError}</p>}
      <ul className="ad-preview__notes">
        {!discount.brand && <li>브랜드와 혜택을 넣으면 카드가 채워져요.</li>}
        {timing === 'ended' && <li className="admin__error">마지막 날이 지나 사용자 목록에는 보이지 않아요.</li>}
        {timing === 'soon' && <li>시작 전이라 목록 아래쪽에 '시작 전'으로 보여요.</li>}
        {discount.visible === false && <li>숨김으로 저장하면 사용자에게 보이지 않아요.</li>}
        {discount.image && <li>이미지를 가져올 수 없는 사이트면 저장한 그림에서는 이미지를 빼고 그려요.</li>}
      </ul>
    </div>
  )
}
