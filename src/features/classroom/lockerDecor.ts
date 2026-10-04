/** Paid locker upgrades the owner buys for their own locker (prototype). */
export const LOCKER_DECOR_PRICE = 200

export type LockerBulb = 'globe' | 'edison'
export type LockerPaint = 'white' | 'black' | 'pink' | 'blue'

export type LockerDecor = {
  bulb?: LockerBulb
  inside?: LockerPaint
  outside?: LockerPaint
  /** The light is bought once; after that its shape can be swapped freely. */
  bulbOwned?: boolean
}

export const lockerBulbs: { id: LockerBulb; label: string; source: string }[] = [
  { id: 'globe', label: '동그란 전구', source: '/assets/classroom/bulb-globe.webp' },
  { id: 'edison', label: '에디슨 전구', source: '/assets/classroom/bulb-edison.webp' },
]

export const lockerPaints: { id: LockerPaint; label: string; swatch: string }[] = [
  { id: 'white', label: '흰색', swatch: '#EEECE6' },
  { id: 'black', label: '검은색', swatch: '#343436' },
  { id: 'pink', label: '파스텔 핑크', swatch: '#F0BECC' },
  { id: 'blue', label: '파스텔 블루', swatch: '#B6D0EC' },
]

export function getLockerBulb(id: LockerBulb) {
  return lockerBulbs.find((bulb) => bulb.id === id) ?? lockerBulbs[0]!
}

export function getLockerPaint(id: LockerPaint) {
  return lockerPaints.find((paint) => paint.id === id) ?? lockerPaints[0]!
}

export type LockerDecorCharge = {
  key: 'bulb' | 'inside' | 'outside'
  label: string
  price: number
}

/**
 * What applying `draft` over `saved` costs: the light once, and every new
 * coat of paint (inside or outside) each time the colour changes.
 */
export function getLockerDecorCharges(
  saved: LockerDecor,
  draft: LockerDecor,
): LockerDecorCharge[] {
  const charges: LockerDecorCharge[] = []
  if (draft.bulb && !saved.bulbOwned) {
    charges.push({
      key: 'bulb',
      label: `조명 · ${getLockerBulb(draft.bulb).label}`,
      price: LOCKER_DECOR_PRICE,
    })
  }
  if (draft.inside && draft.inside !== saved.inside) {
    charges.push({
      key: 'inside',
      label: `안쪽 페인트 · ${getLockerPaint(draft.inside).label}`,
      price: LOCKER_DECOR_PRICE,
    })
  }
  if (draft.outside && draft.outside !== saved.outside) {
    charges.push({
      key: 'outside',
      label: `바깥 페인트 · ${getLockerPaint(draft.outside).label}`,
      price: LOCKER_DECOR_PRICE,
    })
  }
  return charges
}
