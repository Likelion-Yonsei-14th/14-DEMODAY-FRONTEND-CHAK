/**
 * Sound for 수능 블라스트, made on the spot with Web Audio so there is nothing
 * to download. Small, dry sounds for picking up and setting down a piece; a
 * bright bell that climbs a scale as the combo grows when lines clear; a longer
 * flourish for an empty desk and for a new best. Everything stays quiet until
 * the first tap (browsers keep audio locked until then), and a mute switch is
 * remembered on this device.
 */

const MUTE_KEY = 'chak:desk-blast:muted'

/** A major pentatonic scale over two octaves, so any run of notes sounds pleasant together. */
const SCALE_HZ = [
  523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
]

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

let context: AudioContext | null = null
let master: GainNode | null = null
let muted = readMuted()

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export const isMuted = () => muted

export function setMuted(value: boolean) {
  muted = value
  try {
    window.localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // The choice just is not kept.
  }
}

/** Call from a tap or press: creates the audio engine and wakes it if the browser put it to sleep. */
export function unlockAudio() {
  if (context === null) {
    const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
    if (!Ctor) return
    try {
      context = new Ctor()
      master = context.createGain()
      master.gain.value = 0.55
      master.connect(context.destination)
    } catch {
      context = null
      master = null
      return
    }
  }
  if (context.state === 'suspended') void context.resume().catch(() => undefined)
}

type ToneOptions = {
  type?: OscillatorType
  gain?: number
  attack?: number
  /** Glide to this frequency over the length of the note. */
  slideTo?: number
}

function tone(frequency: number, start: number, length: number, options: ToneOptions = {}) {
  if (!context || !master) return
  const { type = 'sine', gain = 0.2, attack = 0.004, slideTo } = options
  const osc = context.createOscillator()
  const amp = context.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(amp)
  amp.connect(master)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

/** A short burst of filtered noise: the click of paper and plastic. */
function noise(start: number, length: number, gain: number, cutoff: number) {
  if (!context || !master) return
  const frames = Math.max(1, Math.floor(context.sampleRate * length))
  const buffer = context.createBuffer(1, frames, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < frames; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / frames)
  const source = context.createBufferSource()
  source.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = cutoff
  const amp = context.createGain()
  amp.gain.value = gain
  source.connect(filter)
  filter.connect(amp)
  amp.connect(master)
  source.start(start)
}

function ready(): number | null {
  if (muted || !context || !master) return null
  return context.currentTime + 0.005
}

/** The note a combo plays: one step up the scale per combo, then it stays near the top. */
export function comboNote(combo: number): number {
  const index = Math.min(Math.max(combo, 1) - 1, SCALE_HZ.length - 3)
  return SCALE_HZ[index]!
}

/** Picking a piece up: a light tick. */
export function playPick() {
  const t = ready()
  if (t === null) return
  tone(1200, t, 0.05, { type: 'triangle', gain: 0.08 })
}

/** Setting a piece down: a soft thock, heavier for bigger pieces. */
export function playPlace(cells: number) {
  const t = ready()
  if (t === null) return
  const weight = Math.min(cells, 9) / 9
  tone(190 - weight * 50, t, 0.11, { type: 'sine', gain: 0.28, slideTo: 80 })
  noise(t, 0.04, 0.12 + weight * 0.1, 1800)
}

/**
 * Lines cleared: a pop, then a bell run up the scale. The run starts higher
 * the longer the combo, and gets one more note for every extra line.
 */
export function playClear(lines: number, combo: number) {
  const t = ready()
  if (t === null) return
  noise(t, 0.07, 0.2, 2600)
  tone(300, t, 0.09, { type: 'sine', gain: 0.18, slideTo: 140 })

  const start = Math.min(Math.max(combo, 1) - 1, SCALE_HZ.length - 4)
  const notes = Math.min(2 + lines, 5)
  for (let step = 0; step < notes; step += 1) {
    const hz = SCALE_HZ[Math.min(start + step, SCALE_HZ.length - 1)]!
    const at = t + 0.03 + step * 0.065
    tone(hz, at, 0.34, { type: 'triangle', gain: 0.2 })
    tone(hz * 2, at, 0.22, { type: 'sine', gain: 0.07 })
  }
  // A long combo gets a shimmer on top.
  if (combo >= 5) {
    for (let step = 0; step < 3; step += 1) tone(SCALE_HZ[SCALE_HZ.length - 1]! * (1 + step * 0.5), t + 0.05 + step * 0.05, 0.4, { gain: 0.05 })
  }
}

/** A combo that just broke: a small drop. */
export function playComboBreak() {
  const t = ready()
  if (t === null) return
  tone(420, t, 0.18, { type: 'triangle', gain: 0.1, slideTo: 260 })
}

/** The whole desk is empty: a rising flourish. */
export function playAllClear() {
  const t = ready()
  if (t === null) return
  SCALE_HZ.slice(0, 8).forEach((hz, step) => {
    tone(hz, t + step * 0.06, 0.45, { type: 'triangle', gain: 0.18 })
    tone(hz * 2, t + step * 0.06, 0.3, { gain: 0.06 })
  })
}

/** No more moves: three notes stepping down. */
export function playGameOver() {
  const t = ready()
  if (t === null) return
  ;[SCALE_HZ[4]!, SCALE_HZ[2]!, SCALE_HZ[0]!].forEach((hz, step) => {
    tone(hz, t + step * 0.17, 0.4, { type: 'triangle', gain: 0.16, slideTo: hz * 0.97 })
  })
}

/** A new best: a bright run up and a held chord. */
export function playNewBest() {
  const t = ready()
  if (t === null) return
  ;[0, 2, 3, 5, 7].forEach((index, step) => tone(SCALE_HZ[index]!, t + step * 0.08, 0.5, { type: 'triangle', gain: 0.18 }))
  ;[0, 3, 5].forEach((index) => tone(SCALE_HZ[index]!, t + 0.45, 0.9, { gain: 0.1 }))
}

/** Test hook: forget the audio engine so a fresh one is made. */
export function resetAudioForTests() {
  context = null
  master = null
  muted = readMuted()
}
