import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createOutreach,
  deleteOutreach,
  fetchOutreach,
  updateOutreach,
  type Outreach,
  type OutreachChannel,
  type OutreachInput,
  type OutreachStatus,
} from '@/api/adminOutreach'
import { formatDateTime } from './adminFormat'
import { CHANNEL_LABEL, STATUS_LABEL, contactHref } from './outreachFormat'

const STATUSES = Object.keys(STATUS_LABEL) as OutreachStatus[]
const CHANNELS = Object.keys(CHANNEL_LABEL) as OutreachChannel[]

const EMPTY: OutreachInput = {
  storeName: '',
  category: null,
  region: null,
  channel: 'INSTAGRAM',
  contact: null,
  assignee: null,
  status: 'TODO',
  note: null,
  lastContactedOn: null,
}

const toInput = (row: Outreach): OutreachInput => ({
  storeName: row.storeName,
  category: row.category,
  region: row.region,
  channel: row.channel,
  contact: row.contact,
  assignee: row.assignee,
  status: row.status,
  note: row.note,
  lastContactedOn: row.lastContactedOn,
})

const today = () => new Date().toLocaleDateString('sv-SE')

/** 팀원이 광고 제휴를 위해 연락하는 매장을 함께 기록한다. 누가 어디에 연락했고 지금 어떤 상태인지 한 표로 본다. */
export function OutreachPage() {
  const [rows, setRows] = useState<Outreach[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<OutreachStatus | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ id: number | null; input: OutreachInput } | null>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchOutreach()
      .then((result) => {
        if (cancelled) return
        setRows(result)
        setError(null)
      })
      .catch(() => !cancelled && setError('연락 현황을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [reload])

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
          [row.storeName, row.category, row.region, row.assignee, row.contact, row.note]
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

  return (
    <>
      <header className="admin__header">
        <h1>매장 연락 현황</h1>
        <button type="button" className="outreach-add" onClick={() => setEditing({ id: null, input: { ...EMPTY } })}>
          매장 추가
        </button>
      </header>

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
          placeholder="매장 · 업종 · 권역 · 담당자 · 메모 검색"
          aria-label="연락 기록 검색"
        />
      </div>

      {error && <p className="admin__error">{error}</p>}

      {editing && (
        <form className="admin__panel outreach-form" onSubmit={save}>
          <h2>{editing.id === null ? '매장 추가' : '연락 기록 수정'}</h2>
          <div className="outreach-form__grid">
            <label>
              매장 이름 *
              <input required maxLength={100} value={editing.input.storeName} onChange={(e) => set('storeName', e.target.value)} />
            </label>
            <label>
              업종
              <input maxLength={50} placeholder="방탈출, 펜션…" value={editing.input.category ?? ''} onChange={(e) => set('category', text(e.target.value))} />
            </label>
            <label>
              권역
              <input maxLength={50} placeholder="홍대, 가평…" value={editing.input.region ?? ''} onChange={(e) => set('region', text(e.target.value))} />
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
      )}

      <div className="admin-table-wrap">
        <table className="admin-table outreach-table">
          <thead>
            <tr><th>매장</th><th>담당</th><th>연락처</th><th>상태</th><th>마지막 연락</th><th>메모</th><th /></tr>
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
              <tr><td colSpan={7} className="admin__muted">{rows.length === 0 ? '아직 기록한 매장이 없어요. 매장 추가로 시작하세요.' : '조건에 맞는 매장이 없어요.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
