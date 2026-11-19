import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronRight, Download, X } from 'lucide-react'
import { Button } from '@/design-system'
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
            <p className="recap-marker">나의 수능 리캡</p>
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
            <Button variant="secondary" fullWidth trailingIcon={<ChevronRight size={18} aria-hidden />} onClick={() => navigate('/letters')}>
              쓴 편지 다시 보기
            </Button>
          </Actions>
        )}
        {slide.kind === 'summary' && <SaveSummary />}
        {slide.kind === 'outro' && (
          <Actions>
            <Button variant="primary" fullWidth trailingIcon={<ChevronRight size={18} aria-hidden />} onClick={() => navigate('/discounts')}>
              수험표로 받는 혜택 보러 가기
            </Button>
            <Button variant="tertiary" fullWidth onClick={() => setIndex(0)}>
              처음부터 다시 보기
            </Button>
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

const STICKER = {
  heart: '/assets/desk-stickers/desk-sticker-heart.webp',
  star: '/assets/desk-stickers/desk-sticker-star.webp',
  crown: '/assets/desk-stickers/desk-sticker-crown.webp',
  bolt: '/assets/desk-stickers/desk-sticker-bolt.webp',
  smile: '/assets/desk-stickers/desk-sticker-smile.webp',
  clover: '/assets/desk-stickers/desk-sticker-clover.webp',
  chak: '/assets/brand/chak-sticker.svg',
  yeot: '/assets/charms/charm-yeot-acrylic.webp',
  luck: '/assets/charms/charm-clover-acrylic.webp',
  moon: '/assets/charms/charm-moon-acrylic.webp',
  sparkle: '/assets/stickers/sticker-emphasis.svg',
  tapePink: '/assets/letter-decor/tape-pink.webp',
  tapeYellow: '/assets/letter-decor/tape-yellow.webp',
  tapeSky: '/assets/letter-decor/tape-sky.webp',
  tapeGingham: '/assets/letter-decor/tape-gingham-green.webp',
  clipHeart: '/assets/letter-decor/clip-paperclip-heart.webp',
  binder: '/assets/letter-decor/clip-binder-red.webp',
} as const

/** 책상에 붙이는 스티커·부적을 화면 가장자리에 흩뿌린다. 위치는 %(x, y), 크기는 px. */
function Deco({ src, x, y, size, rotate = 0, delay = 0 }: { src: string; x: string; y: string; size: number; rotate?: number; delay?: number }) {
  return (
    <img
      className="recap-deco"
      src={src}
      alt=""
      style={{ left: x, top: y, width: size, ['--r' as string]: `${rotate}deg`, animationDelay: `${delay}ms` }}
    />
  )
}

/** 숫자가 0부터 올라간다(움직임 줄이기 설정이면 바로). */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900)
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // 탭이 가려져 프레임이 멈춰도 마지막 숫자는 꼭 보이게.
    const done = window.setTimeout(() => setShown(value), 1100)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(done)
    }
  }, [value])
  return <>{shown.toLocaleString('ko-KR')}</>
}

function Note({ tape, clip, tilt = -2, children }: { tape?: string; clip?: string; tilt?: number; children: ReactNode }) {
  return (
    <div className="recap-note" style={{ ['--tilt' as string]: `${tilt}deg` }}>
      {tape && <img className="recap-note__tape" src={tape} alt="" />}
      {clip && <img className="recap-note__clip" src={clip} alt="" />}
      {children}
    </div>
  )
}

function SlideBody({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case 'intro':
      return (
        <>
          <Deco src={STICKER.chak} x="68%" y="9%" size={96} rotate={12} delay={300} />
          <Deco src={STICKER.yeot} x="-4%" y="76%" size={120} rotate={-18} delay={450} />
          <Deco src={STICKER.star} x="78%" y="70%" size={64} rotate={14} delay={600} />
          <p className="recap-marker">2027 수능 · 나의 리캡</p>
          <h1 className="recap-title recap-title--xl">
            오늘 하루,
            <br />
            정말 고생
            <br />
            많았어요
          </h1>
          <p className="recap-sub">
            {slide.days
              ? `착과 함께한 ${slide.days}일, 끝까지 와 준 당신이 정말 대단해요.`
              : '여기까지 와 준 당신이 정말 대단해요.'}
          </p>
        </>
      )
    case 'cheer':
      return (
        <>
          <Deco src={STICKER.sparkle} x="8%" y="22%" size={56} rotate={-10} delay={350} />
          <Deco src={STICKER.luck} x="70%" y="72%" size={96} rotate={16} delay={500} />
          <p className="recap-hand recap-hand--xl">{slide.text}</p>
          {slide.sub && <p className="recap-sub">{slide.sub}</p>}
        </>
      )
    case 'received':
      return (
        <>
          <Deco src={STICKER.heart} x="72%" y="10%" size={88} rotate={10} delay={500} />
          <Deco src={STICKER.smile} x="-2%" y="80%" size={72} rotate={-12} delay={700} />
          <p className="recap-marker">받은 응원</p>
          <p className="recap-big">
            <CountUp value={slide.letters} />
            <small>통</small>
          </p>
          <Note tape={STICKER.tapePink} tilt={-2}>
            <p className="recap-note__title">
              {slide.senders}명이 {slide.letters}통의 응원을 보냈어요
            </p>
            {slide.stickers > 0 && <p className="recap-note__body">스티커도 {slide.stickers}개나 붙여 줬어요.</p>}
            {slide.peak && (
              <p className="recap-note__body">
                <mark>{monthDay(slide.peak.day)}</mark>에는 하루에만 {slide.peak.count}개가 왔어요!
              </p>
            )}
          </Note>
        </>
      )
    case 'sent':
      return (
        <>
          <Deco src={STICKER.clover} x="74%" y="12%" size={80} rotate={-8} delay={500} />
          <Deco src={STICKER.star} x="2%" y="78%" size={60} rotate={18} delay={700} />
          <p className="recap-marker">보낸 응원</p>
          <p className="recap-big">
            <CountUp value={slide.letters} />
            <small>통</small>
          </p>
          <Note tape={STICKER.tapeYellow} tilt={2}>
            <p className="recap-note__title">당신도 {slide.desks}명에게 힘이 되어 줬어요</p>
            <p className="recap-note__body">내 시험도 바빴을 텐데, 마음을 나눠 줘서 고마워요.</p>
          </Note>
        </>
      )
    case 'games':
      return (
        <>
          <Deco src={slide.top.topPercent !== null ? STICKER.crown : STICKER.bolt} x="70%" y="8%" size={92} rotate={12} delay={500} />
          <Deco src={STICKER.moon} x="-4%" y="80%" size={88} rotate={-14} delay={700} />
          <p className="recap-marker">가장 많이 한 게임</p>
          <h2 className="recap-title">{slide.top.title}</h2>
          <p className="recap-big">
            <CountUp value={slide.top.plays} />
            <small>판</small>
          </p>
          <Note tape={STICKER.tapeSky} tilt={-1.5}>
            <ul className="recap-facts">
              {slide.top.best !== null && (
                <li>
                  <span>최고 기록</span>
                  <strong>{slide.top.best.toLocaleString('ko-KR')}점</strong>
                </li>
              )}
              {slide.top.topPercent !== null && (
                <li>
                  <span>전체에서</span>
                  <strong>
                    <mark>상위 {slide.top.topPercent}%</mark>
                  </strong>
                </li>
              )}
              {slide.others.map((other) => (
                <li key={other.title}>
                  <span>{other.title}</span>
                  <strong>{other.plays}판</strong>
                </li>
              ))}
            </ul>
          </Note>
        </>
      )
    case 'studyType':
      return (
        <>
          <Deco src={STICKER.sparkle} x="74%" y="14%" size={60} rotate={8} delay={600} />
          <p className="recap-marker">나라는 수험생</p>
          <div className="recap-polaroid">
            <img className="recap-note__tape" src={STICKER.tapeYellow} alt="" />
            <img className="recap-polaroid__img" src={getCharacterSrc(slide.code)} alt="" />
            <p className="recap-hand">{slide.name}</p>
          </div>
          <p className="recap-sub">“{slide.tagline}”</p>
        </>
      )
    case 'letter':
      return (
        <article className="recap-letter">
          <img className="recap-letter__clip" src={STICKER.binder} alt="" />
          <p className="recap-letter__to">착 팀이 보내는 편지</p>
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
          <img className="recap-letter__sticker" src={STICKER.heart} alt="" />
        </article>
      )
    case 'summary':
      return (
        <div className="recap-ticket">
          <img className="recap-ticket__tape" src={STICKER.tapeGingham} alt="" />
          <div className="recap-ticket__head">
            <span>2027학년도 대학수학능력시험</span>
            <strong>나의 수능 리캡</strong>
          </div>
          {slide.lines.length > 0 && (
            <dl className="recap-ticket__lines">
              {slide.lines.map((line) => (
                <div key={line.label}>
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="recap-hand">끝까지 와 준 나, 정말 수고했어</p>
          <p className="recap-ticket__brand">수능 착 · chak.live</p>
          <p className="recap-ticket__stamp">완주</p>
          <img className="recap-ticket__sticker" src={STICKER.chak} alt="" />
        </div>
      )
    case 'outro':
      return (
        <>
          <Deco src={STICKER.luck} x="64%" y="14%" size={112} rotate={14} delay={400} />
          <Deco src={STICKER.smile} x="4%" y="62%" size={68} rotate={-10} delay={600} />
          <h2 className="recap-title recap-title--xl">
            이제 진짜
            <br />
            쉬어도 돼요
          </h2>
          <p className="recap-hand">맛있는 거 먹고, 푹 자고,
            <br />
            보고 싶던 사람들 만나요</p>
          <p className="recap-sub">수험표로 받을 수 있는 혜택도 모아 뒀어요.</p>
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
      const node = document.querySelector<HTMLElement>('.recap-ticket')
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
      <Button variant="primary" fullWidth loading={state === 'saving'} leadingIcon={<Download size={18} aria-hidden />} onClick={save}>
        이미지로 저장하기
      </Button>
      {state === 'failed' && <p className="recap-sub">이미지를 만들지 못했어요. 화면을 캡처해 주세요.</p>}
    </div>
  )
}
