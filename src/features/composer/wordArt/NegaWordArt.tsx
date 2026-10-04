import { RoughWordArtDefs } from './RoughWordArtDefs'

export function NegaWordArt({ className }: { className?: string }) {
  const { gradientId, roughId, highlightId, defs } = RoughWordArtDefs({
    gradientFrom: '#FFC4DC',
    gradientTo: '#F17FB1',
  })

  return (
    <svg
      className={className}
      viewBox="0 0 250 126"
      role="img"
      aria-label="네가"
      preserveAspectRatio="xMidYMid meet"
    >
      {defs}
      <g
        filter={`url(#${roughId})`}
        fontFamily="'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
        fontWeight="900"
        fontSize="82"
        stroke="#080808"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
      >
        <text
          x="15"
          y="92"
          fill={`url(#${gradientId})`}
          transform="rotate(-2 15 92) scale(.96 1.05)"
        >
          네
        </text>
        <text
          x="126"
          y="91"
          fill={`url(#${gradientId})`}
          transform="rotate(2.2 126 91) scale(1.03 .98)"
        >
          가
        </text>
      </g>
      <path
        d="M31 26C63 18 94 18 111 24"
        fill="none"
        stroke={`url(#${highlightId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  )
}
