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
        aria-label={`${ownerName}의 책상 위에 문제집, 타이머, 사진과 응원 오브젝트가 놓여 있어요.`}
      >
        <defs>
          <linearGradient id="room-wall" x1="0" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#FAF3E9" />
            <stop offset="0.55" stopColor="#F5EBDD" />
            <stop offset="1" stopColor="#EBDCCB" />
          </linearGradient>
          <linearGradient id="desk-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F1D7BF" />
            <stop offset="0.5" stopColor="#E8C4A6" />
            <stop offset="1" stopColor="#DDB495" />
          </linearGradient>
          <linearGradient id="desk-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D8B092" />
            <stop offset="1" stopColor="#C99C7F" />
          </linearGradient>
          <linearGradient id="book-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9DB2C8" />
            <stop offset="1" stopColor="#7089A5" />
          </linearGradient>
          <linearGradient id="book-sage" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#BFC8AF" />
            <stop offset="1" stopColor="#8FA081" />
          </linearGradient>
          <linearGradient id="timer-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFDF7" />
            <stop offset="1" stopColor="#D8D9D5" />
          </linearGradient>
          <linearGradient id="photo-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFDF9" />
            <stop offset="1" stopColor="#F0E7DB" />
          </linearGradient>
          <linearGradient id="coral-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6C3B7" />
            <stop offset="1" stopColor="#E88973" />
          </linearGradient>
          <linearGradient id="mint-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#DDEBCF" />
            <stop offset="1" stopColor="#AAC59A" />
          </linearGradient>
          <linearGradient id="yellow-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF1B6" />
            <stop offset="1" stopColor="#E9C95B" />
          </linearGradient>
          <radialGradient id="sun-light" cx="0.78" cy="0.08" r="0.72">
            <stop offset="0" stopColor="#FFF3CC" stopOpacity="0.86" />
            <stop offset="0.48" stopColor="#FFEAC3" stopOpacity="0.26" />
            <stop offset="1" stopColor="#FFF7E8" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#76563D" floodOpacity="0.14" />
          </filter>
          <filter id="object-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#654A38" floodOpacity="0.2" />
          </filter>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F2A48F" floodOpacity="0.7" />
          </filter>
        </defs>

        <g className="desk-scene__room">
          <rect width="390" height="500" fill="url(#room-wall)" />
          <rect width="390" height="500" fill="url(#sun-light)" />

          <g opacity="0.42">
            <path d="M292 0H390V228L340 242L292 178Z" fill="#FFF3D5" />
            <path d="M324 0V213" stroke="#D4B6A0" strokeWidth="3" />
          </g>

          <g className="desk-scene__shelf" filter="url(#soft-shadow)">
            <rect x="38" y="54" width="176" height="14" rx="7" fill="#D7AD8C" />
            <rect x="50" y="24" width="26" height="30" rx="5" fill="#9FAFC2" />
            <rect x="79" y="18" width="20" height="36" rx="4" fill="#C5B1CA" />
            <rect x="103" y="29" width="34" height="25" rx="4" fill="#E5C37A" />
            <rect x="142" y="17" width="52" height="37" rx="4" fill="#F5E9DA" />
            <path d="M151 29H184M151 36H177" stroke="#B7A99D" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g className="desk-scene__plant" filter="url(#object-shadow)">
            <path d="M252 79C250 59 258 44 272 34C276 51 269 68 252 79Z" fill="#789A69" />
            <path d="M260 83C270 60 287 54 304 57C296 73 281 85 260 83Z" fill="#9BB77B" />
            <path d="M249 84C238 65 224 58 211 60C216 77 229 88 249 84Z" fill="#6E8D64" />
            <path d="M255 74L255 111" stroke="#6F825F" strokeWidth="3" strokeLinecap="round" />
            <path d="M231 102H278L272 137H238Z" fill="#D79F7B" />
            <path d="M237 106H272" stroke="#F4C5A4" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g className="desk-scene__wall-messages">
            <g transform="rotate(-3 111 151)" filter="url(#object-shadow)">
              <rect x="83" y="124" width="56" height="55" rx="7" fill="url(#yellow-card)" />
              <path d="M94 143H127M94 151H119M94 159H124" stroke="#9D7F31" strokeWidth="2.5" strokeLinecap="round" opacity="0.72" />
              <path d="M118 132L124 138L131 130" stroke="#E48470" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            <g transform="rotate(4 282 150)" filter="url(#object-shadow)">
              <rect x="252" y="115" width="62" height="78" rx="5" fill="url(#photo-paper)" />
              <rect x="260" y="123" width="46" height="48" rx="3" fill="#B5C6D0" />
              <circle cx="283" cy="144" r="14" fill="#F0D5C2" />
              <path d="M269 168C277 156 291 156 299 168" fill="#879CAF" />
              <path d="M266 181H300" stroke="#D6C8BC" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>
        </g>

        <g className="desk-scene__furniture" filter="url(#soft-shadow)">
          <rect x="24" y="286" width="342" height="29" rx="12" fill="url(#desk-top)" />
          <path d="M38 309H352V431C352 439 346 445 338 445H52C44 445 38 439 38 431Z" fill="url(#desk-front)" />
          <rect x="232" y="325" width="98" height="86" rx="13" fill="#D2A487" />
          <rect x="243" y="338" width="76" height="26" rx="8" fill="#C39277" />
          <rect x="243" y="371" width="76" height="26" rx="8" fill="#C39277" />
          <rect x="269" y="349" width="25" height="4" rx="2" fill="#A77C64" />
          <rect x="269" y="382" width="25" height="4" rx="2" fill="#A77C64" />
          <rect x="48" y="431" width="16" height="54" rx="7" fill="#AF7F64" />
          <rect x="326" y="431" width="16" height="54" rx="7" fill="#AF7F64" />
          <path d="M30 301H360" stroke="#F5DCC6" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        </g>

        <g className="desk-scene__environment" filter="url(#object-shadow)">
          <g className="desk-scene__lamp">
            <path d="M68 272L79 205" stroke="#A59089" strokeWidth="7" strokeLinecap="round" />
            <path d="M78 205L115 178" stroke="#A59089" strokeWidth="7" strokeLinecap="round" />
            <path d="M103 167C128 168 138 179 142 198L98 203C97 187 98 176 103 167Z" fill="#D7A29A" />
            <ellipse cx="72" cy="280" rx="34" ry="8" fill="#B58972" opacity="0.5" />
          </g>

          <g className="desk-scene__books">
            <rect x="84" y="258" width="78" height="14" rx="5" fill="url(#book-blue)" />
            <rect x="92" y="244" width="69" height="14" rx="5" fill="url(#book-sage)" />
            <path d="M99 249H148" stroke="#E4E9DF" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M91 263H148" stroke="#D9E4EC" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <g className="desk-scene__timer">
            <rect x="180" y="239" width="48" height="39" rx="12" fill="url(#timer-body)" />
            <rect x="189" y="248" width="30" height="14" rx="4" fill="#667268" />
            <text x="204" y="259" textAnchor="middle" fontSize="8" fontWeight="700" fill="#D9E2D8">52:18</text>
            <circle cx="204" cy="270" r="3.3" fill="#E88A73" />
          </g>

          <g className="desk-scene__pen-cup">
            <path d="M301 245H337L332 281H306Z" fill="#9DAFC0" />
            <path d="M309 246L304 213" stroke="#596E84" strokeWidth="4" strokeLinecap="round" />
            <path d="M320 246L323 207" stroke="#D39182" strokeWidth="4" strokeLinecap="round" />
            <path d="M329 246L338 220" stroke="#CEB957" strokeWidth="4" strokeLinecap="round" />
            <path d="M306 251H333" stroke="#C6D1DA" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>

        <g className="desk-scene__message-objects">
          <g transform="rotate(-5 136 248)" filter="url(#object-shadow)">
            <rect x="117" y="216" width="38" height="48" rx="6" fill="url(#coral-card)" />
            <path d="M125 231H148M125 239H144M125 247H149" stroke="#9E5E50" strokeWidth="2.2" strokeLinecap="round" opacity="0.68" />
            <circle cx="137" cy="221" r="4" fill="#FFE3DB" />
          </g>

          <g transform="rotate(5 266 251)" filter="url(#object-shadow)">
            <rect x="245" y="221" width="42" height="50" rx="6" fill="url(#photo-paper)" />
            <rect x="251" y="227" width="30" height="29" rx="3" fill="#C6D2C0" />
            <circle cx="266" cy="240" r="8" fill="#F0C9B9" />
            <path d="M254 262H278" stroke="#D8C9BC" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g filter="url(#object-shadow)">
            <path d="M174 280C174 266 183 257 195 257C207 257 216 266 216 280Z" fill="#F4E8D9" />
            <path d="M174 280H216L195 264Z" fill="#F9F1E8" />
            <path d="M174 280L195 267L216 280" fill="#E6D5C3" />
            <circle cx="195" cy="275" r="4" fill="#E88973" />
          </g>

          <g className="desk-scene__charm" filter="url(#object-shadow)">
            <path d="M330 207C320 197 320 184 330 176C340 184 340 197 330 207Z" fill="#A9C793" />
            <path d="M330 207V241" stroke="#6F956A" strokeWidth="3" strokeLinecap="round" />
            <path d="M317 218C321 210 328 209 332 214C337 209 344 212 344 218C344 227 331 233 331 233C331 233 317 227 317 218Z" fill="#F0A49A" />
          </g>

          {extraObjectType && (
            <g
              className={highlightExtraObject ? 'desk-scene__extra desk-scene__extra--highlight' : 'desk-scene__extra'}
              filter={highlightExtraObject ? 'url(#glow)' : 'url(#object-shadow)'}
            >
              <rect x="151" y="199" width="88" height="69" rx="10" fill="#FFF8F1" />
              <rect x="157" y="205" width="76" height="57" rx="8" fill="#F4C6BC" />
              <path d="M169 221H218M169 232H211M169 243H215" stroke="#9B5E52" strokeWidth="3" strokeLinecap="round" />
              <circle cx="221" cy="251" r="5" fill="#E7C95E" />
            </g>
          )}
        </g>

        <g className="desk-scene__foreground" opacity="0.58">
          <ellipse cx="194" cy="470" rx="144" ry="17" fill="#8C6755" opacity="0.12" />
          <path d="M0 457C52 431 104 440 140 500H0Z" fill="#94A283" opacity="0.28" />
        </g>
      </svg>

      <div className="desk-scene__light" aria-hidden />
    </div>
  )
}
