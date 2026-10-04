import type { CharmMaterial } from '@/types'

export type CharmDesign = {
  id: string
  name: string
  /** Printed on the charm's banner in code, so Korean is always correct. */
  phrase: string
  /** Ink color of the design's line art, reused for the printed phrase. */
  ink: string
}

const CHARM_ASSET_PATH = '/assets/charms'

/** Prototype price for the paid acrylic version, in KRW. */
export const ACRYLIC_CHARM_PRICE = 50

export const charmDesigns: CharmDesign[] = [
  { id: 'charm-yeot', name: '엿', phrase: '철썩 합격', ink: '#C4502F' },
  { id: 'charm-target', name: '과녁', phrase: '찍으면 정답', ink: '#3F5FAF' },
  { id: 'charm-moon', name: '달', phrase: '꿀잠 컨디션', ink: '#2F7F50' },
  { id: 'charm-clover', name: '네잎클로버', phrase: '긴장 제로', ink: '#2F7F50' },
]

export function getCharmDesign(id: string | undefined) {
  return charmDesigns.find((design) => design.id === id) ?? charmDesigns[0]!
}

/** Longest phrase that still fits the charm's banner. */
export const CHARM_PHRASE_MAX_LENGTH = 8

export function resolveCharmPhrase(
  id: string | undefined,
  customPhrase: string | undefined,
) {
  return customPhrase?.trim() || getCharmDesign(id).phrase
}

export function getCharmImage(id: string | undefined, material: CharmMaterial) {
  return `${CHARM_ASSET_PATH}/${getCharmDesign(id).id}-${material}.webp`
}
