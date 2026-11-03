import type { CSSProperties, ReactNode } from 'react'
import { Gift, Mail, Megaphone, MapPin, Smartphone, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { PieceArt } from '@/features/minigame/deskBlast/DeskBlastArt'
import { CANONICAL } from '@/features/minigame/deskBlast/deskBlastShapes'
import { getCharacterSrc } from '@/features/minigame/studyType/studyTypeCharacters'
import { STUDY_TYPE_CODES, STUDY_TYPE_RESULTS } from '@/features/minigame/studyType/studyTypeResults'
import { OG_PAGES } from '@/lib/ogCards'
import './OgPreview.css'

/**
 * Development only: draws the 1200x630 thumbnail of a link card at /__og/<name>,
 * for scripts/make-og-images.mjs to photograph into public/assets/og.
 */

const GAP = 0.08

/** An object of the desk-blast set, `cell` pixels to a cell, its top left cell at (row, col) of a board. */
function Piece({ kind, row, col, cell }: { kind: number; row: number; col: number; cell: number }) {
  const shape = CANONICAL[kind]!
  const cells = shape.cells.map(([r, c]) => [r + row, c + col] as const)
  const style: CSSProperties = {
    position: 'absolute',
    left: col * cell * (1 + GAP),
    top: row * cell * (1 + GAP),
    width: shape.width * cell + (shape.width - 1) * cell * GAP,
    height: shape.height * cell + (shape.height - 1) * cell * GAP,
    overflow: 'visible',
    filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.45))',
  }
  return <PieceArt kind={kind} cells={cells} style={style} />
}

function DeskBlastArt() {
  const cell = 58
  return (
    <div className="og-mat" style={{ width: 8 * cell * (1 + GAP) + 28, height: 8 * cell * (1 + GAP) + 28 }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Piece kind={4} row={0} col={0} cell={cell} />
        <Piece kind={3} row={0} col={4} cell={cell} />
        <Piece kind={5} row={1} col={0} cell={cell} />
        <Piece kind={6} row={2} col={0} cell={cell} />
        <Piece kind={7} row={2} col={2} cell={cell} />
        <Piece kind={8} row={2} col={5} cell={cell} />
        <Piece kind={11} row={4} col={0} cell={cell} />
        <Piece kind={12} row={5} col={2} cell={cell} />
        <Piece kind={10} row={5} col={5} cell={cell} />
        <Piece kind={1} row={7} col={1} cell={cell} />
      </div>
    </div>
  )
}

function Panel({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`og-panel ${className}`}>{children}</div>
}

const ART: Record<string, () => ReactNode> = {
  'desk-blast': () => <DeskBlastArt />,
  'sneaky-phone': () => (
    <Panel className="og-panel--night">
      <Smartphone size={230} strokeWidth={1.4} color="#ffe9a8" />
      <strong className="og-panel__big">30초</strong>
    </Panel>
  ),
  'study-type': () => (
    <Panel className="og-panel--cream">
      <div className="og-faces">
        {(['PSA', 'LFN', 'PFA', 'LSN'] as const).map((code) => (
          <img key={code} src={getCharacterSrc(code)} alt="" />
        ))}
      </div>
    </Panel>
  ),
  'exam-career': () => (
    <Panel className="og-panel--board">
      <span className="og-chalk og-chalk--small">합격까지</span>
      <strong className="og-chalk og-chalk--big">수능 D-DAY</strong>
      <span className="og-chalk og-chalk--small">모의고사 → 수능 → 합격 발표</span>
    </Panel>
  ),
  'd1-course': () => (
    <Panel className="og-panel--sky">
      <svg viewBox="0 0 400 300" width="440" height="330" aria-hidden>
        <path d="M40 250 C120 250 120 130 200 130 S 300 60 360 60" fill="none" stroke="#1f4e79" strokeWidth="10" strokeDasharray="4 22" strokeLinecap="round" />
      </svg>
      <MapPin className="og-pin og-pin--a" size={86} fill="#ff5a3c" color="#fff" />
      <MapPin className="og-pin og-pin--b" size={86} fill="#ffc21a" color="#fff" />
      <MapPin className="og-pin og-pin--c" size={86} fill="#2fb58c" color="#fff" />
    </Panel>
  ),
  'guess-god': () => (
    <Panel className="og-panel--paper">
      <div className="og-omr">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="og-omr__row">
            <b>{row + 1}</b>
            {Array.from({ length: 5 }, (_, col) => (
              <i key={col} className={(row * 2 + 1) % 5 === col ? 'is-on' : ''} />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  ),
  promotion: () => (
    <Panel className="og-panel--coral">
      <Megaphone size={240} strokeWidth={1.4} color="#fff" />
    </Panel>
  ),
  desk: () => (
    <Panel className="og-panel--pink">
      <Mail size={240} strokeWidth={1.4} color="#bd2e15" />
    </Panel>
  ),
  claim: () => (
    <Panel className="og-panel--butter">
      <Gift size={240} strokeWidth={1.4} color="#7a5b12" />
    </Panel>
  ),
  'classroom-join': () => (
    <Panel className="og-panel--board">
      <Users size={240} strokeWidth={1.4} color="#fffdf6" />
    </Panel>
  ),
}

/** The card to photograph, by the name its file will have. */
function cardFor(name: string): { title: string; description: string; art: () => ReactNode } | null {
  const typed = STUDY_TYPE_CODES.map((code) => STUDY_TYPE_RESULTS[code]).find((result) => `study-type-${result.slug}` === name)
  if (typed) {
    const code = typed.typeCode
    return {
      title: `나는 ${typed.typeName}!`,
      description: `${typed.tagline} 너의 수험생 유형도 확인해 봐!`,
      art: () => (
        <Panel className="og-panel--cream">
          <img className="og-hero" src={getCharacterSrc(code)} alt="" />
        </Panel>
      ),
    }
  }
  const page = OG_PAGES.find((item) => item.page === `${name}-intro`) ?? OG_PAGES.find((item) => item.page === name)
  const art = ART[name]
  if (!page || !art) return null
  return { title: page.card.title, description: page.card.description, art }
}

export default function OgPreviewPage() {
  const { name = '' } = useParams()
  const card = cardFor(name)
  if (!card) return <p>알 수 없는 카드: {name}</p>
  return (
    <div className="og-card" data-name={name}>
      <div className="og-art">{card.art()}</div>
      <div className="og-text">
        <img className="og-mark" src="/assets/brand/chak-mark.svg" alt="" />
        <h1>{card.title}</h1>
        <p>{card.description}</p>
        <span className="og-url">chak.live</span>
      </div>
    </div>
  )
}
