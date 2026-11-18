import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createOutreach,
  deleteOutreach,
  fetchOutreach,
  updateOutreach,
  type Outreach,
  type OutreachChannel,
  type OutreachInput,
  type OutreachKind,
  type OutreachStatus,
} from '@/api/adminOutreach'
import { formatDateTime } from './adminFormat'
import { CHANNEL_LABEL, STATUS_LABEL, contactHref, phoneOf, recentNotes, won } from './outreachFormat'

const STATUSES = Object.keys(STATUS_LABEL) as OutreachStatus[]
const CHANNELS = Object.keys(CHANNEL_LABEL) as OutreachChannel[]

const EMPTY: OutreachInput = {
  kind: 'STORE',
  storeName: '',
  category: null,
  region: null,
  channel: 'INSTAGRAM',
  contact: null,
  assignee: null,
  status: 'TODO',
  note: null,
  lastContactedOn: null,
  offerPrice: null,
  expectedProfit: null,
  unitPrice: null,
  proposalUrl: null,
}

const toInput = (row: Outreach): OutreachInput => ({
  kind: row.kind,
  storeName: row.storeName,
  category: row.category,
  region: row.region,
  channel: row.channel,
  contact: row.contact,
  assignee: row.assignee,
  status: row.status,
  note: row.note,
  lastContactedOn: row.lastContactedOn,
  offerPrice: row.offerPrice ?? null,
  expectedProfit: row.expectedProfit ?? null,
  unitPrice: row.unitPrice ?? null,
  proposalUrl: row.proposalUrl ?? null,
})

/** 매장(한 곳)과 브랜드(본사·여러 지점)는 같은 표를 쓰고 이름표만 다르다. */
const KIND = {
  STORE: { noun: '매장', category: '방탈출, 펜션…', region: '권역', regionHint: '홍대, 가평…', channel: 'INSTAGRAM' },
  BRAND: { noun: '브랜드', category: '프랜차이즈 카페, 통신…', region: '지점 · 범위', regionHint: '전국 120개 지점…', channel: 'EMAIL' },
} as const satisfies Record<OutreachKind, { noun: string; category: string; region: string; regionHint: string; channel: OutreachChannel }>

const today = () => new Date().toLocaleDateString('sv-SE')

const NARROW = '(max-width: 760px)'

/** 휴대폰처럼 좁은 화면이면 표 대신 카드로 보여 준다. 전화하면서 한 손으로 보기 쉽게. */
function useNarrow() {
  const query = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(NARROW).matches
  const [narrow, setNarrow] = useState(query)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(NARROW)
    const onChange = () => setNarrow(media.matches)
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])
  return narrow
}

/** 제시 금액 · 예상 수익 · 객단가를 한 줄로. 하나도 없으면 null. */
function offerLine(row: Outreach) {
  const parts = [
    row.offerPrice != null && `광고비 ${won(row.offerPrice)}`,
    row.expectedProfit != null && `예상 수익 ${won(row.expectedProfit)}`,
    row.unitPrice != null && `객단가 ${won(row.unitPrice)}`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

/** 팀원이 광고 제휴를 위해 연락하는 매장과 브랜드를 함께 기록한다. 위 전환 버튼으로 매장·브랜드를 나눠 본다. 누가 어디에 연락했고 지금 어떤 상태인지 한 표로 본다. */
export function OutreachPage() {
  const [all, setAll] = useState<Outreach[]>([])
  const [kind, setKind] = useState<OutreachKind>('STORE')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<OutreachStatus | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ id: number | null; input: OutreachInput } | null>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const narrow = useNarrow()

  useEffect(() => {
    let cancelled = false
    fetchOutreach()
      .then((result) => {
        if (cancelled) return
        setAll(result)
        setError(null)
      })
      .catch(() => !cancelled && setError('연락 현황을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [reload])

  const rows = useMemo(() => all.filter((row) => (row.kind ?? 'STORE') === kind), [all, kind])
  const label = KIND[kind]

  const counts = useMemo(() => {
    const result = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<OutreachStatus, number>
    rows.forEach((row) => (result[row.status] += 1))
    return result
  }, [rows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (row) =>
        (filter === 'ALL' || row.status === filter) &&
        (!q ||
          [row.storeName, row.category, row.region, row.assignee, row.contact, row.note, row.proposalUrl]
            .some((v) => v?.toLowerCase().includes(q))),
    )
  }, [rows, filter, query])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !editing.input.storeName.trim()) return
    setBusy(true)
    try {
      if (editing.id === null) await createOutreach(editing.input)
      else await updateOutreach(editing.id, editing.input)
      setEditing(null)
      setReload((v) => v + 1)
    } catch {
      setError('저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (row: Outreach, status: OutreachStatus) => {
    setBusy(true)
    try {
      const touched = status !== 'TODO' && row.status === 'TODO' && !row.lastContactedOn
      await updateOutreach(row.id, { ...toInput(row), status, lastContactedOn: touched ? today() : row.lastContactedOn })
      setReload((v) => v + 1)
    } catch {
      setError('상태를 바꾸지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: Outreach) => {
    if (!window.confirm(`'${row.storeName}' 기록을 지울까요? 되돌릴 수 없어요.`)) return
    setBusy(true)
    try {
      await deleteOutreach(row.id)
      setReload((v) => v + 1)
    } catch {
      setError('지우지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const set = <K extends keyof OutreachInput>(key: K, value: OutreachInput[K]) =>
    setEditing((current) => current && { ...current, input: { ...current.input, [key]: value } })
  const text = (value: string) => (value.trim() === '' ? null : value)
  const amount = (value: string) => {
    const digits = value.replace(/[^\d]/g, '')
    return digits === '' ? null : Number(digits)
  }

  return (
    <>
      <header className="admin__header">
        <h1>매장 · 브랜드 연락 현황</h1>
        <button
          type="button"
          className="outreach-add"
          onClick={() => setEditing({ id: null, input: { ...EMPTY, kind, channel: label.channel } })}
        >
          {label.noun} 추가
        </button>
      </header>

      <div className="outreach-kind" role="tablist" aria-label="연락 대상">
        {(['STORE', 'BRAND'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              setKind(k)
              setFilter('ALL')
            }}
          >
            {KIND[k].noun} {all.filter((row) => (row.kind ?? 'STORE') === k).length}
          </button>
        ))}
      </div>

      <div className="admin__tabs outreach-filters" role="tablist" aria-label="연락 상태">
        <button type="button" role="tab" aria-selected={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          전체 {rows.length}
        </button>
        {STATUSES.map((s) => (
          <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}>
            {STATUS_LABEL[s]} {counts[s]}
          </button>
        ))}
      </div>

      <div className="admin-search outreach-search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${label.noun} · 업종 · ${label.region} · 담당자 · 메모 검색`}
          aria-label="연락 기록 검색"
        />
      </div>

      {error && <p className="admin__error">{error}</p>}

      {editing && (() => {
        const formLabel = KIND[editing.input.kind]
        return (
        <form className="admin__panel outreach-form" onSubmit={save}>
          <h2>{editing.id === null ? `${formLabel.noun} 추가` : '연락 기록 수정'}</h2>
          <div className="outreach-form__grid">
            <label>
              구분
              <select value={editing.input.kind} onChange={(e) => set('kind', e.target.value as OutreachKind)}>
                <option value="STORE">매장</option>
                <option value="BRAND">브랜드</option>
              </select>
            </label>
            <label>
              {formLabel.noun} 이름 *
              <input required maxLength={100} value={editing.input.storeName} onChange={(e) => set('storeName', e.target.value)} />
            </label>
            <label>
              업종
              <input maxLength={50} placeholder={formLabel.category} value={editing.input.category ?? ''} onChange={(e) => set('category', text(e.target.value))} />
            </label>
            <label>
              {formLabel.region}
              <input maxLength={50} placeholder={formLabel.regionHint} value={editing.input.region ?? ''} onChange={(e) => set('region', text(e.target.value))} />
            </label>
            <label>
              담당 팀원
              <input maxLength={30} value={editing.input.assignee ?? ''} onChange={(e) => set('assignee', text(e.target.value))} />
            </label>
            <label>
              연락 수단
              <select value={editing.input.channel} onChange={(e) => set('channel', e.target.value as OutreachChannel)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
                ))}
              </select>
            </label>
            <label>
              연락처
              <input maxLength={300} placeholder="@인스타, 전화번호, 이메일, 링크" value={editing.input.contact ?? ''} onChange={(e) => set('contact', text(e.target.value))} />
            </label>
            <label>
              상태
              <select value={editing.input.status} onChange={(e) => set('status', e.target.value as OutreachStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label>
              마지막 연락일
              <input type="date" value={editing.input.lastContactedOn ?? ''} onChange={(e) => set('lastContactedOn', text(e.target.value))} />
            </label>
            <label>
              제시 광고비(원)
              <input inputMode="numeric" placeholder="79000" value={editing.input.offerPrice ?? ''} onChange={(e) => set('offerPrice', amount(e.target.value))} />
            </label>
            <label>
              예상 수익(원)
              <input inputMode="numeric" placeholder="792000" value={editing.input.expectedProfit ?? ''} onChange={(e) => set('expectedProfit', amount(e.target.value))} />
            </label>
            <label>
              객단가(원)
              <input inputMode="numeric" placeholder="100000" value={editing.input.unitPrice ?? ''} onChange={(e) => set('unitPrice', amount(e.target.value))} />
            </label>
            <label>
              제안서 링크
              <input maxLength={500} placeholder="https://www.chak.live/promotion/deck?d=…" value={editing.input.proposalUrl ?? ''} onChange={(e) => set('proposalUrl', text(e.target.value))} />
            </label>
            <label className="outreach-form__wide">
              메모
              <textarea rows={3} maxLength={2000} placeholder="제안 내용, 답변, 다음 할 일" value={editing.input.note ?? ''} onChange={(e) => set('note', text(e.target.value))} />
            </label>
          </div>
          <div className="admin-actions">
            <button type="submit" disabled={busy}>저장</button>
            <button type="button" onClick={() => setEditing(null)}>취소</button>
          </div>
        </form>
        )
      })()}

      {narrow ? (
        <ul className="outreach-cards">
          {visible.map((row) => {
            const href = row.contact ? contactHref(row.channel, row.contact) : null
            const phone = phoneOf(row.contact, row.note)
            const offer = offerLine(row)
            const notes = recentNotes(row.note)
            return (
              <li key={row.id} className="outreach-card">
                <div className="outreach-card__top">
                  <strong>{row.storeName}</strong>
                  <select
                    className={`outreach-status outreach-status--${row.status.toLowerCase()}`}
                    aria-label={`${row.storeName} 상태`}
                    value={row.status}
                    disabled={busy}
                    onChange={(e) => changeStatus(row, e.target.value as OutreachStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="admin__muted">
                  {[row.category, row.region, row.assignee && `담당 ${row.assignee}`].filter(Boolean).join(' · ') || '-'}
                </div>
                {offer && <div className="outreach-card__offer">{offer}</div>}
                <div className="outreach-card__links">
                  {phone && <a className="outreach-card__call" href={`tel:${phone.replace(/[^\d]/g, '')}`}>📞 {phone}</a>}
                  {row.contact && href && !href.startsWith('tel:') && (
                    <a href={href} target="_blank" rel="noreferrer">{CHANNEL_LABEL[row.channel]} · {row.contact}</a>
                  )}
                  {row.proposalUrl && <a href={row.proposalUrl} target="_blank" rel="noreferrer">제안서 보기</a>}
                </div>
                {notes.length > 0 && (
                  <details className="outreach-card__notes">
                    <summary>{notes[notes.length - 1]}</summary>
                    <p>{row.note}</p>
                  </details>
                )}
                <div className="outreach-card__foot">
                  <span className="admin__muted">마지막 연락 {row.lastContactedOn ?? '-'}</span>
                  <button type="button" onClick={() => setEditing({ id: row.id, input: toInput(row) })}>수정</button>
                </div>
              </li>
            )
          })}
          {visible.length === 0 && !error && (
            <li className="admin__muted">{rows.length === 0 ? `아직 기록한 ${label.noun}이 없어요.` : `조건에 맞는 ${label.noun}이 없어요.`}</li>
          )}
        </ul>
      ) : (
      <div className="admin-table-wrap">
        <table className="admin-table outreach-table">
          <thead>
            <tr><th>{label.noun}</th><th>담당</th><th>연락처</th><th>상태</th><th>제안</th><th>마지막 연락</th><th>메모</th><th /></tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const href = row.contact ? contactHref(row.channel, row.contact) : null
              return (
                <tr key={row.id}>
                  <td>
                    <strong>{row.storeName}</strong>
                    {(row.category || row.region) && (
                      <div className="admin__muted">{[row.category, row.region].filter(Boolean).join(' · ')}</div>
                    )}
                  </td>
                  <td>{row.assignee ?? '-'}</td>
                  <td>
                    <div className="admin__muted">{CHANNEL_LABEL[row.channel]}</div>
                    {row.contact && (href ? <a href={href} target="_blank" rel="noreferrer">{row.contact}</a> : row.contact)}
                  </td>
                  <td>
                    <select
                      className={`outreach-status outreach-status--${row.status.toLowerCase()}`}
                      aria-label={`${row.storeName} 상태`}
                      value={row.status}
                      disabled={busy}
                      onChange={(e) => changeStatus(row, e.target.value as OutreachStatus)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="outreach-offer">
                    {row.offerPrice != null ? <strong>{won(row.offerPrice)}</strong> : '-'}
                    {row.expectedProfit != null && <div className="admin__muted">예상 수익 {won(row.expectedProfit)}</div>}
                    {row.unitPrice != null && <div className="admin__muted">객단가 {won(row.unitPrice)}</div>}
                    {row.proposalUrl && <a href={row.proposalUrl} target="_blank" rel="noreferrer">제안서</a>}
                  </td>
                  <td>{row.lastContactedOn ?? '-'}</td>
                  <td className="outreach-note">
                    {row.note ?? '-'}
                    <div className="admin__muted">
                      {row.updatedByName ? `${row.updatedByName} · ` : ''}{formatDateTime(row.updatedAt)}
                    </div>
                  </td>
                  <td>
                    <span className="admin-actions">
                      <button type="button" onClick={() => setEditing({ id: row.id, input: toInput(row) })}>수정</button>
                      <button type="button" disabled={busy} onClick={() => remove(row)}>삭제</button>
                    </span>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && !error && (
              <tr><td colSpan={8} className="admin__muted">{rows.length === 0 ? `아직 기록한 ${label.noun}이 없어요. ${label.noun} 추가로 시작하세요.` : `조건에 맞는 ${label.noun}이 없어요.`}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </>
  )
}
