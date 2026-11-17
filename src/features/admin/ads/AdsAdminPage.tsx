import { Fragment, useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  AD_IMAGE_MAX_BYTES,
  AD_IMAGE_TYPES,
  AD_PLACEMENT_LABEL,
  AD_REGIONS,
  createAdminAd,
  fetchAdSummaries,
  fetchAdminAds,
  fetchAdSwitch,
  setAdSwitch,
  updateAdminAd,
  uploadAdCreative,
  type AdInput,
  type AdSummary,
  type AdSwitchState,
} from '@/api/adminAds'
import type { ApiAdvertisement } from '@/api/types'
import { formatDateTime, formatNumber, isoToKstInput, kstInputToIso } from '../adminFormat'
import { AdPreview } from './AdPreview'
import { AdReportPanel } from './AdReportPanel'
import { adStatus, STATUS_LABEL } from './adStatus'
import './adsAdmin.css'

type Form = {
  title: string
  creativeUrl: string
  destinationUrl: string
  placement: string
  startsAt: string
  endsAt: string
  active: boolean
  /** 대상 시·도. 비면 전국. */
  targetRegions: string[]
}

const EMPTY_FORM = (): Form => ({
  title: '',
  creativeUrl: '',
  destinationUrl: '',
  placement: 'BANNER',
  startsAt: isoToKstInput(new Date().toISOString()),
  endsAt: '2026-12-31T23:59',
  active: true,
  targetRegions: [],
})

const regionLabel = (regions?: string[]) => (regions && regions.length > 0 ? regions.join('·') : '전국')

/** 광고 관리: 전체 스위치, 이미지 올리기와 시안 미리보기, 등록·수정, 노출·클릭 보기. */
export function AdsAdminPage() {
  const [ads, setAds] = useState<ApiAdvertisement[]>([])
  const [summaries, setSummaries] = useState<Record<number, AdSummary>>({})
  const [openReport, setOpenReport] = useState<number | null>(null)
  const [adSwitch, setSwitchState] = useState<AdSwitchState | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    Promise.all([fetchAdminAds(), fetchAdSwitch()])
      .then(([list, state]) => {
        setAds([...list].sort((a, b) => b.id - a.id))
        setSwitchState(state)
        setError(null)
      })
      .catch(() => setError('광고를 불러오지 못했어요.'))
  }, [])

  useEffect(() => load(), [load])

  // 광고마다 지금까지의 노출·도달·클릭(한 번에).
  useEffect(() => {
    let cancelled = false
    fetchAdSummaries()
      .then((list) => {
        if (!cancelled) setSummaries(Object.fromEntries(list.map((item) => [item.advertisementId, item])))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [ads])

  // 게재 중인 배너끼리 노출을 얼마나 나눠 가졌는지(같은 노출 계약이 고르게 가는지 보는 용도).
  const liveBannerIds = ads.filter((ad) => ad.placement === 'BANNER' && adStatus(ad) === 'live').map((ad) => ad.id)
  const liveBannerImpressions = liveBannerIds.reduce((sum, id) => sum + (summaries[id]?.impressions ?? 0), 0)
  const shareOf = (id: number) =>
    liveBannerIds.includes(id) && liveBannerImpressions > 0
      ? Math.round(((summaries[id]?.impressions ?? 0) / liveBannerImpressions) * 100)
      : null

  const liveBanners = ads.filter((ad) => ad.placement === 'BANNER' && adStatus(ad) === 'live').length

  const toggleSwitch = async () => {
    if (!adSwitch) return
    const next = !adSwitch.enabled
    const question = next
      ? `광고를 켜면 게재 기간인 광고가 바로 모든 사용자에게 보여요.\n지금 보일 배너: ${liveBanners}개\n켤까요?`
      : '광고를 끄면 모든 광고가 바로 사라져요. 끌까요?'
    if (!window.confirm(question)) return
    setBusy(true)
    try {
      setSwitchState(await setAdSwitch(next))
      setNotice(next ? '광고를 켰어요.' : '광고를 껐어요.')
      setError(null)
    } catch {
      setError('스위치를 바꾸지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AD_IMAGE_TYPES.includes(file.type)) {
      setError('PNG·JPEG·WEBP·GIF 이미지만 올릴 수 있어요.')
      return
    }
    if (file.size > AD_IMAGE_MAX_BYTES) {
      setError('이미지는 1MB까지 올릴 수 있어요. 크기를 줄여 주세요.')
      return
    }
    setUploading(true)
    try {
      const url = await uploadAdCreative(file)
      setForm((current) => ({ ...current, creativeUrl: url }))
      setError(null)
    } catch {
      setError('이미지를 올리지 못했어요. 다시 시도해 주세요.')
    } finally {
      setUploading(false)
    }
  }

  const toInput = (): AdInput | null => {
    const startsAt = kstInputToIso(form.startsAt)
    const endsAt = kstInputToIso(form.endsAt)
    if (!form.title.trim() || !form.creativeUrl.trim() || !form.destinationUrl.trim() || !startsAt || !endsAt) return null
    if (new Date(endsAt) <= new Date(startsAt)) return null
    return {
      title: form.title.trim(),
      creativeUrl: form.creativeUrl.trim(),
      destinationUrl: form.destinationUrl.trim(),
      placement: form.placement,
      startsAt,
      endsAt,
      active: form.active,
      targetRegions: form.targetRegions,
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input = toInput()
    if (!input) {
      setError('이름·이미지·누르면 갈 주소·기간을 넣어 주세요. 끝나는 시각은 시작보다 뒤여야 해요.')
      return
    }
    setBusy(true)
    try {
      if (editingId === null) {
        const created = await createAdminAd(input)
        setAds((current) => [created, ...current])
        setNotice('광고를 등록했어요.')
      } else {
        const updated = await updateAdminAd(editingId, input)
        setAds((current) => current.map((ad) => (ad.id === updated.id ? updated : ad)))
        setNotice('광고를 고쳤어요.')
      }
      setEditingId(null)
      setForm(EMPTY_FORM())
      setError(null)
    } catch {
      setError('저장하지 못했어요. 주소가 https://로 시작하는지 확인해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const edit = (ad: ApiAdvertisement) => {
    setEditingId(ad.id)
    setForm({
      title: ad.title,
      creativeUrl: ad.creativeUrl,
      destinationUrl: ad.destinationUrl,
      placement: ad.placement,
      startsAt: isoToKstInput(ad.startsAt),
      endsAt: isoToKstInput(ad.endsAt),
      active: ad.active,
      targetRegions: ad.targetRegions ?? [],
    })
    setNotice(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setActive = async (ad: ApiAdvertisement, active: boolean) => {
    setBusy(true)
    try {
      const { id: _id, ...rest } = ad
      void _id
      const updated = await updateAdminAd(ad.id, { ...rest, active })
      setAds((current) => current.map((a) => (a.id === updated.id ? updated : a)))
      setError(null)
    } catch {
      setError('바꾸지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const on = adSwitch?.enabled ?? false

  return (
    <>
      <header className="admin__header">
        <h1>광고 관리</h1>
      </header>
      {error && <p className="admin__error">{error}</p>}
      {notice && !error && <p className="admin__muted">{notice}</p>}

      <section className={`admin__panel ads-switch ${on ? 'is-on' : 'is-off'}`} aria-live="polite">
        <div>
          <h2>광고 전체 스위치</h2>
          <p>
            {adSwitch === null
              ? '불러오는 중...'
              : on
                ? `켜짐 · 게재 기간인 광고가 사용자에게 보이고 있어요 (배너 ${liveBanners}개).`
                : `꺼짐 · 광고를 등록해 둬도 사용자에게 보이지 않아요. 켜면 게재 기간인 배너 ${liveBanners}개가 바로 보여요.`}
            {adSwitch?.updatedAt && <span className="admin__muted"> · {formatDateTime(adSwitch.updatedAt)}에 바꿈</span>}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          className="ads-switch__toggle"
          disabled={busy || adSwitch === null}
          onClick={toggleSwitch}
        >
          <span>{on ? 'ON' : 'OFF'}</span>
        </button>
      </section>

      <section className="admin__panel">
        <h2>{editingId === null ? '새 광고' : `광고 고치기 #${editingId}`}</h2>
        <div className="ads-editor">
          <form className="ads-form" onSubmit={submit}>
            <label className="admin-field">
              <span>광고 이름 (이미지 대체 글로도 쓰여요)</span>
              <input value={form.title} maxLength={100} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <div className="admin-field">
              <span>이미지</span>
              <div className="ads-form__upload">
                <label className="ads-form__file">
                  {uploading ? '올리는 중...' : '이미지 파일 올리기'}
                  <input type="file" accept={AD_IMAGE_TYPES.join(',')} onChange={onFile} disabled={uploading} />
                </label>
                <span className="admin__muted">또는 주소 붙여넣기</span>
              </div>
              <input
                aria-label="이미지 주소"
                placeholder="https://"
                value={form.creativeUrl}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, creativeUrl: e.target.value })}
              />
            </div>
            <label className="admin-field">
              <span>누르면 갈 주소</span>
              <input
                placeholder="https://"
                value={form.destinationUrl}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>지면</span>
              <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                {Object.entries(AD_PLACEMENT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-field">
              <span>보여 줄 지역 (안 고르면 전국)</span>
              <div className="ads-regions" role="group" aria-label="보여 줄 지역">
                <button
                  type="button"
                  aria-pressed={form.targetRegions.length === 0}
                  onClick={() => setForm({ ...form, targetRegions: [] })}
                >
                  전국
                </button>
                {AD_REGIONS.map((region) => {
                  const picked = form.targetRegions.includes(region)
                  return (
                    <button
                      key={region}
                      type="button"
                      aria-pressed={picked}
                      onClick={() =>
                        setForm({
                          ...form,
                          targetRegions: picked
                            ? form.targetRegions.filter((r) => r !== region)
                            : AD_REGIONS.filter((r) => r === region || form.targetRegions.includes(r)),
                        })
                      }
                    >
                      {region}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="ads-form__row">
              <label className="admin-field">
                <span>시작 (한국 시각)</span>
                <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </label>
              <label className="admin-field">
                <span>끝 (한국 시각)</span>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </label>
            </div>
            <label className="admin-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span>이 광고 게재하기 (끄면 전체 스위치가 켜져도 안 보여요)</span>
            </label>
            <div className="admin-actions">
              <button type="submit" className="ads-btn ads-btn--primary" disabled={busy || uploading}>
                {editingId === null ? '광고 등록' : '고친 내용 저장'}
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
            <h3 className="ads-editor__title">시안 미리보기</h3>
            {form.placement === 'BANNER' ? (
              <AdPreview
                ad={{ title: form.title || '광고', creativeUrl: form.creativeUrl.trim(), destinationUrl: form.destinationUrl }}
                switchOn={on}
              />
            ) : (
              <p className="admin__muted">미리보기는 배너 지면만 지원해요.</p>
            )}
          </div>
        </div>
      </section>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>시안</th><th>광고</th><th>기간</th><th>노출 · 도달 · 클릭</th><th>상태</th></tr>
          </thead>
          <tbody>
            {ads.map((ad) => {
              const status = adStatus(ad)
              const c = summaries[ad.id]
              return (
                <Fragment key={ad.id}>
                <tr>
                  <td>
                    <img className="ads-table__thumb" src={ad.creativeUrl} alt="" loading="lazy" />
                  </td>
                  <td>
                    <strong>{ad.title}</strong>
                    <br />
                    <span className="admin__muted">
                      {AD_PLACEMENT_LABEL[ad.placement] ?? ad.placement} · {regionLabel(ad.targetRegions)}
                    </span>
                    <br />
                    <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" className="ads-table__link">
                      {ad.destinationUrl}
                    </a>
                  </td>
                  <td>
                    {formatDateTime(ad.startsAt)}
                    <br />
                    <span className="admin__muted">~ {formatDateTime(ad.endsAt)}</span>
                  </td>
                  <td>
                    {c ? (
                      <>
                        {formatNumber(c.impressions)}회 · {formatNumber(c.reach)}명 · {formatNumber(c.clicks)}회
                        {c.impressions > 0 && (
                          <>
                            <br />
                            <span className="admin__muted">
                              클릭률 {((c.clicks / c.impressions) * 100).toFixed(1)}%
                              {shareOf(ad.id) !== null && ` · 배너 노출 비중 ${shareOf(ad.id)}%`}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="admin__muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-actions">
                      <span className={`admin-badge${status === 'live' && on ? ' ads-badge--live' : ' admin-badge--muted'}`}>
                        {status === 'live' && !on ? '스위치 켜면 노출' : status === 'live' ? '노출 중' : STATUS_LABEL[status]}
                      </span>
                      <button type="button" className="ads-btn" disabled={busy} onClick={() => edit(ad)}>
                        고치기
                      </button>
                      <button type="button" className="ads-btn" disabled={busy} onClick={() => setActive(ad, !ad.active)}>
                        {ad.active ? '꺼두기' : '다시 켜기'}
                      </button>
                      <button
                        type="button"
                        className="ads-btn"
                        aria-expanded={openReport === ad.id}
                        onClick={() => setOpenReport(openReport === ad.id ? null : ad.id)}
                      >
                        {openReport === ad.id ? '보고서 닫기' : '보고서'}
                      </button>
                    </span>
                  </td>
                </tr>
                {openReport === ad.id && (
                  <tr className="ads-table__report">
                    <td colSpan={5}>
                      <AdReportPanel ad={ad} />
                    </td>
                  </tr>
                )}
                </Fragment>
              )
            })}
            {ads.length === 0 && !error && (
              <tr><td colSpan={5} className="admin__muted">등록된 광고가 없어요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
