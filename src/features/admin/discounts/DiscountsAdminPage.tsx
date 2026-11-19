import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  createAdminDiscount,
  collectAdminDiscounts,
  deleteAdminDiscount,
  fetchAdminDiscounts,
  toDiscount,
  updateAdminDiscount,
  type ApiDiscount,
  type DiscountInput,
} from '@/api/discounts'
import { AD_IMAGE_MAX_BYTES, AD_IMAGE_TYPES, uploadAdCreative } from '@/api/adminAds'
import { CSAT_SCHEDULE } from '@/features/csat/csatSchedule'
import { DISCOUNT_CATEGORIES, type DiscountExtra } from '@/features/discounts/discountData'
import { DISCOUNT_AREAS, periodLabel, seoulToday, timingOf } from '@/features/discounts/discounts'
import { DiscountCard } from '@/features/discounts/DiscountsPage'
import { downloadDataUrl } from '../ads/adPreviewImage'
import { formatDateTime } from '../adminFormat'
import '@/features/discounts/discounts.css'
import '../ads/adsAdmin.css'
import { LocationPicker } from './LocationPicker'
import './discountsAdmin.css'

const pad2 = (n: number) => String(n).padStart(2, '0')
/** 수능날 "YYYY-MM-DD". 새 혜택의 시작일 기본값. */
const EXAM_DAY = `${CSAT_SCHEDULE.examDate.year}-${pad2(CSAT_SCHEDULE.examDate.month)}-${pad2(CSAT_SCHEDULE.examDate.day)}`

/** 받는 방법 추천값. 목록에 없는 방법도 자유롭게 적는다(50자까지). */
const HOW_TO = ['현장', '사전 예약', '앱·온라인', '전화 예약', '네이버 예약'] as const

/** 추가 항목 이름 추천값. 광고주마다 다른 이벤트 내용·조건·증정품을 적는다. */
const EXTRA_LABELS = ['참여 조건', '증정', '예약 방법', '이용 시간', '사용 기한', '문의'] as const
const MAX_EXTRAS = 8

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
  /** 광고주가 정한 추가 항목. 화면에 이 순서대로 보인다. */
  extras: DiscountExtra[]
  /** 한 줄에 하나씩 */
  bring: string
  companions: string
  conditions: string
  sourceUrl: string
  sourceDate: string
  image: string
  imageSource: string
  visible: boolean
  /** 광고 계약한 제휴 매장. 목록 위에 따로 돌려 보여 주고 노출·클릭을 센다. */
  sponsored: boolean
  address: string
  latitude: string
  longitude: string
}

const EMPTY_FORM = (): Form => ({
  brand: '',
  category: DISCOUNT_CATEGORIES[0],
  benefit: '',
  highlight: '',
  // 대부분 수능날부터 연말까지 열리므로 기본값으로 채워 둔다.
  start: EXAM_DAY,
  end: `${CSAT_SCHEDULE.examDate.year}-12-31`,
  area: '전국',
  place: '',
  branches: '',
  howTo: '',
  extras: [],
  bring: `${CSAT_SCHEDULE.academicYear}학년도 수험표 원본`,
  companions: '',
  conditions: '',
  sourceUrl: '',
  sourceDate: seoulToday(),
  image: '',
  imageSource: '',
  visible: true,
  sponsored: false,
  address: '',
  latitude: '',
  longitude: '',
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
  extras: (d.extras ?? []).map((extra) => ({ ...extra })),
  bring: d.bring.join('\n'),
  companions: d.companions ?? '',
  conditions: d.conditions ?? '',
  sourceUrl: d.sourceUrl,
  sourceDate: d.sourceDate ?? '',
  image: d.image ?? '',
  imageSource: d.imageSource ?? '',
  visible: d.visible,
  sponsored: d.sponsored ?? false,
  address: d.address ?? '',
  latitude: d.latitude != null ? String(d.latitude) : '',
  longitude: d.longitude != null ? String(d.longitude) : '',
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
    // 둘 다 빈 행은 빼고, 한쪽만 빈 행은 남겨 problemOf에서 막는다.
    extras: form.extras
      .map((extra) => ({ label: extra.label.trim(), value: extra.value.trim() }))
      .filter((extra) => extra.label || extra.value),
    bring: form.bring.split('\n').map((line) => line.trim()).filter(Boolean),
    companions: orNull(form.companions),
    conditions: orNull(form.conditions),
    sourceUrl: form.sourceUrl.trim(),
    sourceDate: orNull(form.sourceDate),
    image: orNull(form.image),
    imageSource: orNull(form.imageSource),
    visible: form.visible,
    sponsored: form.sponsored,
    address: orNull(form.address),
    latitude: form.latitude.trim() ? Number(form.latitude) : null,
    longitude: form.longitude.trim() ? Number(form.longitude) : null,
  }
}

/** 저장 전에 화면에서 먼저 막는 것. 서버도 같은 것을 다시 확인한다. */
function problemOf(input: DiscountInput): string | null {
  if (!input.brand || !input.benefit) return '브랜드와 혜택을 넣어 주세요.'
  if (!/^https?:\/\//.test(input.sourceUrl)) return '출처 주소(https://...)를 넣어 주세요. 출처가 확인된 혜택만 올려요.'
  if (input.start && input.end && input.start > input.end) return '시작일이 마지막 날보다 늦어요.'
  if (input.image && !/^https?:\/\//.test(input.image)) return '이미지 주소는 https://로 시작해야 해요.'
  if (input.extras.some((extra) => !extra.label || !extra.value)) return '추가 항목은 이름과 내용을 모두 적어 주세요.'
  const { latitude: lat, longitude: lng } = input
  if ((lat == null) !== (lng == null)) return '위도와 경도를 둘 다 넣거나 둘 다 비워 주세요.'
  if (lat != null && lng != null && !(lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132)) {
    return '좌표가 국내 범위가 아니에요. 위도(33~39)·경도(124~132) 순서를 확인해 주세요.'
  }
  return null
}

/** 탭·줄바꿈은 서버에 저장할 때 구분자로 쓰므로 공백으로 바꾼다. */
const oneLine = (value: string) => value.replace(/[\t\r\n]+/g, ' ')

/** 광고주마다 다른 이벤트 내용·조건·증정품. 줄마다 이름과 내용, 순서 바꾸기·빼기. */
function ExtrasEditor({ extras, onChange }: { extras: DiscountExtra[]; onChange: (next: DiscountExtra[]) => void }) {
  const update = (index: number, patch: Partial<DiscountExtra>) =>
    onChange(extras.map((extra, i) => (i === index ? { ...extra, ...patch } : extra)))
  const move = (index: number, by: -1 | 1) => {
    const next = [...extras]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item!)
    onChange(next)
  }

  return (
    <fieldset className="discount-extras">
      <legend>추가 항목 (선택, 광고주마다 다른 이벤트 내용 · 조건 · 증정품)</legend>
      <datalist id="discount-extra-labels">
        {EXTRA_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
      {extras.map((extra, index) => {
        const n = index + 1
        return (
          <div key={index} className="discount-extras__row">
            <input
              aria-label={`추가 항목 ${n} 이름`}
              placeholder="이름 (예: 증정)"
              list="discount-extra-labels"
              maxLength={20}
              value={extra.label}
              onChange={(e) => update(index, { label: oneLine(e.target.value) })}
            />
            <input
              aria-label={`추가 항목 ${n} 내용`}
              placeholder="내용 (예: 음료 1잔)"
              maxLength={200}
              value={extra.value}
              onChange={(e) => update(index, { value: oneLine(e.target.value) })}
            />
            <span className="discount-extras__actions">
              <button type="button" className="ads-btn" aria-label={`추가 항목 ${n} 위로`} disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </button>
              <button
                type="button"
                className="ads-btn"
                aria-label={`추가 항목 ${n} 아래로`}
                disabled={index === extras.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="ads-btn"
                aria-label={`추가 항목 ${n} 빼기`}
                onClick={() => onChange(extras.filter((_, i) => i !== index))}
              >
                빼기
              </button>
            </span>
          </div>
        )
      })}
      <button
        type="button"
        className="ads-btn discount-extras__add"
        disabled={extras.length >= MAX_EXTRAS}
        onClick={() => onChange([...extras, { label: '', value: '' }])}
      >
        + 항목 추가
      </button>
      {extras.length >= MAX_EXTRAS && <span className="admin__muted"> {MAX_EXTRAS}개까지 넣을 수 있어요.</span>}
    </fieldset>
  )
}

type StatusFilter = 'all' | 'shown' | 'hidden' | 'ended'
/** 제휴(광고 계약 매장)와 일반 혜택을 나눠 본다. 상태 거르기와 함께 쓴다. */
type KindFilter = 'all' | 'sponsored' | 'regular'

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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  /**
   * 대표 이미지 파일을 올린다. 광고 시안과 같은 저장소(서버 DB)에 올라가고 우리 서버 주소를 돌려받는다.
   * 직접 올린 이미지는 출처 페이지가 필요 없으므로 비운다.
   */
  const onImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AD_IMAGE_TYPES.includes(file.type)) {
      setUploadError('PNG·JPEG·WEBP·GIF 이미지만 올릴 수 있어요.')
      return
    }
    if (file.size > AD_IMAGE_MAX_BYTES) {
      setUploadError('이미지는 1MB까지 올릴 수 있어요. 크기를 줄여 주세요.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadAdCreative(file)
      setForm((current) => ({ ...current, image: url, imageSource: '' }))
    } catch {
      setUploadError('이미지를 올리지 못했어요. 다시 시도해 주세요.')
    } finally {
      setUploading(false)
    }
  }
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
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
    const sponsored = items.filter((d) => d.sponsored).length
    return {
      shown,
      hidden: items.filter((d) => !d.visible).length,
      ended: items.filter((d) => timingOf(toDiscount(d), today) === 'ended').length,
      sponsored,
      regular: items.length - sponsored,
    }
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
      .filter((d) => kindFilter === 'all' || (kindFilter === 'sponsored') === Boolean(d.sponsored))
      .filter((d) => !q || [d.brand, d.benefit, d.place ?? '', d.area, d.category].some((t) => t.toLowerCase().includes(q)))
  }, [items, query, statusFilter, kindFilter, today])

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
  const [collecting, setCollecting] = useState(false)
  const collect = async () => {
    setCollecting(true)
    setError(null)
    try {
      const result = await collectAdminDiscounts()
      if (!result.enabled) setNotice('라이너 키가 없어 자동 찾기가 꺼져 있어요.')
      else if (result.added.length === 0) setNotice(`글 ${result.searched}개를 살펴봤지만 새 혜택은 없었어요.`)
      else {
        setNotice(`새 혜택 후보 ${result.added.length}개를 숨김으로 넣었어요: ${result.added.join(', ')}. 확인하고 '보이기'로 바꿔 주세요.`)
        setStatusFilter('hidden')
      }
      load()
    } catch {
      setError('자동 찾기에 실패했어요. 잠시 후 다시 해 주세요.')
    } finally {
      setCollecting(false)
    }
  }

  const preview = toDiscount({ ...previewInput, id: editingId ?? 0, updatedByName: null, updatedAt: '' })

  return (
    <>
      <header className="admin__header">
        <h1>혜택함 관리</h1>
        <p className="admin__muted">
          수험표 할인 모음에 보이는 혜택이에요. 고치면 바로 사용자 화면에 반영돼요(최대 1분).
          {lastUpdated && ` 사용자 화면에는 마지막으로 고친 날(${formatDateTime(lastUpdated)})이 '기준'으로 보여요.`}
        </p>
        <p className="admin__muted">
          매일 오전 10시·오후 4시에 웹에서 새 수험생 혜택을 찾아 '자동 수집' 이름으로 숨김 상태로 넣어요. 출처를 확인하고 보이게 바꿔 주세요.{' '}
          <button type="button" className="ads-btn" disabled={collecting} onClick={() => void collect()}>
            {collecting ? '찾는 중… (1분쯤 걸려요)' : '지금 새 혜택 찾기'}
          </button>
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
                <span>받는 방법 (골라도, 직접 적어도 돼요)</span>
                <input
                  list="discount-how-to"
                  maxLength={50}
                  placeholder="현장"
                  value={form.howTo}
                  onChange={(e) => set('howTo', e.target.value)}
                />
                <datalist id="discount-how-to">
                  {HOW_TO.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
              </label>
            </div>
            <label className="admin-field">
              <span>챙길 것 (한 줄에 하나씩)</span>
              <textarea rows={3} value={form.bring} onChange={(e) => set('bring', e.target.value)} />
            </label>
            <ExtrasEditor extras={form.extras} onChange={(extras) => set('extras', extras)} />
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
            <div className="admin-field">
              <span>대표 이미지 (선택)</span>
              <div className="ads-form__upload">
                <label className="ads-form__file">
                  {uploading ? '올리는 중...' : '이미지 파일 올리기'}
                  <input type="file" accept={AD_IMAGE_TYPES.join(',')} onChange={onImageFile} disabled={uploading} />
                </label>
                <span className="admin__muted">또는 주소 붙여넣기 · PNG·JPEG·WEBP·GIF, 1MB까지</span>
              </div>
              <input
                aria-label="대표 이미지 주소"
                placeholder="https://"
                maxLength={500}
                value={form.image}
                onChange={(e) => set('image', e.target.value)}
              />
              {uploadError && <p className="admin__error">{uploadError}</p>}
            </div>
            <label className="admin-field">
              <span>이미지를 가져온 페이지 (다른 사이트 이미지를 주소로 넣었을 때만)</span>
              <input placeholder="https://" maxLength={500} value={form.imageSource} onChange={(e) => set('imageSource', e.target.value)} />
            </label>
            <fieldset className="discounts-form__sponsor">
              <legend>제휴 광고</legend>
              <label className="admin-check">
                <input type="checkbox" checked={form.sponsored} onChange={(e) => set('sponsored', e.target.checked)} />
                <span>광고 계약한 제휴 매장이에요 (목록 맨 위에 사람마다 돌려 보여 주고 노출·클릭을 세요)</span>
              </label>
              <label className="admin-field">
                <span>매장 주소 (지도와 카드에 보여요)</span>
                <input
                  placeholder="서울 성동구 연무장길 00 2층"
                  maxLength={200}
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </label>
              <div className="ads-form__row">
                <label className="admin-field">
                  <span>위도</span>
                  <input inputMode="decimal" placeholder="37.5446" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span>경도</span>
                  <input inputMode="decimal" placeholder="127.0557" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} />
                </label>
              </div>
              <LocationPicker
                address={form.address}
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(next) => setForm((current) => ({ ...current, ...next }))}
              />
              <p className="admin__muted">좌표가 있는 제휴 매장만 '지도에서 제휴 매장 찾기'에 나와요.</p>
            </fieldset>
            <label className="admin-check">
              <input type="checkbox" checked={form.visible} onChange={(e) => set('visible', e.target.checked)} />
              <span>사용자에게 보이기 (끄면 지우지 않고 목록에서만 내려요)</span>
            </label>
            <div className="admin-actions">
              <button type="submit" className="ads-btn ads-btn--primary" disabled={busy || uploading}>
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
          <div className="discounts-admin__filters">
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
            <div className="ads-regions" role="group" aria-label="제휴 여부">
              {(
                [
                  ['all', '제휴·일반 모두'],
                  ['sponsored', `제휴 ${counts.sponsored}`],
                  ['regular', `일반 ${counts.regular}`],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={kindFilter === value} onClick={() => setKindFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
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

        {/* 광고 관리 목록처럼 카드로. 대표 이미지(시안)를 누르면 위 폼에서 바로 고치고 미리 본다. */}
        <ul className="ads-list" aria-label="혜택 목록">
          {rows.map((d) => {
            const timing = timingOf(toDiscount(d), today)
            const editing = editingId === d.id
            const classes = ['ads-item', editing && 'is-editing', !d.visible && 'discounts-admin__hidden'].filter(Boolean).join(' ')
            return (
              <li key={d.id} className={classes} aria-label={d.brand}>
                <button
                  type="button"
                  className={d.sponsored ? 'ads-item__thumb' : 'ads-item__thumb is-card'}
                  onClick={() => edit(d)}
                  aria-label={`${d.brand} 고치기·미리보기로 열기`}
                >
                  {d.image ? (
                    <img src={d.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="discounts-admin__no-image">이미지 없음</span>
                  )}
                </button>
                <div className="ads-item__body">
                  <div className="ads-item__head">
                    {d.sponsored && <span className="admin-badge ads-badge--live">제휴</span>}
                    <strong>{d.brand}</strong>
                    <span className={`admin-badge${d.visible && timing !== 'ended' ? ' ads-badge--live' : ' admin-badge--muted'}`}>
                      {!d.visible ? '숨김' : TIMING_LABEL[timing]}
                    </span>
                  </div>
                  <p className="discounts-admin__benefit">{d.benefit}</p>
                  <p className="ads-item__meta">
                    {d.category} · {d.place || d.area} · {periodLabel(toDiscount(d))}
                  </p>
                  <p className="ads-item__meta">
                    마지막 수정 {formatDateTime(d.updatedAt)}
                    {d.updatedByName && ` · ${d.updatedByName}`}
                  </p>
                  {d.sourceUrl && (
                    <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="ads-item__link" title={d.sourceUrl}>
                      {d.sourceUrl}
                    </a>
                  )}
                  <div className="ads-item__actions">
                    <button type="button" className="ads-btn" disabled={busy} onClick={() => edit(d)}>
                      {editing ? '고치는 중' : '고치기 · 미리보기'}
                    </button>
                    <button type="button" className="ads-btn" disabled={busy} onClick={() => setVisible(d, !d.visible)}>
                      {d.visible ? '숨기기' : '보이기'}
                    </button>
                    <button type="button" className="ads-btn discounts-admin__delete" disabled={busy} onClick={() => remove(d)}>
                      지우기
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
          {loaded && rows.length === 0 && <li className="admin__muted">해당하는 혜택이 없어요.</li>}
        </ul>
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
      const [{ toPng }, { buildFontEmbedCSS }, { compensateSnappedBorders }] = await Promise.all([
        import('html-to-image'),
        import('@/features/ads/captureFonts'),
        import('@/features/ads/snappedBorders'),
      ])
      const [fontEmbedCSS, imageReadable] = await Promise.all([
        // 카드에 그려지는 글자만 걸치는 Pretendard 조각을 심는다.
        buildFontEmbedCSS(node.textContent ?? '').catch(() => ''),
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
      // 화면 배율이 정수가 아닌 기기(Windows 150% 등)에서 칩 글자가 쪼개지지 않게 한다(snappedBorders.ts).
      const restoreStyles = compensateSnappedBorders(window)
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        fontEmbedCSS,
        backgroundColor: getComputedStyle(node).backgroundColor,
      }).finally(restoreStyles)
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
