import type { CSSProperties } from 'react'
import {
  FEINT_MS,
  RETURNING_MS,
  WARNING_MS,
  type GameStatus,
  type TeacherPhase,
} from './sneakyPhoneEngine'

/**
 * The teacher, drawn to sit in the existing classroom illustration. Two
 * poses - back (at the board) and front (facing the class) - are swapped by
 * the phase class, so what you see is always the phase the engine is in.
 * The fake return ('feint') keeps the front pose: it starts the turn back
 * like 'returning', stops, and settles to face the class again.
 */
function TeacherFigure({ caught }: { caught: boolean }) {
  return (
    <svg className="sneaky-teacher__svg" viewBox="0 0 120 200" aria-hidden>
      {/* Legs and shoes - shared by both poses */}
      <rect x="44" y="140" width="13" height="46" rx="5" fill="#3d4559" />
      <rect x="63" y="140" width="13" height="46" rx="5" fill="#3d4559" />
      <ellipse cx="50" cy="188" rx="10" ry="5" fill="#2b2622" />
      <ellipse cx="70" cy="188" rx="10" ry="5" fill="#2b2622" />

      {/* Back view: writing on the board */}
      <g className="sneaky-teacher__back">
        <path d="M32 84 Q60 70 88 84 L92 146 Q60 152 28 146 Z" fill="#6f8f73" stroke="#3f5446" strokeWidth="2" />
        <path d="M60 76 L60 148" stroke="#5c7a61" strokeWidth="2" />
        <g className="sneaky-teacher__writing-arm">
          <path d="M84 88 Q100 70 98 46" stroke="#6f8f73" strokeWidth="13" strokeLinecap="round" fill="none" />
          <circle cx="98" cy="42" r="6" fill="#f3cfae" />
          <rect x="95" y="28" width="5" height="12" rx="2" fill="#fffdf6" />
        </g>
        <path d="M34 92 Q24 116 30 136" stroke="#6f8f73" strokeWidth="12" strokeLinecap="round" fill="none" />
        <g className="sneaky-teacher__head-back">
          <circle cx="60" cy="52" r="25" fill="#f3cfae" />
          <path d="M35 52 Q34 24 60 24 Q86 24 85 52 Q84 70 60 72 Q36 70 35 52 Z" fill="#4a3426" />
          {/* Cheek and an eye that show as the head starts to turn (the tell) */}
          <g className="sneaky-teacher__peek">
            <path d="M74 44 Q87 50 82 66 Q76 70 72 64 Z" fill="#f3cfae" />
            <circle cx="79" cy="53" r="2.4" fill="#2b2622" />
          </g>
        </g>
      </g>

      {/* Front view: watching the class */}
      <g className="sneaky-teacher__front">
        <path d="M32 84 Q60 72 88 84 L92 146 Q60 152 28 146 Z" fill="#6f8f73" stroke="#3f5446" strokeWidth="2" />
        <path d="M52 80 L60 96 L68 80 Z" fill="#fffdf6" />
        <path d="M58 92 L62 92 L64 120 L60 126 L56 120 Z" fill="#c8432b" />
        <path d="M34 92 Q24 116 30 136" stroke="#6f8f73" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M86 92 Q96 116 90 136" stroke="#6f8f73" strokeWidth="12" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="52" r="25" fill="#f3cfae" />
        <path d="M35 50 Q36 24 60 25 Q84 24 85 50 Q76 36 60 38 Q44 36 35 50 Z" fill="#4a3426" />
        <circle cx="49" cy="55" r="8" fill="none" stroke="#2b2622" strokeWidth="2" />
        <circle cx="71" cy="55" r="8" fill="none" stroke="#2b2622" strokeWidth="2" />
        <path d="M57 55 L63 55" stroke="#2b2622" strokeWidth="2" />
        {caught ? (
          <>
            <path d="M42 45 L55 49" stroke="#2b2622" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M78 45 L65 49" stroke="#2b2622" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="49" cy="56" r="2.6" fill="#2b2622" />
            <circle cx="71" cy="56" r="2.6" fill="#2b2622" />
            <ellipse cx="60" cy="69" rx="5" ry="4" fill="#7a2e22" />
          </>
        ) : (
          <>
            <circle className="sneaky-teacher__eye" cx="49" cy="56" r="2.6" fill="#2b2622" />
            <circle className="sneaky-teacher__eye" cx="71" cy="56" r="2.6" fill="#2b2622" />
            <path d="M54 68 Q60 70 66 68" stroke="#2b2622" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}
        <circle cx="42" cy="64" r="3.5" fill="#f0a493" opacity=".6" />
        <circle cx="78" cy="64" r="3.5" fill="#f0a493" opacity=".6" />
      </g>
    </svg>
  )
}

const BUBBLE_TEXT: Partial<Record<TeacherPhase, string>> = {
  warning: '흠…?',
}

/** The phone on the player's desk: rises and lights up while held, drops below the desk edge when hidden. */
function DeskPhone({ using }: { using: boolean }) {
  return (
    <div className={['sneaky-phone', using ? 'is-on' : ''].filter(Boolean).join(' ')} aria-hidden>
      <div className="sneaky-phone__slot">
        <svg className="sneaky-phone__svg" viewBox="0 0 60 104">
          <rect x="2" y="2" width="56" height="100" rx="10" fill="#22252e" />
          <rect className="sneaky-phone__screen" x="7" y="10" width="46" height="80" rx="4" />
          <g className="sneaky-phone__apps">
            <rect x="12" y="16" width="16" height="16" rx="4" fill="#ff5fa2" />
            <rect x="32" y="16" width="16" height="16" rx="4" fill="#ffc21a" />
            <rect x="12" y="36" width="36" height="22" rx="4" fill="#fffdf6" opacity=".9" />
            <rect x="12" y="62" width="24" height="5" rx="2.5" fill="#fffdf6" opacity=".7" />
            <rect x="12" y="71" width="30" height="5" rx="2.5" fill="#fffdf6" opacity=".55" />
          </g>
          <rect x="22" y="94" width="16" height="3" rx="1.5" fill="#4a4f5c" />
        </svg>
      </div>
    </div>
  )
}

export function SneakyPhoneScene({
  phase,
  using,
  status,
  countdown = null,
}: {
  phase: TeacherPhase
  using: boolean
  status: GameStatus
  /** 3, 2, 1 before the round starts; null once it is running. */
  countdown?: number | null
}) {
  const caught = status === 'caught'
  const bubble = caught ? '거기!' : BUBBLE_TEXT[phase]
  const timing = {
    '--sneaky-warning-ms': `${WARNING_MS}ms`,
    '--sneaky-returning-ms': `${RETURNING_MS}ms`,
    '--sneaky-feint-ms': `${FEINT_MS}ms`,
  } as CSSProperties

  return (
    <div
      className={[
        'sneaky-scene',
        `sneaky-scene--${status}`,
        using && status === 'playing' ? 'sneaky-scene--glow' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={timing}
    >
      {/* The existing night classroom illustration, kept at its own aspect ratio. */}
      <div className="sneaky-scene__world">
        <div className={`sneaky-teacher sneaky-teacher--${phase}`}>
          {bubble && (
            <span
              key={bubble}
              className={['sneaky-teacher__bubble', caught ? 'is-caught' : ''].filter(Boolean).join(' ')}
            >
              {bubble}
            </span>
          )}
          <TeacherFigure caught={caught} />
        </div>
        <DeskPhone using={using && status !== 'survived'} />
      </div>
      <div className="sneaky-scene__flash" aria-hidden />
      {countdown !== null && (
        <div className="sneaky-scene__countdown" role="status" aria-live="assertive">
          <span key={countdown}>{countdown}</span>
          <small>선생님이 돌아보기 전에 숨기세요!</small>
        </div>
      )}
    </div>
  )
}
