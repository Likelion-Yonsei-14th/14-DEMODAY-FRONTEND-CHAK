import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronRight, Download, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isApiEnabled } from '@/api/config'
import { fetchRecap, type Recap } from '@/api/recap'
import { getCharacterSrc } from '@/features/minigame/studyType/studyTypeCharacters'
import { seoulToday } from '@/features/discounts/discounts'
import { isRecapOpen, RECAP_OPENS_LABEL } from './recapSchedule'
import { SAMPLE_RECAPS } from './recapSample'
import { buildSlides, monthDay, type Slide } from './recapSlides'
import './recap.css'

type Loaded = { status: 'loading' } | { status: 'ready'; recap: Recap | null }

function useRecap(sample: string | null): Loaded {
  const [loaded, setLoaded] = useState<Loaded>(
    sample === 'full' || sample === 'empty'
      ? { status: 'ready', recap: SAMPLE_RECAPS[sample] }
      : isApiEnabled
        ? { status: 'loading' }
        : { status: 'ready', recap: null },
  )
  useEffect(() => {
    if (loaded.status !== 'loading') return
    let cancelled = false
    // 못 받아 와도 누구나 보는 카드(인트로·응원·착 팀 편지·마무리)는 보여 준다.
    fetchRecap()
      .then((recap) => !cancelled && setLoaded({ status: 'ready', recap }))
      .catch(() => !cancelled && setLoaded({ status: 'ready', recap: null }))
    return () => {
      cancelled = true
    }
  }, [loaded.status])
  return loaded
}

/**
 * 나의 수능 리캡. 스토리처럼 화면을 눌러 한 장씩 넘긴다(왼쪽 1/3은 이전, 나머지는 다음).
 * 수능이 끝나는 시각 전에는 기다리는 화면을 보여 준다. `?preview=1`이면 시간과 상관없이 연다.
 */
export function RecapPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preview = params.has('preview')
  const open = preview || isRecapOpen()
  const loaded = useRecap(preview ? params.get('sample') : null)
  const today = seoulToday()
  const slides = useMemo(
    () => (loaded.status === 'ready' ? buildSlides(loaded.recap, today) : []),
    [loaded, today],
  )
  const [index, setIndex] = useState(0)
  const close = () => navigate('/home')

  const go = useCallback(
    (delta: number) => setIndex((current) => Math.min(Math.max(current + delta, 0), Math.max(slides.length - 1, 0))),
    [slides.length],
  )
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  if (!open) {
    return (
      <div className="recap">
        <section className="recap-slide recap-slide--ink recap-slide--still">
          <CloseButton onClick={close} />
          <div className="recap-slide__body">
            <p className="recap-kicker">나의 수능 리캡</p>
            <h1 className="recap-title">
              시험이 끝나면
              <br />
              열어 볼 수 있어요
            </h1>
            <p className="recap-sub">{RECAP_OPENS_LABEL}에 열려요. 지금은 마지막까지 힘내요!</p>
          </div>
        </section>
      </div>
    )
  }

  if (loaded.status === 'loading') {
    return (
      <div className="recap">
        <section className="recap-slide recap-slide--brand recap-slide--still" aria-busy="true">
          <div className="recap-slide__body">
            <p className="recap-title">한 해를 모으는 중...</p>
          </div>
        </section>
      </div>
    )
  }

  const slide = slides[index] ?? slides[0]!
  const last = index === slides.length - 1

  return (
    <div className="recap">
      <section
        key={index}
        className={`recap-slide recap-slide--${slide.tone} recap-slide--${slide.kind}`}
        aria-roledescription="slide"
        aria-label={`${slides.length}장 중 ${index + 1}번째`}
      >
        <div className="recap-progress" aria-hidden>
          {slides.map((s, i) => (
            <span key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : undefined} />
          ))}
        </div>
        <CloseButton onClick={close} />
        {/* 화면 아무 곳이나 눌러 넘긴다. 버튼·링크는 그대로 눌린다. */}
        <button type="button" className="recap-tap recap-tap--prev" aria-label="이전" onClick={() => go(-1)} disabled={index === 0} />
        <button type="button" className="recap-tap recap-tap--next" aria-label="다음" onClick={() => go(1)} disabled={last} />
        <div className="recap-slide__body">
          <SlideBody slide={slide} />
        </div>
        {index === 0 && <p className="recap-hint">화면을 눌러 넘겨 보세요</p>}
        {slide.kind === 'sent' && (
          <Actions>
            <button type="button" className="recap-action" onClick={() => navigate('/letters')}>
              쓴 편지 다시 보기 <ChevronRight size={16} aria-hidden />
            </button>
          </Actions>
        )}
        {slide.kind === 'summary' && <SaveSummary />}
        {slide.kind === 'outro' && (
          <Actions>
            <button type="button" className="recap-action recap-action--solid" onClick={() => navigate('/discounts')}>
              수험표로 받을 수 있는 혜택 보러 가기 <ChevronRight size={16} aria-hidden />
            </button>
            <button type="button" className="recap-action" onClick={() => setIndex(0)}>
              처음부터 다시 보기
            </button>
          </Actions>
        )}
      </section>
    </div>
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="recap-close" aria-label="닫기" onClick={onClick}>
      <X size={22} aria-hidden />
    </button>
  )
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="recap-actions">{children}</div>
}

function SlideBody({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case 'intro':
      return (
        <>
          <p className="recap-kicker">2027 수능 · 나의 리캡</p>
          <h1 className="recap-title recap-title--xl">
            오늘 하루,
            <br />
            정말 고생
            <br />
            많았어요
          </h1>
          <p className="recap-sub">
            {slide.days
              ? `착과 함께한 ${slide.days}일, 끝까지 와 준 당신이 대단해요.`
              : '여기까지 와 준 당신이 정말 대단해요.'}
          </p>
        </>
      )
    case 'cheer':
      return (
        <>
          <p className="recap-cheer">{slide.text}</p>
          {slide.sub && <p className="recap-sub">{slide.sub}</p>}
        </>
      )
    case 'received':
      return (
        <>
          <p className="recap-kicker">받은 응원</p>
          <p className="recap-big">
            {slide.letters}
            <small>통</small>
          </p>
          <h2 className="recap-title">
            {slide.senders}명이 {slide.letters}통의
            <br />
            응원을 보냈어요
          </h2>
          {slide.stickers > 0 && <p className="recap-sub">스티커도 {slide.stickers}개나 붙여 줬어요.</p>}
          {slide.peak && (
            <p className="recap-chip">
              {monthDay(slide.peak.day)}에는 하루에만 {slide.peak.count}개가 왔어요
            </p>
          )}
        </>
      )
    case 'sent':
      return (
        <>
          <p className="recap-kicker">보낸 응원</p>
          <p className="recap-big">
            {slide.letters}
            <small>통</small>
          </p>
          <h2 className="recap-title">
            당신도 {slide.desks}명에게
            <br />
            힘이 되어 줬어요
          </h2>
          <p className="recap-sub">내 시험도 바빴을 텐데, 마음을 나눠 줘서 고마워요.</p>
        </>
      )
    case 'games':
      return (
        <>
          <p className="recap-kicker">가장 많이 한 게임</p>
          <h2 className="recap-title">{slide.top.title}</h2>
          <p className="recap-big">
            {slide.top.plays}
            <small>판</small>
          </p>
          <ul className="recap-facts">
            {slide.top.best !== null && <li>최고 기록 {slide.top.best.toLocaleString('ko-KR')}점</li>}
            {slide.top.topPercent !== null && <li>전체에서 상위 {slide.top.topPercent}%</li>}
            {slide.others.map((other) => (
              <li key={other.title}>
                {other.title} {other.plays}판
              </li>
            ))}
          </ul>
        </>
      )
    case 'studyType':
      return (
        <>
          <p className="recap-kicker">나라는 수험생</p>
          <img className="recap-character" src={getCharacterSrc(slide.code)} alt="" />
          <h2 className="recap-title">{slide.name}</h2>
          <p className="recap-sub">“{slide.tagline}”</p>
        </>
      )
    case 'letter':
      return (
        <article className="recap-letter">
          <p className="recap-kicker">착 팀이 보내는 편지</p>
          <p className="recap-letter__text">
            수고했다는 말로는 부족하지만,
            <br />
            그래도 꼭 하고 싶었어요.
            <br />
            <br />
            긴 시간 정말 애썼어요.
            <br />
            이제 하고 싶었던 거
            <br />
            마음껏 해요.
            <br />
            <br />
            당신의 다음 계절을
            <br />
            응원할게요.
          </p>
          <p className="recap-letter__sign">— 착 팀 드림</p>
        </article>
      )
    case 'summary':
      return (
        <div className="recap-summary" data-recap-summary>
          <p className="recap-summary__stamp">2027 수능 완주</p>
          <h2 className="recap-title">나의 수능 리캡</h2>
          {slide.lines.length > 0 && (
            <dl className="recap-summary__lines">
              {slide.lines.map((line) => (
                <div key={line.label}>
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="recap-summary__foot">끝까지 와 준 나,<br />정말 수고했어</p>
          <p className="recap-summary__brand">수능 착 · chak.live</p>
        </div>
      )
    case 'outro':
      return (
        <>
          <h2 className="recap-title recap-title--xl">
            이제 진짜
            <br />
            쉬어도 돼요
          </h2>
          <p className="recap-sub">맛있는 거 먹고, 푹 자고, 보고 싶던 사람들 만나요. 수험표로 받을 수 있는 혜택도 모아 뒀어요.</p>
        </>
      )
  }
}

/** 요약 카드를 이미지로 저장(인스타 스토리에 올리기 좋게). 글꼴은 화면에 쓰인 것만 심는다. */
function SaveSummary() {
  const [state, setState] = useState<'idle' | 'saving' | 'failed'>('idle')
  const busy = useRef(false)
  const save = async () => {
    if (busy.current) return
    busy.current = true
    setState('saving')
    try {
      const node = document.querySelector<HTMLElement>('.recap-slide--summary')
      if (!node) throw new Error('no summary')
      const [{ toPng }, { buildFontEmbedCSS }] = await Promise.all([
        import('html-to-image'),
        import('@/features/ads/captureFonts'),
      ])
      const fontEmbedCSS = await buildFontEmbedCSS(node.textContent ?? '').catch(() => '')
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        fontEmbedCSS,
        // 넘기기 버튼·진행 막대·저장 버튼은 이미지에서 뺀다.
        filter: (el) =>
          !(el instanceof HTMLElement && ['recap-progress', 'recap-close', 'recap-tap', 'recap-actions'].some((c) => el.classList.contains(c))),
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = '나의-수능-리캡.png'
      link.click()
      setState('idle')
    } catch {
      setState('failed')
    } finally {
      busy.current = false
    }
  }
  return (
    <div className="recap-actions">
      <button type="button" className="recap-action recap-action--solid" onClick={save} disabled={state === 'saving'}>
        <Download size={16} aria-hidden /> {state === 'saving' ? '만드는 중...' : '이미지로 저장하기'}
      </button>
      {state === 'failed' && <p className="recap-sub">이미지를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
    </div>
  )
}
