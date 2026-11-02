/** The two looks of the game, kept side by side while the final one is being chosen. */
export type BlastLook = 'arcade' | 'objects'

const LOOK_KEY = 'chak:desk-blast:look'

export const LOOK_LABEL: Record<BlastLook, string> = {
  arcade: '심야 책상',
  objects: '실물 문구',
}

const isLook = (value: unknown): value is BlastLook => value === 'arcade' || value === 'objects'

/** `?look=` wins, then the choice remembered on this device, then the night desk. */
export function readLook(search: string = window.location.search): BlastLook {
  const fromUrl = new URLSearchParams(search).get('look')
  if (isLook(fromUrl)) return fromUrl
  try {
    const saved = window.localStorage.getItem(LOOK_KEY)
    if (isLook(saved)) return saved
  } catch {
    // Storage blocked: the default look.
  }
  return 'arcade'
}

export function saveLook(look: BlastLook) {
  try {
    window.localStorage.setItem(LOOK_KEY, look)
  } catch {
    // The choice just is not kept.
  }
}
