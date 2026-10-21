import { describe, expect, it } from 'vitest'
import { DEFAULT_ELECTIVES } from './examCareerConfig'
import {
  acknowledgeNotice,
  applyToUniversities,
  chooseElectives,
  chooseEventOption,
  createCareer,
  decide,
  enroll,
  pendingEventOf,
  runExam,
  type CareerState,
} from './examCareerEngine'
import { parseShareCode, shareCodeOf } from './examCareerShare'

function finishedCareer(seed: string, track: 'humanities' | 'science' = 'science'): CareerState {
  let state = createCareer(seed, track)
  while (state.status !== 'decision') {
    if (state.status === 'choosing') state = chooseElectives(state, state.electives ?? DEFAULT_ELECTIVES[track])
    else if (state.status === 'event') state = chooseEventOption(state, pendingEventOf(state)!.options[0]!.id)
    else if (state.status === 'notice') state = acknowledgeNotice(state)
    else state = runExam(state)
  }
  const results = applyToUniversities(decide(state, 'university'), ['provincial', 'college', 'college'])
  const accepted = results.admissions.at(-1)!.applications.find((item) => item.accepted)?.tierId ?? null
  return enroll(results, accepted)
}

describe('shared career links', () => {
  it('carries the final CSAT, electives and destination, and nothing else', () => {
    const state = finishedCareer('share-round-trip')
    const code = shareCodeOf(state)!
    expect(code).toMatch(/^s0-[1-9]{5}-\d{3}-[a-z-]+$/)
    expect(code).not.toContain(state.profile.name)

    const final = state.history.at(-1)!
    expect(parseShareCode(code)).toEqual({
      track: 'science',
      attempt: 0,
      grades: final.grades,
      electives: final.electives,
      average: final.average,
      enrolled: state.admissions.at(-1)!.enrolled,
    })
  })

  it('has no code before the first CSAT', () => {
    expect(shareCodeOf(createCareer('share-early'))).toBeNull()
  })

  it('rejects codes that were changed by hand', () => {
    for (const code of [
      undefined,
      '',
      'x0-12345-000-sky',
      'h0-12340-000-sky',
      'h0-1234-000-sky',
      'h0-12345-090-sky',
      'h0-12345-000-harvard',
      'h12-12345-000-sky',
    ]) {
      expect(parseShareCode(code)).toBeNull()
    }
    expect(parseShareCode('h1-12345-102-none')).toMatchObject({
      track: 'humanities',
      attempt: 1,
      enrolled: null,
      electives: { korean: 'language-media', math: 'probability', inquiry: 'mixed' },
    })
  })
})
