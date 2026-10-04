import { useId } from 'react'

type RoughWordArtDefsProps = {
  gradientFrom: string
  gradientTo: string
  accent?: string
}

export function RoughWordArtDefs({
  gradientFrom,
  gradientTo,
  accent = '#FFFFFF',
}: RoughWordArtDefsProps) {
  const id = useId().replace(/:/g, '')

  return {
    gradientId: `wordart-gradient-${id}`,
    roughId: `wordart-rough-${id}`,
    defs: (
      <defs>
        <linearGradient
          id={`wordart-gradient-${id}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={gradientFrom} />
          <stop offset="56%" stopColor={gradientTo} />
          <stop offset="100%" stopColor={gradientTo} />
        </linearGradient>

        <filter
          id={`wordart-rough-${id}`}
          x="-8%"
          y="-10%"
          width="116%"
          height="120%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.03"
            numOctaves="1"
            seed="12"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <radialGradient id={`wordart-highlight-${id}`} cx="32%" cy="18%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity=".72" />
          <stop offset="72%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
    ),
    highlightId: `wordart-highlight-${id}`,
  }
}
