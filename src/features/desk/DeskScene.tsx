import type { DeskObjectType } from '@/types'
import './DeskScene.css'

type DeskSceneProps = {
  ownerName: string
  extraObjectType?: DeskObjectType
  highlightExtraObject?: boolean
}

export function DeskScene({
  ownerName,
  extraObjectType,
  highlightExtraObject = false,
}: DeskSceneProps) {
  return (
    <div className="desk-scene" aria-label={`${ownerName}의 공부 책상`}>
      <svg
        className="desk-scene__svg"
        viewBox="0 0 390 500"
        role="img"
        aria-label={`${ownerName}의 책상 위에 스탠드, 책과 식물이 놓여 있어요.`}
      >
        <defs>
          <linearGradient id="room-wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FBF6EE" />
            <stop offset=".52" stopColor="#F5EBDD" />
            <stop offset="1" stopColor="#EEDFCC" />
          </linearGradient>

          <linearGradient id="desk-surface" x1=".08" y1="0" x2=".92" y2="1">
            <stop offset="0" stopColor="#F4DFC9" />
            <stop offset=".48" stopColor="#EBCDB1" />
            <stop offset="1" stopColor="#DDB99B" />
          </linearGradient>

          <linearGradient id="desk-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9AF90" />
            <stop offset="1" stopColor="#C89273" />
          </linearGradient>

          <linearGradient id="lamp-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#CBB4C5" />
            <stop offset=".48" stopColor="#AE92AA" />
            <stop offset="1" stopColor="#8F748C" />
          </linearGradient>

          <linearGradient id="lamp-shade" x1=".1" y1=".05" x2=".9" y2=".95">
            <stop offset="0" stopColor="#DCCADB" />
            <stop offset=".46" stopColor="#B89FB7" />
            <stop offset="1" stopColor="#967B94" />
          </linearGradient>

          <linearGradient id="book-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#B8C9D8" />
            <stop offset="1" stopColor="#879EB5" />
          </linearGradient>

          <linearGradient id="book-sage" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#CFD7C1" />
            <stop offset="1" stopColor="#9FAC91" />
          </linearGradient>

          <linearGradient id="book-cream" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF7E9" />
            <stop offset="1" stopColor="#E7D6BD" />
          </linearGradient>

          <linearGradient id="pot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E9B89A" />
            <stop offset=".56" stopColor="#D99E7B" />
            <stop offset="1" stopColor="#BC7F61" />
          </linearGradient>

          <radialGradient id="window-light" cx=".83" cy=".06" r=".74">
            <stop offset="0" stopColor="#FFF4D1" stopOpacity=".82" />
            <stop offset=".45" stopColor="#FFEAC0" stopOpacity=".24" />
            <stop offset="1" stopColor="#FFF8EA" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="lamp-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#FFF1C6" stopOpacity=".46" />
            <stop offset="1" stopColor="#FFF1C6" stopOpacity="0" />
          </radialGradient>

          <filter id="scene-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="9"
              stdDeviation="9"
              floodColor="#79573F"
              floodOpacity=".13"
            />
          </filter>

          <filter id="object-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="5"
              floodColor="#694D3A"
              floodOpacity=".18"
            />
          </filter>

          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="5"
              floodColor="#F2A48F"
              floodOpacity=".7"
            />
          </filter>
        </defs>

        <g className="desk-scene__room">
          <rect width="390" height="500" fill="url(#room-wall)" />
          <rect width="390" height="500" fill="url(#window-light)" />

          <path
            d="M0 114C94 101 196 103 390 116"
            fill="none"
            stroke="#E2CDB8"
            strokeWidth="2"
            opacity=".42"
          />
          <path
            d="M300 0H390V138L347 154L304 114Z"
            fill="#FFF4D8"
            opacity=".24"
          />
        </g>

        <g className="desk-scene__table" filter="url(#scene-shadow)">
          <path
            d="M18 145H372L404 447L-14 463Z"
            fill="url(#desk-surface)"
          />
          <path
            d="M-14 463L404 447V500H-14Z"
            fill="url(#desk-edge)"
          />

          <path
            d="M28 166C122 158 258 159 363 167"
            fill="none"
            stroke="#FFF0DE"
            strokeWidth="2.5"
            opacity=".5"
          />
          <path
            d="M44 306C137 296 254 295 357 301"
            fill="none"
            stroke="#C79777"
            strokeWidth="1.6"
            opacity=".16"
          />
          <path
            d="M12 421C126 411 268 409 391 415"
            fill="none"
            stroke="#C79777"
            strokeWidth="1.4"
            opacity=".13"
          />

          <ellipse
            cx="194"
            cy="474"
            rx="167"
            ry="13"
            fill="#8C6755"
            opacity=".08"
          />
        </g>

        <g className="desk-scene__decor" filter="url(#object-shadow)">
          <g className="desk-scene__lamp">
            <ellipse
              cx="45"
              cy="204"
              rx="34"
              ry="10"
              fill="#7D665F"
              opacity=".13"
            />
            <ellipse
              cx="43"
              cy="197"
              rx="29"
              ry="9"
              fill="url(#lamp-metal)"
            />
            <ellipse
              cx="43"
              cy="194"
              rx="24"
              ry="6"
              fill="#D4C0CF"
              opacity=".72"
            />

            <path
              d="M44 190L52 141"
              stroke="url(#lamp-metal)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx="52" cy="141" r="6" fill="#9E859C" />
            <path
              d="M56 137L91 113"
              stroke="url(#lamp-metal)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx="91" cy="113" r="6" fill="#9A8198" />

            <path
              d="M82 98C106 95 122 105 127 126L84 134C80 120 78 107 82 98Z"
              fill="url(#lamp-shade)"
            />
            <path
              d="M86 105C102 102 114 108 119 120"
              fill="none"
              stroke="#EADDE9"
              strokeWidth="3"
              strokeLinecap="round"
              opacity=".58"
            />
            <ellipse
              cx="108"
              cy="151"
              rx="62"
              ry="42"
              fill="url(#lamp-glow)"
              opacity=".68"
            />
          </g>

          <g className="desk-scene__plant">
            <ellipse
              cx="338"
              cy="171"
              rx="31"
              ry="9"
              fill="#76533E"
              opacity=".11"
            />

            <path
              d="M331 137C316 125 315 105 327 91C338 105 339 123 331 137Z"
              fill="#789A69"
            />
            <path
              d="M337 140C342 116 359 107 374 111C368 130 355 141 337 140Z"
              fill="#9CB781"
            />
            <path
              d="M327 143C311 132 297 135 287 145C300 156 315 155 327 143Z"
              fill="#6E8D64"
            />
            <path
              d="M340 143C350 132 364 133 374 142C365 153 351 155 340 143Z"
              fill="#87A775"
            />
            <path
              d="M333 128L333 153"
              stroke="#677E5E"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <ellipse cx="334" cy="153" rx="24" ry="7" fill="#F1C3A5" />
            <path
              d="M311 153H357L351 182C350 188 344 192 334 192C324 192 318 188 317 182Z"
              fill="url(#pot)"
            />
            <ellipse
              cx="334"
              cy="154"
              rx="18"
              ry="4.5"
              fill="#A96E51"
              opacity=".48"
            />
            <path
              d="M319 167C329 171 340 171 351 166"
              fill="none"
              stroke="#F2C5A9"
              strokeWidth="2"
              opacity=".36"
            />
          </g>

          <g className="desk-scene__books">
            <ellipse
              cx="303"
              cy="201"
              rx="50"
              ry="11"
              fill="#785A45"
              opacity=".1"
            />

            <path
              d="M262 181L340 175L349 190L271 197Z"
              fill="url(#book-blue)"
            />
            <path
              d="M271 197L349 190V196L271 204Z"
              fill="#6F8499"
              opacity=".72"
            />
            <path
              d="M259 171L329 166L339 180L268 186Z"
              fill="url(#book-sage)"
            />
            <path
              d="M268 186L339 180V185L268 192Z"
              fill="#849276"
              opacity=".72"
            />
            <path
              d="M269 160L336 157L341 169L273 174Z"
              fill="url(#book-cream)"
            />
            <path
              d="M276 163L326 161"
              stroke="#B9AA98"
              strokeWidth="2"
              strokeLinecap="round"
              opacity=".62"
            />
          </g>
        </g>

        {extraObjectType && (
          <g
            className={
              highlightExtraObject
                ? 'desk-scene__extra desk-scene__extra--highlight'
                : 'desk-scene__extra'
            }
            filter={
              highlightExtraObject
                ? 'url(#glow)'
                : 'url(#object-shadow)'
            }
          >
            <rect
              x="151"
              y="250"
              width="88"
              height="69"
              rx="10"
              fill="#FFF8F1"
            />
            <rect
              x="157"
              y="256"
              width="76"
              height="57"
              rx="8"
              fill="#F4C6BC"
            />
            <path
              d="M169 272H218M169 283H211M169 294H215"
              stroke="#9B5E52"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="221" cy="302" r="5" fill="#E7C95E" />
          </g>
        )}
      </svg>

      <div className="desk-scene__light" aria-hidden />
    </div>
  )
}
