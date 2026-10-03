/**
 * Seoul universities used for locker goods (pennant stickers, acrylic
 * charms). Only the school's name and a colour close to its school colour
 * are used — never emblems, mascots or logo lettering.
 */
export type University = {
  id: string
  name: string
  /** Word printed on goods. */
  word: string
  color: string
  /** Letter colour on the school colour. */
  ink: string
}

export const universities: University[] = [
  { id: 'konkuk', name: '건국대학교', word: 'KONKUK', color: '#0B6B3E', ink: '#FFFFFF' },
  { id: 'kyunghee', name: '경희대학교', word: 'KYUNG HEE', color: '#8E1F2F', ink: '#FFFFFF' },
  { id: 'korea', name: '고려대학교', word: 'KOREA', color: '#8B0F2B', ink: '#FFFFFF' },
  { id: 'kookmin', name: '국민대학교', word: 'KOOKMIN', color: '#0F4C81', ink: '#FFFFFF' },
  { id: 'dongguk', name: '동국대학교', word: 'DONGGUK', color: '#E2702A', ink: '#FFFFFF' },
  { id: 'sahmyook', name: '삼육대학교', word: 'SAHMYOOK', color: '#1E5AA8', ink: '#FFFFFF' },
  { id: 'seoultech', name: '서울과학기술대학교', word: 'SEOULTECH', color: '#0F3D73', ink: '#F2C94C' },
  { id: 'snu', name: '서울대학교', word: 'SNU', color: '#14246B', ink: '#FFFFFF' },
  { id: 'uos', name: '서울시립대학교', word: 'UOS', color: '#0A63B0', ink: '#FFFFFF' },
  { id: 'swu', name: '서울여자대학교', word: 'SWU', color: '#6A2C8C', ink: '#FFFFFF' },
  { id: 'skku', name: '성균관대학교', word: 'SKKU', color: '#0B5A3C', ink: '#E6C35C' },
  { id: 'soongsil', name: '숭실대학교', word: 'SOONGSIL', color: '#0A8FD0', ink: '#FFFFFF' },
  { id: 'yonsei', name: '연세대학교', word: 'YONSEI', color: '#0B2A63', ink: '#FFFFFF' },
  { id: 'ewha', name: '이화여자대학교', word: 'EWHA', color: '#0B4A2E', ink: '#FFFFFF' },
  { id: 'cau', name: '중앙대학교', word: 'CHUNG-ANG', color: '#2259A8', ink: '#FFFFFF' },
  { id: 'hufs', name: '한국외국어대학교', word: 'HUFS', color: '#0D2D5E', ink: '#E6C35C' },
  { id: 'hanyang', name: '한양대학교', word: 'HANYANG', color: '#0E4A84', ink: '#FFFFFF' },
  { id: 'hansung', name: '한성대학교', word: 'HANSUNG', color: '#1F4E79', ink: '#FFFFFF' },
]

export function getUniversity(id: string | undefined) {
  return universities.find((school) => school.id === id) ?? universities[0]!
}

/** Schools offered as acrylic charms (pennant stickers cover all of them). */
export const charmUniversities: University[] = ['yonsei', 'korea', 'snu'].map(
  (id) => getUniversity(id),
)

/** One acrylic university charm, prototype price in won. */
export const UNIVERSITY_CHARM_PRICE = 150

export type UniversityCharmShape =
  | 'jersey'
  | 'pennant'
  | 'badge'
  | 'letter'
  | 'jacket'
  | 'shield'

export const universityCharmShapes: { id: UniversityCharmShape; label: string }[] = [
  { id: 'jersey', label: '유니폼' },
  { id: 'jacket', label: '과잠' },
  { id: 'pennant', label: '깃발' },
  { id: 'badge', label: '원형 배지' },
  { id: 'letter', label: '이니셜' },
  { id: 'shield', label: '방패' },
]

const PREFIX = 'uni-'

export function universityCharmId(schoolId: string, shape: UniversityCharmShape) {
  return `${PREFIX}${schoolId}-${shape}`
}

/** Reads `uni-<school>-<shape>`; null for any other charm design. */
export function parseUniversityCharmId(assetId: string | undefined) {
  if (!assetId?.startsWith(PREFIX)) return null
  const rest = assetId.slice(PREFIX.length)
  const dash = rest.lastIndexOf('-')
  const shape = rest.slice(dash + 1) as UniversityCharmShape
  if (!universityCharmShapes.some((item) => item.id === shape)) return null
  return { school: getUniversity(rest.slice(0, dash)), shape }
}
