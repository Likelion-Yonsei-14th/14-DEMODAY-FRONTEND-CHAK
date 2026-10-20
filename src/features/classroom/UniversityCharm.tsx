import { useId } from 'react'
import type { University, UniversityCharmShape } from './universities'

const WHITE = '#FBFAF6'
/** Sticker-book outline colour shared with the illustrated assets */
const INK = '#4A3426'
const DISPLAY_FONT = "Impact, 'Arial Black', 'Pretendard', sans-serif"
const TEXT_FONT = "'Pretendard', 'Apple SD Gothic Neo', sans-serif"

/** Outline of each acrylic piece, in a 100 × 148 box under the clasp. */
const outlines: Record<UniversityCharmShape, string> = {
  jersey:
    'M31 50 L40 50 Q50 64 60 50 L69 50 L71 63 Q75 72 82 74 L82 144 L18 144 L18 74 Q25 72 29 63 Z',
  jacket:
    'M36 52 L44 50 L50 60 L56 50 L64 52 L74 58 Q84 64 86 76 L88 132 L76 134 L72 92 L72 144 L28 144 L28 92 L24 134 L12 132 L14 76 Q16 64 26 58 Z',
  pennant: 'M20 48 L80 48 L50 146 Z',
  badge: 'M50 52 A44 44 0 1 1 49.99 52 Z',
  letter: '',
  shield:
    'M20 50 L80 50 L80 100 Q80 132 50 146 Q20 132 20 100 Z',
}

/**
 * Acrylic keyring "university goods" charm, drawn in code from simple
 * generic shapes (jersey, varsity jacket, pennant, round badge, initial,
 * shield) so no school's trademarked artwork is reproduced.
 */
export function UniversityCharm({
  school,
  shape,
}: {
  school: University
  shape: UniversityCharmShape
}) {
  const uid = useId().replace(/:/g, '')
  const initial = school.word[0] ?? 'U'
  const outline = outlines[shape]

  // The piece itself, coloured; drawn once as the clear acrylic edge
  // (thick white stroke) and once as the printed artwork.
  const artwork = (() => {
    switch (shape) {
      case 'jersey':
        return (
          <>
            <path d={outline} fill={school.color} />
            <path d="M40 50 Q50 64 60 50" fill="none" stroke={WHITE} strokeWidth="2.6" />
            <path d="M29 63 Q25 72 18 74" fill="none" stroke={WHITE} strokeWidth="2.4" />
            <path d="M71 63 Q75 72 82 74" fill="none" stroke={WHITE} strokeWidth="2.4" />
            <text x="50" y="99" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="28" fill={school.ink}>
              {initial}
            </text>
            <FitText x={50} y={114} width={52} size={9} fill={school.ink} font={DISPLAY_FONT}>
              {school.word}
            </FitText>
            <text x="50" y="134" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="13" fill={school.ink} opacity=".9">
              26
            </text>
          </>
        )
      case 'jacket':
        return (
          <>
            <path d={outline} fill={WHITE} />
            <path d="M36 52 L44 50 L50 60 L56 50 L64 52 L72 58 L72 144 L28 144 L28 58 Z" fill={school.color} />
            <path d="M44 50 L50 60 L56 50" fill="none" stroke={WHITE} strokeWidth="2.2" />
            <rect x="28" y="136" width="44" height="3" fill={WHITE} />
            <rect x="12.5" y="124" width="12" height="2.4" fill={school.color} transform="rotate(4 18 125)" />
            <rect x="75.5" y="124" width="12" height="2.4" fill={school.color} transform="rotate(-4 82 125)" />
            {[72, 86, 100, 114, 128].map((y) => (
              <circle key={y} cx="50" cy={y} r="1.3" fill={WHITE} opacity=".85" />
            ))}
            <text x="39" y="92" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="17" fill={school.ink === '#FFFFFF' ? '#F2C94C' : school.ink}>
              {initial}
            </text>
            <FitText x={61} y={91} width={18} size={5.4} fill={WHITE} font={DISPLAY_FONT}>
              {school.word}
            </FitText>
          </>
        )
      case 'pennant':
        return (
          <>
            <path d={outline} fill={school.color} />
            <rect x="20" y="48" width="60" height="8" fill={WHITE} />
            <text x="50" y="80" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="18" fill={school.ink}>
              {initial}
            </text>
            <g transform="rotate(90 50 100)">
              <FitText x={50} y={103} width={34} size={8} fill={school.ink} font={DISPLAY_FONT}>
                {school.word}
              </FitText>
            </g>
          </>
        )
      case 'badge':
        return (
          <>
            <path d={outline} fill={school.color} />
            <circle cx="50" cy="96" r="31" fill={WHITE} />
            <circle cx="50" cy="96" r="27" fill={school.color} />
            <path id={`${uid}-arc`} d="M15 96 A35 35 0 0 1 85 96" fill="none" />
            <text fontFamily={TEXT_FONT} fontWeight="800" fontSize="7.4" letterSpacing=".6" fill={WHITE}>
              <textPath href={`#${uid}-arc`} startOffset="50%" textAnchor="middle">
                {`${school.word} UNIVERSITY`}
              </textPath>
            </text>
            <text x="50" y="135" textAnchor="middle" fontFamily={TEXT_FONT} fontWeight="800" fontSize="6.2" fill={WHITE}>
              ★ ★ ★
            </text>
            <text x="50" y="108" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="32" fill={school.ink}>
              {initial}
            </text>
          </>
        )
      case 'letter':
        return (
          <>
            <text x="50" y="140" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="104" fill={school.color}>
              {initial}
            </text>
            <FitText x={50} y={102} width={30} size={6} fill={school.ink} font={TEXT_FONT} weight={800}>
              {school.word}
            </FitText>
          </>
        )
      case 'shield':
        return (
          <>
            <path d={outline} fill={school.color} />
            <path
              d="M25 55 L75 55 L75 100 Q75 128 50 140 Q25 128 25 100 Z"
              fill="none"
              stroke={WHITE}
              strokeWidth="1.6"
            />
            <rect x="25" y="68" width="50" height="14" fill={WHITE} />
            <FitText x={50} y={78.5} width={42} size={9} fill={school.color} font={DISPLAY_FONT}>
              {school.word}
            </FitText>
            <text x="50" y="122" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="30" fill={school.ink}>
              {initial}
            </text>
          </>
        )
    }
  })()

  // Clear acrylic edge around the printed piece
  const edge =
    shape === 'letter' ? (
      <>
        <text
          x="50"
          y="140"
          textAnchor="middle"
          fontFamily={DISPLAY_FONT}
          fontSize="104"
          fill={INK}
          stroke={INK}
          strokeWidth="11.5"
          strokeLinejoin="round"
        >
          {initial}
        </text>
        <text
          x="50"
          y="140"
          textAnchor="middle"
          fontFamily={DISPLAY_FONT}
          fontSize="104"
          fill={WHITE}
          stroke={WHITE}
          strokeWidth="9"
          strokeLinejoin="round"
        >
          {initial}
        </text>
      </>
    ) : (
      <>
        <path d={outline} fill={INK} stroke={INK} strokeWidth="10.5" strokeLinejoin="round" />
        <path d={outline} fill={WHITE} stroke={WHITE} strokeWidth="8" strokeLinejoin="round" />
      </>
    )

  return (
    <svg
      className="university-charm"
      viewBox="0 0 100 148"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F4F4F2" />
          <stop offset=".45" stopColor="#A9ABAD" />
          <stop offset=".7" stopColor="#E3E4E3" />
          <stop offset="1" stopColor="#7E8183" />
        </linearGradient>
        <linearGradient id={`${uid}-gloss`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Lobster clasp, small ring and jump ring */}
      <g fill="none" stroke={`url(#${uid}-metal)`} strokeLinecap="round">
        <path d="M45 24 L45 9 Q45 2 50 2 Q56 2 56 9 L56 18" strokeWidth="3.4" />
        <rect x="42" y="18" width="16" height="8" rx="2" fill={`url(#${uid}-metal)`} strokeWidth="0" />
        <circle cx="50" cy="33" r="5" strokeWidth="2.2" />
        <circle cx="50" cy="43" r="4" strokeWidth="2" />
      </g>

      <g className="university-charm__edge" opacity=".94">
        {edge}
      </g>
      <g>{artwork}</g>
      {shape !== 'letter' && (
        <path d={outline} fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      )}
      {/* Glossy acrylic sheen */}
      {shape !== 'letter' && (
        <path d={outline} fill={`url(#${uid}-gloss)`} />
      )}
      <circle cx="50" cy="47" r="2.2" fill="#d9d6cf" stroke="#9a9792" strokeWidth=".6" />
    </svg>
  )
}

function FitText({
  x,
  y,
  width,
  size,
  fill,
  font,
  weight,
  children,
}: {
  x: number
  y: number
  width: number
  size: number
  fill: string
  font: string
  weight?: number
  children: string
}) {
  // Short words keep their natural width; long ones squeeze to fit.
  const natural = children.length * size * 0.56
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={font}
      fontWeight={weight}
      fontSize={size}
      fill={fill}
      {...(natural > width
        ? { textLength: width, lengthAdjust: 'spacingAndGlyphs' as const }
        : {})}
    >
      {children}
    </text>
  )
}
