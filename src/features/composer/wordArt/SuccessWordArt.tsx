import { RoughWordArtDefs } from './RoughWordArtDefs'

export function SuccessWordArt({ className }: { className?: string }) {
  const { gradientId, roughId, defs } = RoughWordArtDefs({
    gradientFrom: '#DCEBFF',
    gradientTo: '#A8C9F7',
  })

  const chars = [
    { char: '성', x: 10, y: 91, rotate: -3.2, sx: .95, sy: 1.02 },
    { char: '공', x: 111, y: 88, rotate: 1.5, sx: 1.01, sy: .97 },
    { char: '하', x: 214, y: 93, rotate: -1.2, sx: .96, sy: 1.04 },
    { char: '는', x: 319, y: 89, rotate: 2.3, sx: 1.03, sy: .98 },
  ]

  return (
    <svg
      className={className}
      viewBox="0 0 430 128"
      role="img"
      aria-label="성공하는"
      preserveAspectRatio="xMidYMid meet"
    >
      {defs}
      <g
        filter={`url(#${roughId})`}
        fontFamily="'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
        fontWeight="900"
        fontSize="78"
        stroke="#080808"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
      >
        {chars.map(({ char, x, y, rotate, sx, sy }) => (
          <text
            key={char}
            x={x}
            y={y}
            fill={`url(#${gradientId})`}
            transform={`rotate(${rotate} ${x} ${y}) scale(${sx} ${sy})`}
          >
            {char}
          </text>
        ))}
      </g>

      <circle cx="74" cy="108" r="9" fill="#A8C9F7" stroke="#080808" strokeWidth="5" />
      <circle cx="262" cy="110" r="8" fill="#BCD6FA" stroke="#080808" strokeWidth="5" />
    </svg>
  )
}
