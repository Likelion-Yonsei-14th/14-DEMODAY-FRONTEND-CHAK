import { describe, expect, it } from 'vitest'
import type { Recap } from '@/api/recap'
import { buildSlides, daysSince } from './recapSlides'
import { SAMPLE_RECAPS } from './recapSample'

const kinds = (recap: Recap | null) => buildSlides(recap, '2026-11-19').map((s) => s.kind)

describe('buildSlides', () => {
  it('gives everyone the intro, the last cheer, the team letter, the summary and the outro', () => {
    expect(kinds(null)).toEqual(['intro', 'cheer', 'letter', 'summary', 'outro'])
    expect(kinds(SAMPLE_RECAPS.empty)).toEqual(['intro', 'cheer', 'letter', 'summary', 'outro'])
  })

  it('never shows received or sent cards when there were none', () => {
    const k = kinds(SAMPLE_RECAPS.empty)
    expect(k).not.toContain('received')
    expect(k).not.toContain('sent')
    expect(k).not.toContain('games')
  })

  it('shows every card for someone with a full year', () => {
    expect(kinds(SAMPLE_RECAPS.full)).toEqual([
      'intro', 'cheer', 'received', 'sent', 'cheer', 'games', 'studyType', 'cheer', 'letter', 'summary', 'outro',
    ])
  })

  it('hides the busiest day when there were only a few letters', () => {
    const few: Recap = {
      ...SAMPLE_RECAPS.full,
      received: { letters: 3, stickers: 0, senders: 2, firstDay: '2026-11-18', peakDay: '2026-11-18', peakCount: 3 },
    }
    const received = buildSlides(few, '2026-11-19').find((s) => s.kind === 'received')
    expect(received).toMatchObject({ peak: null })
    const many = buildSlides(SAMPLE_RECAPS.full, '2026-11-19').find((s) => s.kind === 'received')
    expect(many).toMatchObject({ peak: { day: '2026-11-18', count: 11 } })
  })

  it('only mentions a game rank inside the top 30%', () => {
    const games = buildSlides(SAMPLE_RECAPS.full, '2026-11-19').find((s) => s.kind === 'games')
    expect(games).toMatchObject({ top: { topPercent: 12 } })
    const low: Recap = { ...SAMPLE_RECAPS.full, games: [{ game: 'DESK_BLAST', plays: 3, best: 100, topPercent: 70 }] }
    expect(buildSlides(low, '2026-11-19').find((s) => s.kind === 'games')).toMatchObject({ top: { topPercent: null } })
  })

  it('leaves zero numbers out of the summary', () => {
    const summary = buildSlides(SAMPLE_RECAPS.empty, '2026-11-19').find((s) => s.kind === 'summary')
    expect(summary).toMatchObject({ lines: [{ label: '착과 함께한 날', value: '3일' }] })
  })

  it('counts days from the first day', () => {
    expect(daysSince('2026-11-19', '2026-11-19')).toBe(1)
    expect(daysSince('2026-09-02', '2026-11-19')).toBe(79)
    expect(daysSince(null, '2026-11-19')).toBeNull()
  })
})
