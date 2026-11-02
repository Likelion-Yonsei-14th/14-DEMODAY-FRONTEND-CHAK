import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  comboNote,
  isMuted,
  playAllClear,
  playClear,
  playComboBreak,
  playGameOver,
  playNewBest,
  playPick,
  playPlace,
  resetAudioForTests,
  setMuted,
  unlockAudio,
} from './deskBlastSound'

type Voice = { frequency: number; start: number; length: number }

/** A stand-in for the browser's audio that records what would have been played. */
function installFakeAudio() {
  const voices: Voice[] = []
  const noises: number[] = []
  const created = { contexts: 0, resumed: 0 }
  class FakeContext {
    currentTime = 10
    sampleRate = 8000
    state: 'running' | 'suspended' = 'suspended'
    destination = {}
    constructor() {
      created.contexts += 1
    }
    resume() {
      created.resumed += 1
      this.state = 'running'
      return Promise.resolve()
    }
    createGain() {
      return {
        gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      }
    }
    createOscillator() {
      const voice: Voice = { frequency: 0, start: 0, length: 0 }
      return {
        type: 'sine',
        frequency: {
          setValueAtTime: (hz: number, at: number) => {
            voice.frequency = hz
            voice.start = at
          },
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: () => voices.push(voice),
        stop: (at: number) => {
          voice.length = at - voice.start
        },
      }
    }
    createBuffer(_channels: number, frames: number) {
      return { getChannelData: () => new Float32Array(frames) }
    }
    createBufferSource() {
      return { buffer: null, connect: vi.fn(), start: () => noises.push(1) }
    }
    createBiquadFilter() {
      return { type: 'bandpass', frequency: { value: 0 }, connect: vi.fn() }
    }
  }
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeContext })
  return { voices, noises, created }
}

describe('sound', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetAudioForTests()
  })
  afterEach(() => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
    resetAudioForTests()
  })

  it('stays silent and does not throw until the first tap has unlocked audio', () => {
    const audio = installFakeAudio()

    expect(() => {
      playPick()
      playPlace(4)
      playClear(2, 3)
      playAllClear()
      playGameOver()
      playNewBest()
      playComboBreak()
    }).not.toThrow()

    expect(audio.voices).toHaveLength(0)
    expect(audio.created.contexts).toBe(0)
  })

  it('wakes a sleeping audio engine on unlock, and makes only one', () => {
    const audio = installFakeAudio()

    unlockAudio()
    unlockAudio()

    expect(audio.created.contexts).toBe(1)
    expect(audio.created.resumed).toBe(1)
  })

  it('does not break where the browser has no audio at all', () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })

    expect(() => {
      unlockAudio()
      playClear(1, 1)
    }).not.toThrow()
  })

  it('plays nothing while muted, and remembers the choice', () => {
    const audio = installFakeAudio()
    unlockAudio()

    setMuted(true)
    playClear(3, 4)
    playPlace(5)

    expect(audio.voices).toHaveLength(0)
    expect(isMuted()).toBe(true)
    expect(window.localStorage.getItem('chak:desk-blast:muted')).toBe('1')

    setMuted(false)
    playPick()
    expect(audio.voices.length).toBeGreaterThan(0)
    expect(window.localStorage.getItem('chak:desk-blast:muted')).toBe('0')
  })

  it('starts muted when the device remembers it was muted', () => {
    window.localStorage.setItem('chak:desk-blast:muted', '1')
    resetAudioForTests()

    expect(isMuted()).toBe(true)
  })

  it('climbs the scale with the combo and stops climbing near the top', () => {
    const notes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20].map(comboNote)

    for (let index = 1; index < 8; index += 1) expect(notes[index]!).toBeGreaterThan(notes[index - 1]!)
    expect(notes[10]).toBe(notes[9])
    expect(comboNote(0)).toBe(comboNote(1))
  })

  it('plays more notes for more lines at once', () => {
    const audio = installFakeAudio()
    unlockAudio()

    playClear(1, 1)
    const one = audio.voices.length
    audio.voices.length = 0
    playClear(4, 1)

    expect(audio.voices.length).toBeGreaterThan(one)
  })

  it('starts a clear higher when the combo is longer', () => {
    const audio = installFakeAudio()
    unlockAudio()

    playClear(1, 1)
    const low = Math.max(...audio.voices.map((voice) => voice.frequency))
    audio.voices.length = 0
    playClear(1, 6)
    const high = Math.max(...audio.voices.map((voice) => voice.frequency))

    expect(high).toBeGreaterThan(low)
  })

  it('adds a shimmer once the combo is long', () => {
    const audio = installFakeAudio()
    unlockAudio()

    playClear(1, 3)
    const plain = audio.voices.length
    audio.voices.length = 0
    playClear(1, 6)

    expect(audio.voices.length).toBeGreaterThan(plain)
  })

  it('sets a bigger piece down with a lower, heavier sound, and adds the click of paper', () => {
    const audio = installFakeAudio()
    unlockAudio()

    playPlace(1)
    const small = audio.voices[0]!.frequency
    audio.voices.length = 0
    playPlace(9)

    expect(audio.voices[0]!.frequency).toBeLessThan(small)
    expect(audio.noises.length).toBe(2)
  })

  it('gives the game over sound three falling notes and the new best sound a longer run', () => {
    const audio = installFakeAudio()
    unlockAudio()

    playGameOver()
    const over = audio.voices.map((voice) => voice.frequency)
    audio.voices.length = 0
    playNewBest()

    expect(over).toHaveLength(3)
    expect(over[0]!).toBeGreaterThan(over[2]!)
    expect(audio.voices.length).toBeGreaterThan(5)
  })
})
