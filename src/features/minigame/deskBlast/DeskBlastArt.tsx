import { useId, type CSSProperties, type ReactNode } from 'react'
import { findTransform, normalize, type Cells } from './deskBlastTransform'
import { CANONICAL, itemOf, type ItemKind } from './deskBlastShapes'

/**
 * Each block is drawn as the object it stands for, as one picture over all its
 * cells. Every drawing is made upright, in a box measured in cells (a pencil is
 * 4 wide and 1 tall), and is turned or flipped to match the block.
 */

type Draw = (id: string) => ReactNode

const INK = 'rgba(20, 14, 8, .28)'

/** A gradient with its stops, between two points given as fractions of the shape it paints. */
function Grad({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }: { id: string; stops: ReadonlyArray<readonly [number, string]>; x1?: number; y1?: number; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  )
}

/** 지우개: a white block in a blue paper sleeve. */
const eraser: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-b`} stops={[[0, '#ffffff'], [1, '#dcd6c7']]} />
      <Grad id={`${id}-s`} stops={[[0, '#5a84ee'], [1, '#2347b5']]} />
    </defs>
    <g transform="rotate(-6 .5 .5)">
      <rect x=".03" y=".14" width=".94" height=".72" rx=".1" fill={`url(#${id}-b)`} />
      <rect x=".27" y=".14" width=".46" height=".72" fill={`url(#${id}-s)`} />
      <path d="M.33 .86 L.48 .14 M.5 .86 L.65 .14" stroke="#fff" strokeOpacity=".8" strokeWidth=".05" />
      <rect x=".08" y=".19" width=".84" height=".07" rx=".035" fill="#fff" opacity=".75" />
      <rect x=".03" y=".14" width=".94" height=".72" rx=".1" fill="none" stroke={INK} strokeWidth=".022" />
    </g>
  </g>
)

/** 종이클립 */
const clip: Draw = (id) => {
  const wire = 'M1.5 .5 L.62 .5 A.14 .14 0 0 1 .62 .22 L1.66 .22 A.28 .28 0 0 1 1.66 .78 L.38 .78 A.28 .28 0 0 1 .38 .22'
  return (
    <g>
      <defs>
        <Grad id={`${id}-w`} stops={[[0, '#f4f6fa'], [0.5, '#aeb6c4'], [1, '#7d8798']]} />
      </defs>
      <path d={wire} transform="translate(.025 .035)" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth=".11" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wire} fill="none" stroke={`url(#${id}-w)`} strokeWidth=".1" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wire} transform="translate(-.012 -.02)" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth=".022" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** 형광펜: a cap, a barrel with a label, and a chisel tip. */
const highlighter: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-cap`} stops={[[0, '#9ac400'], [1, '#5f8300']]} />
      <Grad id={`${id}-bar`} stops={[[0, '#eaff52'], [1, '#aedb0c']]} />
      <Grad id={`${id}-tip`} stops={[[0, '#f6ffa6'], [1, '#d3ee45']]} />
    </defs>
    <rect x=".07" y=".18" width="1.02" height=".64" rx=".12" fill={`url(#${id}-cap)`} stroke={INK} strokeWidth=".02" />
    <rect x=".2" y=".1" width=".72" height=".1" rx=".05" fill="#46610a" />
    <path d="M.98 .26 V.74 M.9 .26 V.74" stroke="#fff" strokeOpacity=".3" strokeWidth=".025" />
    <rect x="1.05" y=".22" width="1.4" height=".56" fill={`url(#${id}-bar)`} stroke={INK} strokeWidth=".02" />
    <rect x="1.28" y=".35" width=".86" height=".3" rx=".05" fill="#fff" />
    <path d="M1.36 .46 H1.9 M1.36 .56 H2.04" stroke="#6f8a14" strokeWidth=".04" strokeLinecap="round" />
    <path d="M2.45 .3 L2.88 .4 V.6 L2.45 .7 Z" fill={`url(#${id}-tip)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <rect x="1.05" y=".25" width="1.4" height=".07" fill="#fff" opacity=".5" />
  </g>
)

/** 연필: an eraser, a metal band, a six-sided body, the cut wood and the lead. */
const pencil: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-er`} stops={[[0, '#ffb5c8'], [1, '#e9809f']]} />
      <Grad id={`${id}-fe`} stops={[[0, '#f3f5f8'], [0.5, '#b4bcc8'], [1, '#8a93a3']]} />
      <Grad id={`${id}-wd`} stops={[[0, '#f7dcae'], [1, '#d3a468']]} />
    </defs>
    <rect x=".06" y=".21" width=".36" height=".58" rx=".11" fill={`url(#${id}-er)`} stroke={INK} strokeWidth=".02" />
    <rect x=".4" y=".2" width=".26" height=".6" fill={`url(#${id}-fe)`} stroke={INK} strokeWidth=".02" />
    <path d="M.47 .2 V.8 M.53 .2 V.8 M.59 .2 V.8" stroke="#6d7686" strokeOpacity=".7" strokeWidth=".022" />
    <rect x=".66" y=".2" width="2.42" height=".19" fill="#ffe68a" />
    <rect x=".66" y=".39" width="2.42" height=".23" fill="#f7c52b" />
    <rect x=".66" y=".62" width="2.42" height=".18" fill="#d99c12" />
    <rect x=".66" y=".2" width="2.42" height=".6" fill="none" stroke={INK} strokeWidth=".02" />
    <rect x="1.0" y=".2" width=".08" height=".6" fill="#2a2a2e" />
    <rect x="1.12" y=".2" width=".04" height=".6" fill="#2a2a2e" />
    <path d="M1.4 .5 H1.9 M2.05 .5 H2.5" stroke="#8a5a00" strokeOpacity=".55" strokeWidth=".05" strokeLinecap="round" />
    <path d="M3.08 .2 L3.74 .4 V.6 L3.08 .8 Z" fill={`url(#${id}-wd)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <path d="M3.08 .5 L3.74 .5" stroke="#a87b3f" strokeOpacity=".6" strokeWidth=".02" />
    <path d="M3.62 .4 L3.95 .5 L3.62 .6 Z" fill="#35353b" />
  </g>
)

/** 자: acrylic, with centimeter marks and numbers. */
const ruler: Draw = (id) => {
  const ticks = Array.from({ length: 25 }, (_, index) => index)
  return (
    <g>
      <defs>
        <Grad id={`${id}-r`} stops={[[0, '#e2effc'], [1, '#a9c6ee']]} />
      </defs>
      <rect x=".05" y=".1" width="4.9" height=".8" rx=".07" fill={`url(#${id}-r)`} stroke={INK} strokeWidth=".02" />
      <rect x=".12" y=".14" width="4.76" height=".06" rx=".03" fill="#fff" opacity=".8" />
      {ticks.map((index) => {
        const x = 0.2 + index * 0.19
        const long = index % 5 === 0
        return <path key={index} d={`M${x} .2 V${long ? 0.46 : 0.33}`} stroke="#1d3b73" strokeWidth={long ? 0.034 : 0.024} />
      })}
      {[0, 5, 10, 15, 20].map((value, index) => (
        <text key={value} x={0.2 + index * 0.95} y=".7" fontSize=".22" fontWeight="800" textAnchor="middle" fill="#1d3b73">
          {value}
        </text>
      ))}
      <circle cx="4.7" cy=".66" r=".07" fill="#6f8fc4" />
    </g>
  )
}

/** 포스트잇: a sticky strip, handwriting, and a folded corner. */
const sticky: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-p`} stops={[[0, '#fff6a8'], [1, '#ffd83f']]} />
    </defs>
    <path d="M.08 .08 H1.92 V1.32 L1.32 1.92 H.08 Z" fill={`url(#${id}-p)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <rect x=".08" y=".08" width="1.84" height=".3" fill="#ffb21f" opacity=".32" />
    <path d="M.34 .78 q.18 -.1 .34 0 t.34 0 t.3 0 M.34 1.08 q.2 -.1 .4 0 t.4 0 M.34 1.38 q.14 -.1 .28 0 t.28 0" fill="none" stroke="#7a5b00" strokeOpacity=".6" strokeWidth=".055" strokeLinecap="round" />
    <path d="M1.32 1.92 L1.92 1.32 L1.32 1.32 Z" fill="#fffbd4" stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <path d="M1.32 1.92 L1.92 1.32" stroke="rgba(0,0,0,.2)" strokeWidth=".05" />
  </g>
)

const BARS = [0.05, 0.03, 0.06, 0.03, 0.03, 0.05, 0.03, 0.04, 0.06, 0.03, 0.03, 0.05, 0.03, 0.04, 0.03, 0.06]

function Barcode({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  let cursor = x
  const bars: ReactNode[] = []
  BARS.forEach((bar, index) => {
    const w = (bar * width) / 0.7
    if (index % 2 === 0) bars.push(<rect key={index} x={cursor} y={y} width={w} height={height} fill="#26221c" />)
    cursor += w
  })
  return <g>{bars}</g>
}

function Portrait({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g>
      <rect x={x} y={y} width={size * 0.74} height={size} fill="#dfe4ee" stroke="#8d96a8" strokeWidth=".02" />
      <circle cx={x + size * 0.37} cy={y + size * 0.37} r={size * 0.17} fill="#8d96a8" />
      <path d={`M${x + size * 0.07} ${y + size} Q${x + size * 0.37} ${y + size * 0.58} ${x + size * 0.67} ${y + size}`} fill="#8d96a8" />
    </g>
  )
}

/** 수험표, lying down. */
const ticketWide: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-h`} stops={[[0, '#33477f'], [1, '#222f58']]} />
    </defs>
    <rect x=".08" y=".1" width="2.84" height="1.8" rx=".08" fill="#fffdf6" stroke={INK} strokeWidth=".02" />
    <path d="M.08 .18 a.08 .08 0 0 1 .08 -.08 H2.84 a.08 .08 0 0 1 .08 .08 V.56 H.08 Z" fill={`url(#${id}-h)`} />
    <text x=".26" y=".43" fontSize=".28" fontWeight="900" fill="#fff" letterSpacing="-.01em">
      수험표
    </text>
    <text x="2.74" y=".42" fontSize=".15" fontWeight="800" fill="#c8d1f0" textAnchor="end">
      CSAT
    </text>
    <Portrait x={0.24} y={0.74} size={0.92} />
    <path d="M1.4 .84 H2.0 M1.4 1.1 H2.0 M1.4 1.36 H2.0" stroke="#8b8478" strokeWidth=".06" strokeLinecap="round" />
    <path d="M2.08 .84 H2.72 M2.08 1.1 H2.62 M2.08 1.36 H2.7" stroke="#2d2a24" strokeWidth=".06" strokeLinecap="round" />
    <Barcode x={1.4} y={1.55} width={1.32} height={0.24} />
  </g>
)

/** 수험표, standing up. */
const ticketTall: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-h`} stops={[[0, '#33477f'], [1, '#222f58']]} />
    </defs>
    <rect x=".1" y=".08" width="1.8" height="2.84" rx=".08" fill="#fffdf6" stroke={INK} strokeWidth=".02" />
    <path d="M.1 .16 a.08 .08 0 0 1 .08 -.08 H1.82 a.08 .08 0 0 1 .08 .08 V.56 H.1 Z" fill={`url(#${id}-h)`} />
    <text x=".26" y=".43" fontSize=".28" fontWeight="900" fill="#fff" letterSpacing="-.01em">
      수험표
    </text>
    <Portrait x={0.26} y={0.76} size={0.88} />
    <path d="M1.2 .86 H1.76 M1.2 1.12 H1.7 M1.2 1.38 H1.76" stroke="#2d2a24" strokeWidth=".06" strokeLinecap="round" />
    <path d="M.26 1.9 H1.74 M.26 2.1 H1.5" stroke="#8b8478" strokeWidth=".06" strokeLinecap="round" />
    <Barcode x={0.3} y={2.38} width={1.4} height={0.3} />
  </g>
)

/** 문제집 */
const workbook: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-c`} stops={[[0, '#f4735a'], [1, '#cf3f2b']]} />
    </defs>
    <rect x="2.62" y=".14" width=".3" height="2.72" rx=".04" fill="#f6efe0" stroke={INK} strokeWidth=".02" />
    <path d="M2.7 .3 V2.7 M2.78 .3 V2.7 M2.86 .3 V2.7" stroke="#cdbf9f" strokeWidth=".025" />
    <rect x=".1" y=".08" width="2.66" height="2.84" rx=".08" fill={`url(#${id}-c)`} stroke={INK} strokeWidth=".02" />
    <rect x=".1" y=".08" width=".3" height="2.84" rx=".06" fill="#a82d1d" />
    <path d="M.25 .3 V.7 M.25 1.1 V1.5 M.25 1.9 V2.3 M.25 2.6 V2.8" stroke="#ffb8a8" strokeOpacity=".7" strokeWidth=".04" strokeLinecap="round" />
    <rect x=".62" y=".34" width="1.8" height=".36" rx=".06" fill="#fff" opacity=".92" />
    <path d="M.78 .52 H1.5" stroke="#cf3f2b" strokeWidth=".07" strokeLinecap="round" />
    <text x=".6" y="1.08" fontSize=".22" fontWeight="800" fill="#ffe4dc" letterSpacing=".02em">
      실전 모의고사
    </text>
    <text x="1.5" y="2.02" fontSize=".92" fontWeight="900" fill="#fff" textAnchor="middle" letterSpacing="-.04em">
      N제
    </text>
    <rect x=".62" y="2.3" width="1.8" height=".05" fill="#fff" opacity=".6" />
    <path d="M.62 2.5 H1.7" stroke="#ffd6cc" strokeWidth=".06" strokeLinecap="round" />
  </g>
)

/** 삼각자: translucent, with a window and marks along both short sides. */
const triangle: Draw = (id) => {
  const ticks = Array.from({ length: 12 }, (_, index) => 0.28 + index * 0.13)
  return (
    <g>
      <defs>
        <Grad id={`${id}-t`} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#8df0e0'], [1, '#2fb8a6']]} />
      </defs>
      <path d="M.06 .06 H1.94 L.06 1.94 Z M.4 .4 V1.08 H.98 Z" fillRule="evenodd" fill={`url(#${id}-t)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
      <path d="M.4 .4 V1.08 L1.08 .4 Z" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth=".02" />
      {ticks.map((position, index) => (
        <g key={position}>
          <path d={`M${position} .06 V${index % 5 === 0 ? 0.26 : 0.17}`} stroke="#0d5a50" strokeWidth=".026" />
          <path d={`M.06 ${position} H${index % 5 === 0 ? 0.26 : 0.17}`} stroke="#0d5a50" strokeWidth=".026" />
        </g>
      ))}
    </g>
  )
}

/** 곱자: a steel L, marked on every edge. */
const square: Draw = (id) => {
  const ticks = Array.from({ length: 24 }, (_, index) => 0.28 + index * 0.11)
  return (
    <g>
      <defs>
        <Grad id={`${id}-s`} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#f1f4f8'], [0.5, '#c2cad7'], [1, '#98a3b5']]} />
      </defs>
      <path d="M.06 .06 H2.94 V.94 H.94 V2.94 H.06 Z" fill={`url(#${id}-s)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
      {ticks.map((position, index) => {
        const long = index % 5 === 0
        return (
          <g key={position}>
            <path d={`M${position} .06 V${long ? 0.3 : 0.18}`} stroke="#2a3446" strokeWidth=".026" />
            <path d={`M.06 ${position} H${long ? 0.3 : 0.18}`} stroke="#2a3446" strokeWidth=".026" />
            {position > 1.1 && <path d={`M${position} .94 V${long ? 0.7 : 0.82}`} stroke="#2a3446" strokeWidth=".026" />}
            {position > 1.1 && <path d={`M.94 ${position} H${long ? 0.7 : 0.82}`} stroke="#2a3446" strokeWidth=".026" />}
          </g>
        )
      })}
      <circle cx="2.7" cy=".5" r=".1" fill="#5d6a80" />
      <circle cx=".5" cy="2.7" r=".1" fill="#5d6a80" />
      <path d="M.2 .2 H2.8" stroke="#fff" strokeOpacity=".6" strokeWidth=".03" />
    </g>
  )
}

/** 가위: closed, blades up, two finger rings below. */
const scissors: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-bl`} x1={0} y1={0} x2={1} y2={0} stops={[[0, '#e8ecf2'], [0.5, '#fafbfd'], [1, '#a4adbd']]} />
      <Grad id={`${id}-r1`} stops={[[0, '#ff6a64'], [1, '#c92c2c']]} />
      <Grad id={`${id}-r2`} stops={[[0, '#4a4e5a'], [1, '#22252d']]} />
    </defs>
    <path d="M.5 .06 L.78 1.74 H.3 L.28 1.7 Z" fill={`url(#${id}-bl)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <path d="M.5 .08 L.52 1.7" stroke="#7c8699" strokeWidth=".03" />
    <path d="M.34 1.7 L.14 2.22 H.52 L.54 1.7 Z" fill={`url(#${id}-r1)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <path d="M.6 1.7 L.98 2.16 H1.46 L.8 1.7 Z" fill={`url(#${id}-r2)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <circle cx=".56" cy="2.56" r=".42" fill={`url(#${id}-r1)`} stroke={INK} strokeWidth=".02" />
    <circle cx=".56" cy="2.56" r=".23" fill="#2d2a24" opacity=".85" />
    <circle cx="1.5" cy="2.56" r=".42" fill={`url(#${id}-r2)`} stroke={INK} strokeWidth=".02" />
    <circle cx="1.5" cy="2.56" r=".23" fill="#2d2a24" opacity=".85" />
    <circle cx=".52" cy="1.54" r=".085" fill="#d8a93a" stroke={INK} strokeWidth=".015" />
    <path d="M.42 2.32 q.1 -.14 .26 -.12" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".04" strokeLinecap="round" />
  </g>
)

/** 도장: a wooden grip, a wooden collar, and the red face. */
const stamp: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-w`} x1={0} y1={0} x2={1} y2={0} stops={[[0, '#b97a43'], [0.45, '#e2ac72'], [1, '#9a5f30']]} />
      <Grad id={`${id}-w2`} stops={[[0, '#a2662f'], [1, '#5f3a1a']]} />
      <Grad id={`${id}-f`} stops={[[0, '#ef4a3b'], [1, '#b32218']]} />
    </defs>
    <path d="M1.26 1.0 V.3 Q1.26 .06 1.5 .06 Q1.74 .06 1.74 .3 V1.0 Z" fill={`url(#${id}-w)`} stroke={INK} strokeWidth=".02" strokeLinejoin="round" />
    <path d="M1.26 .4 H1.74 M1.26 .66 H1.74" stroke="#6a3f1b" strokeOpacity=".6" strokeWidth=".035" />
    <ellipse cx="1.44" cy=".2" rx=".1" ry=".05" fill="#fff" opacity=".5" />
    <rect x=".12" y="1.0" width="2.76" height=".42" rx=".1" fill={`url(#${id}-w2)`} stroke={INK} strokeWidth=".02" />
    <rect x=".2" y="1.04" width="2.6" height=".06" rx=".03" fill="#fff" opacity=".25" />
    <rect x=".26" y="1.42" width="2.48" height=".5" rx=".07" fill={`url(#${id}-f)`} stroke={INK} strokeWidth=".02" />
    <path d="M.5 1.64 q.15 -.14 .3 0 t.3 0 t.3 0 t.3 0 t.3 0 t.3 0 t.3 0" fill="none" stroke="#ffb3a8" strokeOpacity=".5" strokeWidth=".04" strokeLinecap="round" />
  </g>
)

/** 접이 메모: two sheets joined by a fold, in a zigzag. */
const notefold: Draw = (id) => (
  <g>
    <defs>
      <Grad id={`${id}-n1`} stops={[[0, '#d9cbff'], [1, '#b79fff']]} />
      <Grad id={`${id}-n2`} stops={[[0, '#c9b6ff'], [1, '#9f84f0']]} />
      <Grad id={`${id}-f`} stops={[[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(40,20,90,.34)'], [1, 'rgba(0,0,0,0)']]} />
    </defs>
    <rect x=".08" y="1.04" width="1.86" height=".88" rx=".05" fill={`url(#${id}-n2)`} stroke={INK} strokeWidth=".02" />
    <rect x="1.06" y=".1" width="1.86" height=".88" rx=".05" fill={`url(#${id}-n1)`} stroke={INK} strokeWidth=".02" />
    <rect x="1.04" y=".84" width=".92" height=".32" fill={`url(#${id}-f)`} />
    <path d="M1.3 .34 H2.66 M1.3 .56 H2.5 M1.3 .78 H2.3" stroke="#6b4fc7" strokeOpacity=".45" strokeWidth=".04" strokeLinecap="round" />
    <path d="M.3 1.3 H1.66 M.3 1.52 H1.5 M.3 1.74 H1.3" stroke="#4d34a8" strokeOpacity=".4" strokeWidth=".04" strokeLinecap="round" />
    <circle cx="2.78" cy=".24" r=".05" fill="#6b4fc7" opacity=".5" />
    <circle cx=".22" cy="1.8" r=".05" fill="#4d34a8" opacity=".5" />
  </g>
)

type Art = { draw: Draw; portrait?: Draw }

const ART: Readonly<Record<ItemKind, Art>> = {
  1: { draw: eraser },
  2: { draw: clip },
  3: { draw: highlighter },
  4: { draw: pencil },
  5: { draw: ruler },
  6: { draw: sticky },
  7: { draw: ticketWide, portrait: ticketTall },
  8: { draw: workbook },
  9: { draw: triangle },
  10: { draw: square },
  11: { draw: scissors },
  12: { draw: stamp },
  13: { draw: notefold },
}

const cleanId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '')

type Props = {
  kind: ItemKind
  /** The cells of the block, anywhere on the desk. */
  cells: Cells
  /** If given, only these cells are shown (what is left of a piece after some of it cleared). */
  visible?: ReadonlySet<string>
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/**
 * The object for a block, drawn over its bounding box. The box is as wide and
 * tall as the block in cells; the caller sizes the element.
 */
export function PieceArt({ kind, cells, visible, className, style, 'data-testid': testId }: Props) {
  const uid = cleanId(useId())
  const box = normalize(cells)
  const canonical = CANONICAL[kind]!
  const art = ART[kind]!

  const turned = findTransform(canonical, cells)
  const portrait = art.portrait !== undefined && box.height > box.width
  const matrix = portrait ? null : turned?.matrix ?? [1, 0, 0, 1, 0, 0]
  const body = portrait ? art.portrait!(uid) : art.draw(uid)

  // What is left of a piece after a clear: keep only the cells that remain, closing the gaps between them.
  const top = Math.min(...cells.map(([r]) => r))
  const left = Math.min(...cells.map(([, c]) => c))
  const keep = visible
    ? cells.filter(([r, c]) => visible.has(`${r},${c}`)).map(([r, c]) => [r - top, c - left] as const)
    : null
  const clipId = `${uid}-clip`
  const kept = keep ? new Set(keep.map(([r, c]) => `${r},${c}`)) : null

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      data-testid={testId}
      data-kind={itemOf(kind).id}
    >
      {keep && kept && (
        <clipPath id={clipId}>
          {keep.map(([r, c]) => (
            <rect key={`${r},${c}`} x={c - (kept.has(`${r},${c - 1}`) ? 0.1 : 0)} y={r - (kept.has(`${r - 1},${c}`) ? 0.1 : 0)} width={1 + (kept.has(`${r},${c - 1}`) ? 0.1 : 0) + (kept.has(`${r},${c + 1}`) ? 0.1 : 0)} height={1 + (kept.has(`${r - 1},${c}`) ? 0.1 : 0) + (kept.has(`${r + 1},${c}`) ? 0.1 : 0)} />
          ))}
        </clipPath>
      )}
      <g clipPath={keep ? `url(#${clipId})` : undefined}>
        <g transform={matrix ? `matrix(${matrix.join(' ')})` : undefined}>{body}</g>
      </g>
    </svg>
  )
}
