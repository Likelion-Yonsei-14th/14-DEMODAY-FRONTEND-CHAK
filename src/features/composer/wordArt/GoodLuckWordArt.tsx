import { RoughWordArtDefs } from './RoughWordArtDefs'

export function GoodLuckWordArt({ className }: { className?: string }) {
  const { gradientId, roughId, defs } = RoughWordArtDefs({
    gradientFrom: '#FFE6A3',
    gradientTo: '#F7A986',
  })

  const chars = [
    { char: '잘', x: 9, y: 91, rotate: -3.2 },
    { char: '될', x: 104, y: 88, rotate: 1.5 },
    { char: '거', x: 211, y: 92, rotate: -1.5 },
    { char: '야', x: 313, y: 89, rotate: 2.6 },
  ]

  return (
    <svg
      className={className}
      viewBox="0 0 425 128"
      role="img"
      aria-label="잘 될 거야"
      preserveAspectRatio="xMidYMid meet"
    >
      {defs}
      <g
        filter={`url(#${roughId})`}
        fontFamily="'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
        fontWeight="900"
        fontSize="77"
        stroke="#080808"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
      >
        {chars.map(({ char, x, y, rotate }, index) => (
          <text
            key={char}
            x={x}
            y={y}
            fill={`url(#${gradientId})`}
            transform={`rotate(${rotate} ${x} ${y}) scale(${index % 2 === 0 ? .97 : 1.02} ${index % 2 === 0 ? 1.03 : .98})`}
          >
            {char}
          </text>
        ))}
      </g>

      <path
        d="M388 27l5 9 10 2-7 7 2 10-10-5-9 5 2-10-7-7 10-2z"
        fill="#F5B589"
        stroke="#080808"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
