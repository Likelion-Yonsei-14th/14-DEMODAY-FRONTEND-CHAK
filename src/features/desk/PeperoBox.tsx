import {
  getPeperoDesign,
  type PeperoDesign,
} from '@/features/supporter/peperoDesigns'

// Same warm brown line as the hand-drawn desk art (envelope, charms)
const INK = '#3B2416'
const BISCUIT = '#E2B16D'

/** One dipped stick, drawn upright; the caller rotates it. */
function Stick({ x, design }: { x: number; design: PeperoDesign }) {
  return (
    <g>
      <rect x={x} y={-6} width={4.2} height={46} rx={2.1} fill={BISCUIT} stroke={INK} strokeWidth={0.7} />
      <rect x={x - 0.4} y={40} width={5} height={60} rx={2.5} fill={design.coat} stroke={INK} strokeWidth={0.7} />
      {design.topping &&
        [44, 49, 54, 59, 64, 69, 74, 79].map((y, index) => (
          <ellipse
            key={y}
            cx={x + (index % 2 ? 1.3 : 3.1)}
            cy={y}
            rx={0.9}
            ry={0.6}
            fill={design.topping}
          />
        ))}
    </g>
  )
}

function Illustration({ design }: { design: PeperoDesign }) {
  switch (design.illustration) {
    case 'chocolate':
      return (
        <g stroke={INK} strokeWidth={0.8} strokeLinejoin="round">
          <g transform="rotate(-14 13 62)">
            <rect x={6} y={56} width={12} height={10} rx={1.2} fill="#4A2616" />
            <rect x={8} y={58} width={8} height={6} rx={0.8} fill="#6B3B22" strokeWidth={0.5} />
          </g>
          <g transform="rotate(12 22 70)">
            <rect x={17} y={65} width={10} height={8} rx={1.1} fill="#4A2616" />
            <rect x={18.8} y={66.6} width={6.4} height={4.8} rx={0.7} fill="#6B3B22" strokeWidth={0.5} />
          </g>
        </g>
      )
    case 'almond':
      return (
        <g stroke={INK} strokeWidth={0.8}>
          {[
            [11, 62, -30],
            [20, 66, 20],
            [13, 70, 70],
          ].map(([cx, cy, r]) => (
            <g key={`${cx}-${cy}`} transform={`rotate(${r} ${cx} ${cy})`}>
              <ellipse cx={cx} cy={cy} rx={3.4} ry={5.2} fill="#B9733D" />
              <path d={`M${cx} ${cy! - 3.6} q-1.2 3.6 0 7.2`} fill="none" stroke="#7E4722" strokeWidth={0.5} />
            </g>
          ))}
        </g>
      )
    case 'strawberry':
      return (
        <g stroke={INK} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M16 72 C7 66 7 58 12 57 C14 56.5 15.3 57.2 16 58 C16.7 57.2 18 56.5 20 57 C25 58 25 66 16 72 Z" fill="#E23B4E" />
          <path d="M11.5 57.4 L14 54.5 L16 56.8 L18 54.5 L20.5 57.4 Z" fill="#3E9A52" />
          {[
            [13, 61], [16, 60.5], [19, 61], [14.5, 64.5], [17.5, 64.5], [16, 68],
          ].map(([cx, cy]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={0.5} ry={0.8} fill="#FFE7A0" stroke="none" />
          ))}
        </g>
      )
    case 'cookie':
      return (
        <g stroke={INK} strokeWidth={0.8}>
          <ellipse cx={14} cy={66.5} rx={8.5} ry={4.2} fill="#2B1A14" />
          <rect x={5.5} y={61.6} width={17} height={3} fill="#F7F2E6" strokeWidth={0.5} />
          <ellipse cx={14} cy={61.2} rx={8.5} ry={4.2} fill="#3A231A" />
          {[10, 14, 18].map((cx) => (
            <circle key={cx} cx={cx} cy={61} r={0.7} fill="#5C3A2C" stroke="none" />
          ))}
        </g>
      )
  }
}

/**
 * A stick-snack box lying flat on the desk, drawn in the desk art's
 * hand-drawn style: bold flavor face, chocolate band with a chunky white
 * title, sticks running across the face and the flavor at the bottom.
 */
export function PeperoBox({ assetId }: { assetId?: string }) {
  const design = getPeperoDesign(assetId)
  const clip = `pepero-face-${design.id}`
  const light = design.illustration === 'cookie'

  return (
    <svg
      className="desk-object__pepero"
      viewBox="0 0 60 84"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <clipPath id={clip}>
          <rect x={2} y={2} width={56} height={80} rx={3.5} />
        </clipPath>
      </defs>

      <rect x={2} y={2} width={56} height={80} rx={3.5} fill={design.box} />

      <g clipPath={`url(#${clip})`}>
        {/* chocolate band behind the title, slanted bottom edge */}
        <path d="M0 12 H60 V33 L0 39 Z" fill={design.band} />

        {/* sticks running down the right side of the face */}
        <g transform="rotate(14 46 42)">
          <Stick x={40} design={design} />
          <Stick x={46.5} design={design} />
        </g>

        {/* brand badge: 착!, not a maker's logo */}
        <rect x={5} y={4.6} width={13} height={5.4} rx={2.7} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} />
        <text x={11.5} y={8.85} textAnchor="middle" fontSize={4.2} fontWeight={900} fill={light ? '#C9252C' : design.box}>
          착!
        </text>

        {/* chunky white title */}
        <text
          x={21}
          y={30}
          textAnchor="middle"
          fontSize={14.5}
          fontWeight={900}
          letterSpacing={-0.8}
          fill="#FFFFFF"
          stroke={INK}
          strokeWidth={1.6}
          paintOrder="stroke"
          transform="skewX(-8) translate(4 0)"
          fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
        >
          11.11
        </text>

        {/* ribbon with the flavor line */}
        <g transform="rotate(-5 20 40)">
          <rect x={6} y={37.2} width={30} height={5.4} rx={1} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} />
          <text
            x={21}
            y={41.1}
            textAnchor="middle"
            fontSize={design.english.length > 9 ? 2.9 : 3.5}
            fontWeight={800}
            letterSpacing={0.3}
            fill={design.band}
          >
            {design.english}
          </text>
        </g>

        <Illustration design={design} />

        {/* flavor label at the bottom */}
        <rect x={5} y={75} width={20} height={4.6} rx={0.8} fill={light ? design.band : '#FFFFFF'} />
        <text
          x={15}
          y={78.5}
          textAnchor="middle"
          fontSize={3.4}
          fontWeight={800}
          fill={light ? '#FFFFFF' : design.band}
        >
          {design.name}
        </text>

        {/* soft printed-card sheen */}
        <rect x={2} y={2} width={10} height={80} fill="rgba(255,255,255,.08)" />
      </g>

      <rect x={2} y={2} width={56} height={80} rx={3.5} fill="none" stroke={INK} strokeWidth={1.6} />
    </svg>
  )
}
