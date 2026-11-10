/**
 * 빼빼로데이(11/11) seasonal desk object: a stick-snack box with a letter
 * tucked inside. It borrows the feel of a snack box (bold flavor color, dark
 * chocolate band, chunky white title, diagonal sticks) but never a maker's
 * logo or wordmark: the corner badge is 착! and the title is 11.11.
 */
export type PeperoIllustration = 'chocolate' | 'almond' | 'strawberry' | 'cookie'

export type PeperoDesign = {
  id: string
  /** Flavor name shown in the picker and on the box label. */
  name: string
  /** Small English line on the ribbon under the title. */
  english: string
  /** Box face color. */
  box: string
  /** Dark band behind the title. */
  band: string
  /** Dipped half of each stick. */
  coat: string
  /** Bits on the coating; none when absent. */
  topping?: string
  illustration: PeperoIllustration
}

export const peperoDesigns: PeperoDesign[] = [
  {
    id: 'pepero-choco',
    name: '오리지널',
    english: 'ORIGINAL',
    box: '#C9252C',
    band: '#3A1D13',
    coat: '#3A1D13',
    illustration: 'chocolate',
  },
  {
    id: 'pepero-almond',
    name: '아몬드',
    english: 'ALMOND',
    box: '#1F7A3E',
    band: '#3A1D13',
    coat: '#3A1D13',
    topping: '#D9A15F',
    illustration: 'almond',
  },
  {
    id: 'pepero-strawberry',
    name: '딸기',
    english: 'STRAWBERRY',
    box: '#F08CAA',
    band: '#3A1D13',
    coat: '#F6B3C6',
    topping: '#FFFFFF',
    illustration: 'strawberry',
  },
  {
    id: 'pepero-cookie',
    name: '화이트쿠키',
    english: 'WHITE COOKIE',
    box: '#F4F0E8',
    band: '#3A1D13',
    coat: '#F4EEE2',
    topping: '#2B1A14',
    illustration: 'cookie',
  },
]

export const DEFAULT_PEPERO_ID = peperoDesigns[0]!.id

export function getPeperoDesign(id: string | undefined): PeperoDesign {
  return peperoDesigns.find((design) => design.id === id) ?? peperoDesigns[0]!
}

/**
 * The 빼빼로 option is offered only around 11/11 (local time). `?pepero=1`
 * in the URL forces it on for testing outside the season.
 */
export function isPeperoSeason(now: Date = new Date(), search?: string) {
  const query =
    search ?? (typeof window !== 'undefined' ? window.location.search : '')
  if (new URLSearchParams(query).get('pepero') === '1') return true
  return now.getMonth() === 10 && now.getDate() >= 1 && now.getDate() <= 14
}
