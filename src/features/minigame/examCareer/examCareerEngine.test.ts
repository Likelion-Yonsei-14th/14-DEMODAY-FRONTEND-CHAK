import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ADAPTATION,
  attemptLabel,
  CHOICE_EVENTS,
  DEFAULT_ELECTIVES,
  LEGEND_LECTURE,
  RETAKE_CHOICE_EVENTS,
  STUDY_CAFE_EVENT,
  GROWTH,
  SUBJECTS,
  TRACK_LEAN,
  UNIVERSITY_TIERS,
  type Electives,
} from './examCareerConfig'
import {
  admissionChance,
  admissionCutoffs,
  applyToUniversities,
  chooseElectives,
  chooseEventOption,
  acknowledgeNotice,
  clearCareer,
  createCareer,
  decide,
  electiveChoiceBefore,
  enroll,
  loadCareer,
  normalizeName,
  nextExam,
  parseSavedCareer,
  pendingEventOf,
  runExam,
  saveCareer,
  scheduleFor,
  subjectLabel,
  summarize,
  type CareerState,
} from './examCareerEngine'
import { hashKey, streamFor } from './examCareerRandom'

const SUBJECT_IDS = SUBJECTS.map((subject) => subject.id)

type Picker = (state: CareerState) => Electives

/** Keeps whatever was picked first (the track's default). */
const keepElectives: Picker = (state) => state.electives ?? DEFAULT_ELECTIVES[state.profile.track]

type EventPicker = (state: CareerState) => string

/** Always takes the first option of a choice event. */
const firstOption: EventPicker = (state) => pendingEventOf(state)!.options[0]!.id

/** Takes a different option per career and event, like a crowd of players would. */
const mixedOption: EventPicker = (state) => {
  const options = pendingEventOf(state)!.options
  return options[hashKey(`${state.seed}:${state.nextExamIndex}:${state.attempt}`) % options.length]!.id
}

/** Answers whatever the career is waiting for (electives or a choice event), or runs one exam. */
function step(state: CareerState, pick: Picker = keepElectives, choose: EventPicker = firstOption) {
  if (state.status === 'choosing') return chooseElectives(state, pick(state))
  if (state.status === 'event') return chooseEventOption(state, choose(state))
  if (state.status === 'notice') return acknowledgeNotice(state)
  return runExam(state)
}

/** Plays to the end of the given attempt (0 = 현역 CSAT), retaking in between. */
function playThrough(
  seed: string,
  lastAttempt = 0,
  pick: Picker = keepElectives,
  choose: EventPicker = firstOption,
): CareerState {
  let state = createCareer(seed)
  for (let attempt = 0; attempt <= lastAttempt; attempt += 1) {
    for (;;) {
      if (state.status === 'choosing') state = chooseElectives(state, pick(state))
      else if (state.status === 'event') state = chooseEventOption(state, choose(state))
      else if (state.status === 'notice') state = acknowledgeNotice(state)
      else if (state.status === 'playing') state = runExam(state)
      else break
    }
    if (attempt < lastAttempt) state = decide(state, 'retake')
  }
  return state
}

afterEach(() => {
  vi.restoreAllMocks()
  clearCareer()
})

describe('seeded randomness', () => {
  it('replays the same numbers for the same key and differs between keys', () => {
    const a = streamFor('seed:growth:g1-06:math')
    const b = streamFor('seed:growth:g1-06:math')
    const c = streamFor('seed:growth:g1-06:korean')
    const first = [a.next(), a.next(), a.next()]
    expect([b.next(), b.next(), b.next()]).toEqual(first)
    expect(c.next()).not.toBe(first[0])
    expect(hashKey('')).toBeGreaterThan(0)
  })

  it('never touches Math.random while simulating', () => {
    const spy = vi.spyOn(Math, 'random')
    playThrough('no-math-random', 2)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('simulation', () => {
  it('produces the exact same career from the same seed and choices', () => {
    expect(playThrough('same-seed', 1)).toEqual(playThrough('same-seed', 1))
    expect(playThrough('same-seed', 1)).not.toEqual(playThrough('other-seed', 1))
  })

  it('keeps every grade between 1 and 9', () => {
    for (let index = 0; index < 300; index += 1) {
      const state = playThrough(`range-${index}`, 2)
      for (const result of state.history) {
        for (const subject of SUBJECT_IDS) {
          expect(Number.isInteger(result.grades[subject])).toBe(true)
          expect(result.grades[subject]).toBeGreaterThanOrEqual(1)
          expect(result.grades[subject]).toBeLessThanOrEqual(9)
        }
      }
    }
  })

  it('never lets skill run far past potential', () => {
    for (let index = 0; index < 300; index += 1) {
      let state = createCareer(`potential-${index}`)
      for (let count = 0; count < 60 && state.status !== 'finished'; count += 1) {
        state = state.status === 'decision' ? decide(state, 'retake') : step(state, keepElectives, mixedOption)
        for (const subject of SUBJECT_IDS) {
          expect(state.skill[subject]).toBeLessThanOrEqual(state.potential[subject] + GROWTH.potentialOvershoot + 0.05)
        }
      }
    }
  })

  it('runs the 고1-고3 schedule and then the June, September mocks and CSAT for each retake', () => {
    const schoolYears = scheduleFor(0).map((slot) => `${slot.yearLabel} ${slot.label}`)
    expect(schoolYears).toHaveLength(15)
    expect(schoolYears[0]).toBe('고1 3월 학평')
    expect(schoolYears.at(-1)).toBe('고3 수능')
    expect(scheduleFor(2).map((slot) => slot.id)).toEqual(['n2-06p', 'n2-09p', 'n2-csat'])
  })
})

describe('choice events', () => {
  const careerBefore = (seed: string, examId: string) => {
    let state = createCareer(seed, 'science')
    while (!(state.status === 'event' && nextExam(state)?.id === examId)) state = step(state)
    return state
  }

  it('asks before the planned exams in every mode and runs nothing until answered', () => {
    const asked: string[] = []
    let state = createCareer('events-where')
    for (let attempt = 0; attempt <= 1; attempt += 1) {
      while (state.status !== 'decision') {
        // The 스터디카페 moment differs per student; it has its own test.
        if (state.status === 'event' && state.pendingEvent !== 'study-cafe') {
          asked.push(`${nextExam(state)!.id}:${state.pendingEvent}`)
        }
        state = step(state)
      }
      if (attempt === 0) state = decide(state, 'retake')
    }
    expect(asked).toEqual([
      'g1-03:high-school-entry',
      'g1-06:study-style',
      'g1-09:g1-summer',
      'g2-06:math-wall',
      'g2-09:g2-summer',
      'g3-05:senior-spring',
      'g3-09p:g3-summer',
      'g3-csat:csat-eve',
      'n1-06p:retake-life',
      'n1-06p:friends-festival',
      'n1-09p:academy-rival',
      'n1-csat:final-push',
    ])

    const waiting = careerBefore('events-wait', 'g1-06')
    expect(runExam(waiting)).toBe(waiting)
    expect(chooseEventOption(waiting, 'no-such-option')).toBe(waiting)
  })

  it('meets someone at the 스터디카페 once, somewhere between 고1 March and the 고3 September 모의평가', () => {
    const where = new Set<string>()
    for (let index = 0; index < 200; index += 1) {
      let state = createCareer(`cafe-${index}`)
      const asked: string[] = []
      while (state.status !== 'decision') {
        if (state.status === 'event' && state.pendingEvent === 'study-cafe') asked.push(nextExam(state)!.id)
        state = step(state)
      }
      expect(asked).toHaveLength(1)
      expect(asked[0]).toBe(state.profile.studyCafeExamId)
      where.add(asked[0]!)
      // Never in a retake year.
      state = decide(state, 'retake')
      while (state.status !== 'decision') {
        expect(state.pendingEvent).not.toBe('study-cafe')
        state = step(state)
      }
    }
    expect([...where].sort()).toEqual(['g1-10', 'g2-03', 'g2-10', 'g3-03', 'g3-06p', 'g3-07'])
  })

  it('gives every 스터디카페 pick a good and a bad side, and lets only a new couple break up before the CSAT', () => {
    const cafe = STUDY_CAFE_EVENT
    for (const option of cafe.options) {
      expect(option.outcomes.map((outcome) => outcome.tone).sort()).toEqual(['down', 'up'])
    }

    let couples = 0
    let breakups = 0
    for (let index = 0; index < 400; index += 1) {
      let state = createCareer(`couple-${index}`)
      while (!(state.status === 'event' && state.pendingEvent === 'study-cafe')) state = step(state)
      state = chooseEventOption(state, 'ask-number')
      const dating = state.flags.includes('dating')
      if (dating) couples += 1
      while (!(state.status === 'event' && state.pendingEvent === 'csat-eve')) state = step(state)
      const afterEve = chooseEventOption(state, 'timed')
      if (afterEve.status === 'notice') {
        expect(dating).toBe(true)
        breakups += 1
        expect(afterEve.flags).not.toContain('dating')
        expect(afterEve.effects.some((effect) => effect.kind === 'bust-risk')).toBe(true)
        // The CSAT waits until the breakup is acknowledged.
        expect(runExam(afterEve)).toBe(afterEve)
        const csat = runExam(acknowledgeNotice(afterEve))
        expect(csat.history.at(-1)!.examId).toBe('g3-csat')
        expect(csat.history.at(-1)!.events.map((event) => event.eventId)).toContain('breakup')
      }
    }
    expect(couples).toBeGreaterThan(100)
    expect(breakups / couples).toBeGreaterThan(0.15)
    expect(breakups / couples).toBeLessThan(0.45)
  })

  it('starts high school with a pick that shapes the whole career', () => {
    const entry = createCareer('entry', 'science')
    // Asked before the first exam is offered at all.
    expect(entry.status).toBe('event')
    expect(runExam(entry)).toBe(entry)
    expect(pendingEventOf(entry)?.id).toBe('high-school-entry')
    expect(entry.history).toHaveLength(0)

    const topOfClass = chooseEventOption(entry, 'top-of-class')
    for (const subject of SUBJECT_IDS) expect(topOfClass.skill[subject]).toBeGreaterThan(entry.skill[subject])

    const balanced = chooseEventOption(entry, 'balanced')
    expect(balanced.profile.stability).toBeGreaterThan(entry.profile.stability - 0.001)
    expect(balanced.profile.stability).toBeLessThanOrEqual(1)
    expect(balanced.skill).toEqual(entry.skill)

    const enjoy = chooseEventOption(entry, 'enjoy-first')
    for (const subject of SUBJECT_IDS) {
      expect(enjoy.skill[subject]).toBeLessThan(entry.skill[subject])
      expect(enjoy.potential[subject]).toBeGreaterThan(entry.potential[subject])
    }

    // Picking does not run the exam; the outcome shows with it.
    expect(enjoy.status).toBe('playing')
    expect(enjoy.history).toHaveLength(0)
    const first = runExam(enjoy)
    expect(first.history[0]!.events.map((event) => event.eventId)).toEqual(['high-school-entry'])
  })

  it('shows the chosen outcome with the next exam and replays it for the same pick', () => {
    const waiting = careerBefore('events-record', 'g1-09')
    const chosen = chooseEventOption(waiting, 'fill-gaps')
    expect(chosen.status).toBe('playing')
    expect(chosen.pendingRecords).toHaveLength(1)
    expect(chosen.pendingRecords[0]!.title).toBe('고1 여름방학 · 약한 과목 보충')
    expect(chosen.pendingRecords[0]!.description).not.toContain('{subject}')
    expect(chooseEventOption(waiting, 'fill-gaps')).toEqual(chosen)

    // The weakest subject got the boost.
    const weakest = SUBJECT_IDS.reduce((low, subject) => (waiting.skill[subject] < waiting.skill[low] ? subject : low))
    expect(chosen.skill[weakest]).toBeGreaterThan(waiting.skill[weakest])

    const next = runExam(chosen)
    expect(next.history.at(-1)!.examId).toBe('g1-09')
    expect(next.history.at(-1)!.events.map((event) => event.eventId)).toContain('g1-summer')
    expect(next.pendingRecords).toEqual([])
  })

  it('lets different picks lead to different careers', () => {
    const a = playThrough('events-differ', 0, keepElectives, firstOption)
    const b = playThrough('events-differ', 0, keepElectives, mixedOption)
    expect(a.history.map((result) => result.events.map((event) => event.title))).not.toEqual(
      b.history.map((result) => result.events.map((event) => event.title)),
    )
  })

  it('only awakens geniuses on their own, and every option can be reached', () => {
    for (let index = 0; index < 300; index += 1) {
      const state = playThrough(`events-genius-${index}`, 1)
      for (const result of state.history) {
        if (result.events.some((event) => event.eventId === 'genius-awakening')) {
          expect(state.profile.growthType).toBe('genius')
        }
      }
    }
    for (const event of [...CHOICE_EVENTS, ...RETAKE_CHOICE_EVENTS]) {
      expect(event.options.length).toBeGreaterThanOrEqual(2)
      for (const option of event.options) expect(option.outcomes.length).toBeGreaterThan(0)
    }
  })
})

describe('track lean and subject names', () => {
  it('names 고1 탐구 통합사회 and 통합과학, then follows the electives', () => {
    expect(subjectLabel('inquiry1', null).name).toBe('통합사회')
    expect(subjectLabel('inquiry2', null).name).toBe('통합과학')
    expect(subjectLabel('inquiry1', DEFAULT_ELECTIVES.science).name).toBe('과학탐구 1')
  })

  it('makes each track a little better at its own side without splitting the subjects apart', () => {
    const gaps = { humanities: [] as number[], science: [] as number[] }
    const pairs: [number, number][] = []
    for (let index = 0; index < 2000; index += 1) {
      for (const track of ['humanities', 'science'] as const) {
        const state = createCareer(`lean-${index}`, track)
        expect(state.profile.trackLean).toBeGreaterThanOrEqual(TRACK_LEAN.min)
        expect(state.profile.trackLean).toBeLessThanOrEqual(TRACK_LEAN.max)
        let played = state
        while (played.history.length < 4) played = step(played)
        for (const result of played.history) {
          // Positive: korean + 통합사회 beat math + 통합과학.
          const gap = result.grades.math + result.grades.inquiry2 - result.grades.korean - result.grades.inquiry1
          gaps[track].push(gap / 2)
          pairs.push([result.grades.korean, result.grades.math])
        }
      }
    }
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
    expect(mean(gaps.humanities)).toBeGreaterThan(0.3)
    expect(mean(gaps.humanities)).toBeLessThan(1.5)
    expect(mean(gaps.science)).toBeLessThan(-0.3)
    expect(mean(gaps.science)).toBeGreaterThan(-1.5)

    // Strong students are strong in both, weak in both.
    const korean = pairs.map(([value]) => value)
    const math = pairs.map(([, value]) => value)
    const mk = mean(korean)
    const mm = mean(math)
    const cov = mean(pairs.map(([k, m]) => (k - mk) * (m - mm)))
    const sd = (values: number[], m: number) => Math.sqrt(mean(values.map((value) => (value - m) ** 2)))
    expect(cov / (sd(korean, mk) * sd(math, mm))).toBeGreaterThan(0.6)
  }, 30_000)
})

describe('retakes', () => {
  it('keeps the earlier record when retaking', () => {
    const firstTry = playThrough('retake-history', 0)
    expect(firstTry.status).toBe('decision')
    const secondTry = playThrough('retake-history', 1)
    expect(secondTry.history.slice(0, firstTry.history.length)).toEqual(firstTry.history)
    expect(secondTry.history.slice(firstTry.history.length).map((result) => result.examId)).toEqual([
      'n1-06p',
      'n1-09p',
      'n1-csat',
    ])
    expect(summarize(decide(secondTry, 'university')).attemptLabel).toBe('재수')
    expect([0, 1, 2, 3].map(attemptLabel)).toEqual(['현역', '재수', '3수', '4수'])
  })

  it('asks how to spend the retake year as soon as it starts, then the electives', () => {
    const retakeStart = decide(playThrough('retake-life', 0), 'retake')
    expect(retakeStart.status).toBe('event')
    expect(pendingEventOf(retakeStart)?.id).toBe('retake-life')
    expect(retakeStart.attempt).toBe(1)

    // Friends at university get in touch right after.
    const friends = chooseEventOption(retakeStart, 'academy')
    expect(friends.status).toBe('event')
    expect(pendingEventOf(friends)?.id).toBe('friends-festival')
    const answered = chooseEventOption(friends, 'visit')
    expect(answered.status).toBe('choosing')
    expect(answered.pendingChoice).toBe('retake')
    expect(answered.history).toEqual(retakeStart.history)

    // Nothing else is asked before the June mock; both picks show with it.
    const june = runExam(chooseElectives(answered, answered.electives!))
    expect(june.history.at(-1)!.examId).toBe('n1-06p')
    expect(june.history.at(-1)!.events.map((event) => event.eventId)).toEqual(
      expect.arrayContaining(['retake-life', 'friends-festival', 'retake-june-report']),
    )
  })

  it("sets the retake June 모의평가 against last year's CSAT, with an event that follows the grades", () => {
    const seen = new Set<string>()
    for (let index = 0; index < 200; index += 1) {
      const state = playThrough(`june-report-${index}`, 1)
      const csat = state.history.find((result) => result.examId === 'g3-csat')!
      const june = state.history.find((result) => result.examId === 'n1-06p')!
      const report = june.events.find((event) => event.eventId === 'retake-june-report')
      expect(report).toBeDefined()
      const gain = csat.average - june.average
      if (gain >= 0.4) expect(report!.description).toContain('올해는 다르다')
      else if (gain <= -0.4) expect(report!.description).toContain('현역 때보다 못 봤다고')
      else expect(report!.description).toContain('재수했는데 그대로라고')
      seen.add(report!.description.slice(0, 8))
      // 현역 exams never get it.
      expect(state.history.filter((result) => result.attempt === 0).flatMap((result) => result.events).map((event) => event.eventId)).not.toContain('retake-june-report')
    }
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })

  it('brings the legendary lecture now and then, only right before a CSAT', () => {
    let csats = 0
    let lectures = 0
    for (let index = 0; index < 1500; index += 1) {
      const state = playThrough(`legend-${index}`, 1)
      for (const result of state.history) {
        const lecture = result.events.some((event) => event.eventId === LEGEND_LECTURE.id)
        if (lecture) expect(result.kind).toBe('csat')
        if (result.kind === 'csat') {
          csats += 1
          if (lecture) lectures += 1
        }
      }
    }
    expect(lectures / csats).toBeGreaterThan(0.04)
    expect(lectures / csats).toBeLessThan(0.13)
  }, 30_000)

  it('makes 대박 and 대폭망 more likely after going all out, and rarer after resting up', () => {
    const extremes = (optionId: string) => {
      let count = 0
      for (let index = 0; index < 600; index += 1) {
        let state = decide(playThrough(`swing-${index}`, 0), 'retake')
        while (!(state.status === 'event' && state.pendingEvent === 'final-push')) state = step(state)
        state = runExam(chooseEventOption(state, optionId))
        count += state.history.at(-1)!.dayNotes.filter((note) => note.subject !== 'all').length
      }
      return count
    }
    const allOut = extremes('all-out')
    const condition = extremes('condition')
    expect(allOut).toBeGreaterThan(condition * 3)
  }, 30_000)

  it('always stops at a CSAT for the decision', () => {
    let state = createCareer('csat-stop')
    while (state.status !== 'decision') state = step(state)
    expect(state.history.at(-1)!.examId).toBe('g3-csat')
    expect(state.status).toBe('decision')
    expect(nextExam(state)).toBeNull()
    expect(runExam(state)).toBe(state)
    expect(decide(state, 'university').status).toBe('applying')
  })
})

describe('electives', () => {
  const careerAt = (seed: string, examId: string) => {
    let state = createCareer(seed, 'science')
    while (state.history.at(-1)?.examId !== examId) state = step(state)
    return state
  }

  it('grades 고1 without electives and asks for them before the first 고2 exam', () => {
    const state = careerAt('electives-first', 'g1-10')
    expect(state.history.every((result) => result.electives === null)).toBe(true)
    const waiting = runExam(state)
    expect(waiting.status).toBe('choosing')
    expect(waiting.pendingChoice).toBe('first')
    expect(waiting.history).toHaveLength(state.history.length)
    // Nothing runs until the choice is made.
    expect(runExam(waiting)).toBe(waiting)

    const chosen = chooseElectives(waiting, DEFAULT_ELECTIVES.science)
    const next = runExam(chosen)
    expect(next.history.at(-1)!.examId).toBe('g2-03')
    expect(next.history.at(-1)!.electives).toEqual(DEFAULT_ELECTIVES.science)
  })

  it('offers a change when 고3 starts, without forcing one', () => {
    const endOfG2 = careerAt('electives-senior', 'g2-10')
    // 고2 ends on its results; the choice comes when moving on to 고3.
    expect(endOfG2.status).toBe('playing')
    expect(electiveChoiceBefore(endOfG2)).toBe('senior')
    const afterG2 = runExam(endOfG2)
    expect(afterG2.status).toBe('choosing')
    expect(afterG2.pendingChoice).toBe('senior')
    expect(afterG2.history).toEqual(endOfG2.history)

    const kept = chooseElectives(afterG2, afterG2.electives!)
    expect(kept.adaptation).toEqual(afterG2.adaptation)
    const switched = chooseElectives(afterG2, { ...afterG2.electives!, korean: 'speech-writing' })
    expect(switched.adaptation.korean).toBeLessThanOrEqual(ADAPTATION.switchAtSeniorStart)
    expect(switched.adaptation.math).toBe(afterG2.adaptation.math)
    expect(runExam(switched).history.at(-1)!.examId).toBe('g3-03')
  })

  it('offers one last change right before the September 모의평가, then locks it until the CSAT', () => {
    const afterJuly = careerAt('electives-last', 'g3-07')
    expect(afterJuly.status).toBe('playing')
    expect(electiveChoiceBefore(careerAt('electives-last', 'g3-06p'))).toBeNull()
    expect(electiveChoiceBefore(afterJuly)).toBe('last-change')
    // The summer event comes first, then the electives.
    const summer = runExam(afterJuly)
    expect(summer.status).toBe('event')
    expect(pendingEventOf(summer)?.id).toBe('g3-summer')
    const afterJune = runExam(chooseEventOption(summer, 'mock-drills'))
    expect(afterJune.status).toBe('choosing')
    expect(afterJune.pendingChoice).toBe('last-change')

    const switched = chooseElectives(afterJune, { ...afterJune.electives!, math: 'geometry' })
    expect(switched.skill).toEqual(afterJune.skill)
    expect(switched.adaptation.math).toBeLessThanOrEqual(ADAPTATION.switchInSenior)
    // Unchanged subjects keep their adaptation.
    expect(switched.adaptation.korean).toBe(afterJune.adaptation.korean)
    expect(switched.adaptation.inquiry1).toBe(afterJune.adaptation.inquiry1)

    let state = switched
    while (state.status !== 'decision') {
      expect(state.status).not.toBe('choosing')
      state = step(state)
    }
    const rest = state.history.slice(afterJune.history.length)
    expect(rest.map((result) => result.examId)).toEqual(['g3-09p', 'g3-10', 'g3-csat'])
    expect(rest.every((result) => result.electives?.math === 'geometry')).toBe(true)
    expect(chooseElectives(state, DEFAULT_ELECTIVES.humanities)).toBe(state)
  })

  it('lets each retake year choose again and keeps the earlier record', () => {
    const firstTry = playThrough('electives-retake', 0)
    const retakeStart = chooseEventOption(chooseEventOption(decide(firstTry, 'retake'), 'academy'), 'visit')
    expect(retakeStart.status).toBe('choosing')
    expect(retakeStart.pendingChoice).toBe('retake')

    const switched = chooseElectives(retakeStart, { ...retakeStart.electives!, inquiry: 'science' })
    expect(switched.adaptation.inquiry1).toBeLessThanOrEqual(ADAPTATION.switchInRetake)
    expect(switched.adaptation.inquiry2).toBeLessThanOrEqual(ADAPTATION.switchInRetake)
    expect(switched.skill).toEqual(retakeStart.skill)

    let state = switched
    while (state.status !== 'decision') state = step(state)
    expect(state.history.slice(0, firstTry.history.length)).toEqual(firstTry.history)
    expect(state.history.at(-1)!.electives?.inquiry).toBe('science')
    const changes = summarize(state).electiveChanges
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ category: 'inquiry', from: '사회탐구', to: '과학탐구' })
    expect(changes[0]!.before.examId).toBe('g3-csat')
    expect(changes[0]!.after.examId).toBe('n1-06p')
  })

  it('replays the same career for the same seed and the same choices', () => {
    const switchMath: Picker = (state) =>
      state.pendingChoice === 'last-change' ? { ...state.electives!, math: 'calculus' } : keepElectives(state)
    expect(playThrough('electives-replay', 1, switchMath)).toEqual(playThrough('electives-replay', 1, switchMath))
    expect(playThrough('electives-replay', 1, switchMath)).not.toEqual(
      playThrough('electives-replay', 1, keepElectives),
    )
  })

  it('rejects electives that do not exist', () => {
    const waiting = runExam(careerAt('electives-invalid', 'g1-10'))
    expect(chooseElectives(waiting, { korean: 'poetry', math: 'calculus', inquiry: 'social' } as never)).toBe(waiting)
  })
})

describe('university applications', () => {
  const atDecision = (seed: string) => playThrough(seed, 0)

  it('groups schools from SKY down to 전문대', () => {
    expect(UNIVERSITY_TIERS.map((tier) => tier.label)).toEqual([
      'SKY',
      '인서울 상위권 대학',
      '인서울 중하위권 대학',
      '지역 거점 국립대',
      '지방 4년제 대학',
      '전문대학',
    ])
  })

  it('gives better odds for a better CSAT, 50 % at the cutoff', () => {
    expect(admissionChance(3, 3)).toBe(0.5)
    expect(admissionChance(2.5, 3)).toBeGreaterThan(0.5)
    expect(admissionChance(3.5, 3)).toBeLessThan(0.5)
    expect(admissionChance(9, 1.4)).toBe(0.03)
    expect(admissionChance(1, 6.8)).toBe(0.97)
  })

  it('draws each year and 군 a cutoff inside the group range, so neighbouring groups overlap', () => {
    let regionalHarder = 0
    let regionalEasier = 0
    for (let index = 0; index < 300; index += 1) {
      const career = { seed: `cutoffs-${index}`, attempt: index % 3 }
      const cutoffs = admissionCutoffs(career)
      expect(cutoffs).toHaveLength(3)
      expect(admissionCutoffs(career)).toEqual(cutoffs)
      for (const group of cutoffs) {
        for (const tier of UNIVERSITY_TIERS) {
          expect(group[tier.id]).toBeGreaterThanOrEqual(tier.cutoff.min)
          expect(group[tier.id]).toBeLessThanOrEqual(tier.cutoff.max)
        }
        if (group.regional < group['seoul-lower']) regionalHarder += 1
        else regionalEasier += 1
      }
    }
    // Usually easier, but not always: no fixed order between the two.
    expect(regionalEasier).toBeGreaterThan(regionalHarder)
    expect(regionalHarder).toBeGreaterThan(0)
    // Each group's centre still goes down the list.
    const centres = UNIVERSITY_TIERS.map((tier) => (tier.cutoff.min + tier.cutoff.max) / 2)
    expect([...centres].sort((a, b) => a - b)).toEqual(centres)
  })

  it('applies to one school per 가·나·다군 and replays the same results', () => {
    const applying = decide(atDecision('apply-replay'), 'university')
    const picks = ['seoul-upper', 'regional', 'college'] as const
    const once = applyToUniversities(applying, [...picks])
    expect(once.status).toBe('admission')
    expect(once).toEqual(applyToUniversities(applying, [...picks]))
    const record = once.admissions.at(-1)!
    expect(record.applications.map((item) => item.group)).toEqual(['가군', '나군', '다군'])
    expect(record.applications.map((item) => item.tierId)).toEqual([...picks])
    expect(record.csatExamId).toBe('g3-csat')
    expect(record.applications.map((item) => item.cutoff)).toEqual(
      admissionCutoffs(applying).map((cutoffs, index) => cutoffs[picks[index]!]),
    )
    expect(record.average).toBe(applying.history.at(-1)!.average)
  })

  it('rejects bad applications and enrolling where you were not accepted', () => {
    const applying = decide(atDecision('apply-rules'), 'university')
    expect(applyToUniversities(applying, ['sky', 'sky'])).toBe(applying)
    expect(applyToUniversities(applying, ['sky', 'sky', 'harvard' as never])).toBe(applying)

    const results = applyToUniversities(applying, ['sky', 'sky', 'sky'])
    const rejectedTier = results.admissions.at(-1)!.applications.find((item) => !item.accepted)?.tierId
    if (rejectedTier) expect(enroll(results, rejectedTier)).toBe(results)

    const finished = enroll(results, null)
    expect(finished.status).toBe('finished')
    expect(summarize(finished).admission?.enrolled).toBeNull()
  })

  it('enrolls at a school that accepted', () => {
    for (let index = 0; index < 50; index += 1) {
      const applying = decide(atDecision(`apply-enroll-${index}`), 'university')
      const results = applyToUniversities(applying, ['regional', 'provincial', 'college'])
      const accepted = results.admissions.at(-1)!.applications.find((item) => item.accepted)
      if (!accepted) continue
      const finished = enroll(results, accepted.tierId)
      expect(finished.status).toBe('finished')
      expect(summarize(finished).admission?.enrolled).toBe(accepted.tierId)
      return
    }
    throw new Error('no acceptance in 50 careers')
  })

  it('can retake after the results and keeps every earlier record', () => {
    const results = applyToUniversities(decide(atDecision('apply-retake'), 'university'), ['sky', 'sky', 'sky'])
    const retaking = decide(results, 'retake')
    expect(retaking.status).toBe('event')
    expect(retaking.attempt).toBe(1)
    expect(retaking.admissions).toEqual(results.admissions)
    expect(retaking.history).toEqual(results.history)
  })

  it('keeps a short name and falls back when left blank', () => {
    expect(normalizeName('  지수  ')).toBe('지수')
    expect(normalizeName('')).toBe('수험생')
    expect(normalizeName('가나다라마바사아자차카')).toBe('가나다라마바사아자차')
    expect(createCareer('named', 'science', '민준').profile.name).toBe('민준')
  })
})

describe('summary and storage', () => {
  it('reports the final CSAT, best grades and the biggest rise from an earlier low', () => {
    const state = playThrough('summary', 1)
    const summary = summarize(state)
    expect(summary.finalCsat?.examId).toBe('n1-csat')
    expect(summary.csatResults.map((result) => result.examId)).toEqual(['g3-csat', 'n1-csat'])
    for (const subject of SUBJECT_IDS) {
      expect(summary.bestGrades[subject]).toBe(Math.min(...state.history.map((result) => result.grades[subject])))
    }
    if (summary.biggestRise) {
      expect(summary.biggestRise.from.index).toBeLessThan(summary.biggestRise.to.index)
      expect(summary.biggestRise.gain).toBeCloseTo(summary.biggestRise.from.average - summary.biggestRise.to.average, 5)
    }
  })

  it('restores a saved career and drops damaged data', () => {
    const state = playThrough('storage', 0)
    saveCareer({ state })
    expect(loadCareer()).toEqual({ state })

    const firstResult = state.history[0]!
    const bad = [
      'nope',
      JSON.stringify({ state: { ...state, version: 0 } }),
      JSON.stringify({ state: { ...state, status: 'highlight' } }),
      JSON.stringify({
        state: { ...state, history: [{ ...firstResult, grades: { ...firstResult.grades, math: 10 } }] },
      }),
    ]
    for (const raw of bad) expect(parseSavedCareer(raw)).toBeNull()
  })
})

describe('balance (10,000 simulated students)', () => {
  it('spreads grades like a real cohort and lets every kind of career happen', () => {
    const count = 10_000
    const csatGrades = Array<number>(10).fill(0)
    const byType: Record<string, { first: number; csat: number; n: number }> = {}
    let lowStarters = 0
    let comebacks = 0
    let csatJackpots = 0
    let csatBusts = 0

    for (let index = 0; index < count; index += 1) {
      const state = playThrough(`balance-${index}`, 0, keepElectives, mixedOption)
      const first = state.history[0]!
      const september = state.history.find((result) => result.examId === 'g3-09p')!
      const csat = state.history.at(-1)!
      for (const subject of SUBJECT_IDS) csatGrades[csat.grades[subject]]! += 1
      const type = (byType[state.profile.growthType] ??= { first: 0, csat: 0, n: 0 })
      type.first += first.average
      type.csat += csat.average
      type.n += 1
      if (first.average >= 6) {
        lowStarters += 1
        if (csat.average <= 3) comebacks += 1
      }
      if (september.average - csat.average >= 1.5) csatJackpots += 1
      if (csat.average - september.average >= 1.5) csatBusts += 1
    }

    const share = (grade: number) => csatGrades[grade]! / (count * SUBJECT_IDS.length)
    // A little kinder than the real stanine split: centred around grade 4.
    expect(share(1)).toBeGreaterThan(0.06)
    expect(share(1)).toBeLessThan(0.16)
    expect(share(4)).toBeGreaterThan(0.12)
    expect(share(4)).toBeLessThan(0.24)
    expect(share(9)).toBeLessThan(0.08)

    const meanCsat = Object.values(byType).reduce((sum, type) => sum + type.csat, 0) / count
    expect(meanCsat).toBeGreaterThan(3.6)
    expect(meanCsat).toBeLessThan(4.8)

    const improvement = (id: string) => (byType[id]!.first - byType[id]!.csat) / byType[id]!.n
    // Late bloomers and geniuses gain the most by the CSAT; early peakers fade.
    expect(improvement('late')).toBeGreaterThan(improvement('early'))
    expect(improvement('genius')).toBeGreaterThan(improvement('steady'))

    // Dramatic careers are rare but real.
    expect(comebacks / lowStarters).toBeGreaterThan(0.001)
    expect(comebacks / lowStarters).toBeLessThan(0.05)
    expect(csatJackpots / count).toBeGreaterThan(0.001)
    expect(csatBusts / count).toBeGreaterThan(0.001)
    expect((csatJackpots + csatBusts) / count).toBeLessThan(0.05)
  }, 60_000)
})
