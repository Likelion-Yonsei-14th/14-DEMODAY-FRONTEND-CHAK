import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createAdminPoll, fetchAdminPolls, updateAdminPoll, type AdminPoll } from '@/api/polls'
import { percentages } from '@/features/poll/pollResults'
import { formatDateTime, formatNumber, kstInputToIso } from './adminFormat'

const STATUS_LABEL = { upcoming: '열리기 전', open: '투표 중', closed: '마감' } as const

/** "불수능 40% · 어려웠어 31% · …" */
function resultLine(poll: AdminPoll) {
  if (!poll.results || poll.results.total === 0) return '아직 표가 없어요'
  const percent = percentages(poll.results.counts)
  return poll.options.map((option, index) => `${option.label} ${percent[index]}%`).join(' · ')
}

/** 수능 여론 질문 관리: 결과 보기, 새 질문 만들기, 숨기기와 마감. */
export function PollsAdminPage() {
  const [polls, setPolls] = useState<AdminPoll[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [form, setForm] = useState({ tag: '', question: '', options: '', opensAt: '', closesAt: '', sortOrder: '0' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    fetchAdminPolls()
      .then((list) => {
        setPolls(list)
        setError(null)
      })
      .catch(() => setError('질문을 불러오지 못했어요.'))
  }, [])

  useEffect(() => load(), [load])

  const patch = async (poll: AdminPoll, change: Parameters<typeof updateAdminPoll>[1]) => {
    setBusyId(poll.id)
    try {
      const next = await updateAdminPoll(poll.id, change)
      setPolls((current) => current.map((p) => (p.id === next.id ? next : p)))
      setError(null)
    } catch {
      setError('바꾸지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusyId(null)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const options = form.options.split('\n').map((line) => line.trim()).filter(Boolean)
    const opensAt = kstInputToIso(form.opensAt)
    const closesAt = form.closesAt ? kstInputToIso(form.closesAt) : null
    if (!form.tag.trim() || !form.question.trim() || options.length < 2 || options.length > 6 || !opensAt || (form.closesAt && !closesAt)) {
      setError('묶음·질문·여는 시각을 넣고, 선택지는 한 줄에 하나씩 2~6개 적어 주세요.')
      return
    }
    setSaving(true)
    try {
      const created = await createAdminPoll({
        slug: `p-${Date.now().toString(36)}`,
        tag: form.tag.trim(),
        question: form.question.trim(),
        options,
        opensAt,
        closesAt,
        sortOrder: Number(form.sortOrder) || 0,
      })
      setPolls((current) => [created, ...current])
      setForm({ tag: form.tag, question: '', options: '', opensAt: form.opensAt, closesAt: form.closesAt, sortOrder: '0' })
      setError(null)
    } catch {
      setError('만들지 못했어요. 선택지가 겹치지 않는지, 닫는 시각이 여는 시각보다 뒤인지 확인해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="admin__header">
        <h1>수능 여론</h1>
      </header>
      {error && <p className="admin__error">{error}</p>}

      <section className="admin__panel">
        <h2>새 질문</h2>
        <form className="admin-poll-form" onSubmit={submit}>
          <label className="admin-field">
            <span>묶음 (예: 수능 끝)</span>
            <input value={form.tag} maxLength={30} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>질문</span>
            <input value={form.question} maxLength={120} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>선택지 (한 줄에 하나, 2~6개)</span>
            <textarea rows={5} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>여는 시각 (한국 시각)</span>
            <input type="datetime-local" value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>닫는 시각 (비우면 계속 열림)</span>
            <input type="datetime-local" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>같은 묶음 안 순서</span>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? '만드는 중...' : '질문 만들기'}
          </button>
        </form>
      </section>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>여는 시각</th><th>질문</th><th>참여</th><th>결과</th><th>상태</th></tr>
          </thead>
          <tbody>
            {polls.map((poll) => (
              <tr key={poll.id}>
                <td>
                  {formatDateTime(poll.opensAt)}
                  {poll.closesAt && (
                    <>
                      <br />
                      <span className="admin__muted">~ {formatDateTime(poll.closesAt)}</span>
                    </>
                  )}
                </td>
                <td>
                  <span className="admin-badge">{poll.tag}</span> <strong>{poll.question}</strong>
                </td>
                <td>{formatNumber(poll.results?.total ?? 0)}명</td>
                <td>
                  {resultLine(poll)}
                  {poll.results && poll.results.regions.length > 0 && (
                    <>
                      <br />
                      <span className="admin__muted">
                        지역 {poll.results.regions.slice(0, 3).map((r) => `${r.region} ${formatNumber(r.total)}`).join(' · ')}
                      </span>
                    </>
                  )}
                </td>
                <td>
                  <span className="admin-actions">
                    <span>{poll.hidden ? '숨김' : STATUS_LABEL[poll.status]}</span>
                    <button type="button" disabled={busyId === poll.id} onClick={() => patch(poll, { hidden: !poll.hidden })}>
                      {poll.hidden ? '보이기' : '숨기기'}
                    </button>
                    {poll.status === 'open' && (
                      <button type="button" disabled={busyId === poll.id} onClick={() => patch(poll, { closesAt: new Date(Date.now() + 1000).toISOString() })}>
                        지금 마감
                      </button>
                    )}
                    {poll.status === 'closed' && (
                      <button type="button" disabled={busyId === poll.id} onClick={() => patch(poll, { clearClosesAt: true })}>
                        다시 열기
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {polls.length === 0 && !error && (
              <tr><td colSpan={5} className="admin__muted">질문이 없어요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
