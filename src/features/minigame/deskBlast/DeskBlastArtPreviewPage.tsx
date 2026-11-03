import { useSearchParams } from 'react-router-dom'
import { PieceArt } from './DeskBlastArt'
import { ITEMS, SHAPE_DEFS, type ShapeDef } from './deskBlastShapes'

/**
 * Development only (/__blast-art): every piece of 수능 블라스트 in every
 * orientation, on both desks, at the board size and the waiting-tray size.
 * `?kind=tumbler` (an item id) shows just that one.
 */

const GAP = 3

const DESKS = [
  { look: 'objects', label: '실물 문구', mat: '#2d5545', cell: 'rgba(255,255,255,.06)', line: 'rgba(255,255,255,.13)', text: '#f4efe3' },
  { look: 'arcade', label: '심야 책상', mat: '#0d0c12', cell: '#1a1822', line: 'rgba(255,255,255,.04)', text: '#f6efe4' },
] as const

function Piece({ def, size, desk }: { def: ShapeDef; size: number; desk: (typeof DESKS)[number] }) {
  const width = def.width * size + (def.width - 1) * GAP
  const height = def.height * size + (def.height - 1) * GAP
  return (
    <div style={{ position: 'relative', width, height }}>
      {def.shape.map(([r, c]) => (
        <div
          key={`${r},${c}`}
          style={{
            position: 'absolute',
            left: c * (size + GAP),
            top: r * (size + GAP),
            width: size,
            height: size,
            borderRadius: 6,
            background: desk.cell,
            boxShadow: `inset 0 0 0 1px ${desk.line}`,
          }}
        />
      ))}
      <PieceArt
        kind={def.kind}
        cells={def.shape}
        style={{ position: 'absolute', inset: 0, width, height, overflow: 'visible', filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,.5))' }}
      />
    </div>
  )
}

export default function DeskBlastArtPreviewPage() {
  const [params] = useSearchParams()
  const only = params.get('kind')
  const items = ITEMS.filter((item) => !only || item.id === only)

  return (
    <div style={{ minHeight: '100vh', background: '#e9dcc4', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 4px' }}>수능 블라스트 오브젝트</h1>
      <p style={{ fontSize: 13, margin: '0 0 16px', color: '#5b5245' }}>
        큰 그림은 보드 칸 크기(44px), 작은 그림은 대기 칸 크기(23px). 하나만 보기:{' '}
        {ITEMS.map((item) => (
          <a key={item.id} href={`?kind=${item.id}`} style={{ marginRight: 8 }}>
            {item.name}
          </a>
        ))}
        <a href="?">전부</a>
      </p>
      {items.map((item) => {
        const defs = SHAPE_DEFS.filter((def) => def.kind === item.kind)
        return (
          <section key={item.id} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, margin: '0 0 8px' }}>
              {item.name} <span style={{ color: '#8b8172', fontWeight: 400 }}>{item.id}</span>
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {DESKS.map((desk) => (
                <div key={desk.look} style={{ background: desk.mat, borderRadius: 12, padding: 14 }}>
                  <div style={{ color: desk.text, fontSize: 12, marginBottom: 10, opacity: 0.7 }}>{desk.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 18 }}>
                    {defs.map((def) => (
                      <Piece key={def.rows.join('/')} def={def} size={44} desk={desk} />
                    ))}
                    {defs.map((def) => (
                      <Piece key={`s-${def.rows.join('/')}`} def={def} size={23} desk={desk} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
