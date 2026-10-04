import { RoughWordArtDefs } from './RoughWordArtDefs'

export function ReasonWordArt({ className }: { className?: string }) {
  const { gradientId, roughId, defs } = RoughWordArtDefs({
    gradientFrom: '#74C7FF',
    gradientTo: '#3C9EE8',
  })

  return (
    <svg
      className={className}
      viewBox="0 0 230 130"
      role="img"
      aria-label="이유"
      preserveAspectRatio="xMidYMid meet"
    >
      {defs}
      <g
        filter={`url(#${roughId})`}
        fontFamily="'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
        fontWeight="900"
        fontSize="84"
        stroke="#080808"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
      >
        <text
          x="17"
          y="95"
          fill={`url(#${gradientId})`}
          transform="rotate(-1.8 17 95) scale(.96 1.04)"
        >
          이
        </text>
        <text
          x="123"
          y="91"
          fill={`url(#${gradientId})`}
          transform="rotate(2.4 123 91) scale(1.03 .98)"
        >
          유
        </text>
      </g>

      <circle cx="30" cy="28" r="9" fill="#67BDF5" stroke="#080808" strokeWidth="5" />
      <circle cx="194" cy="24" r="8" fill="#8FD2FF" stroke="#080808" strokeWidth="5" />
    </svg>
  )
}
