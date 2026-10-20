import {
  STUDY_TYPE_RESULTS,
  type StudyTypeCode,
} from './studyTypeResults'

/*
 * Placeholder character drawings, made for this mini game so there are no
 * licensing questions. They share one style: 240×240, thick ink outline,
 * flat fills, round face at the same spot, props telling the type apart.
 * Once real illustrations exist, set `characterAsset.imageSrc` in
 * studyTypeResults.ts and these are no longer used for that type.
 */

const INK = '#2a2520'
const CHEEK = '<ellipse cx="86" cy="136" rx="10" ry="6" fill="#ff8fa3" opacity=".55" stroke="none"/><ellipse cx="154" cy="136" rx="10" ry="6" fill="#ff8fa3" opacity=".55" stroke="none"/>'

const dotEyes = (y = 116, r = 6) =>
  `<circle cx="102" cy="${y}" r="${r}" fill="${INK}" stroke="none"/><circle cx="138" cy="${y}" r="${r}" fill="${INK}" stroke="none"/>` +
  `<circle cx="${104}" cy="${y - 2}" r="2" fill="#fff" stroke="none"/><circle cx="${140}" cy="${y - 2}" r="2" fill="#fff" stroke="none"/>`

const smileEyes = (y = 116) =>
  `<path d="M94 ${y} q8 -8 16 0" fill="none"/><path d="M130 ${y} q8 -8 16 0" fill="none"/>`

const calmEyes = (y = 114) =>
  `<path d="M94 ${y} q8 6 16 0" fill="none"/><path d="M130 ${y} q8 6 16 0" fill="none"/>`

const sweat = (x: number, y: number) =>
  `<path d="M${x} ${y} q-8 12 0 16 q8 -4 0 -16z" fill="#8ec5ff"/>`

const star = (cx: number, cy: number, r: number, fill: string) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.45
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`
  })
  return `<polygon points="${points.join(' ')}" fill="${fill}" stroke-width="3.5"/>`
}

const DRAWINGS: Record<StudyTypeCode, string> = {
  // 부엉이: 안경, 플래너, 살짝 걱정스러운 눈썹
  PSA: `
    <ellipse cx="120" cy="214" rx="72" ry="48" fill="#a98a6a"/>
    <polygon points="66,84 72,44 102,70" fill="#a98a6a"/>
    <polygon points="174,84 168,44 138,70" fill="#a98a6a"/>
    <circle cx="120" cy="120" r="62" fill="#a98a6a"/>
    <circle cx="102" cy="116" r="22" fill="#f3e6d3" stroke="none"/>
    <circle cx="138" cy="116" r="22" fill="#f3e6d3" stroke="none"/>
    ${dotEyes(116, 5)}
    <circle cx="102" cy="116" r="18" fill="none" stroke-width="4"/>
    <circle cx="138" cy="116" r="18" fill="none" stroke-width="4"/>
    <path d="M116 112 q4 -4 8 0" fill="none" stroke-width="4"/>
    <path d="M86 90 l18 -6" fill="none" stroke-width="4"/>
    <path d="M154 90 l-18 -6" fill="none" stroke-width="4"/>
    <polygon points="113,136 127,136 120,148" fill="#ffb52e" stroke-width="4"/>
    ${sweat(176, 86)}
    <rect x="82" y="168" width="76" height="54" rx="6" fill="#fffdf8"/>
    <path d="M94 184 l5 5 9 -10" fill="none" stroke-width="4"/>
    <path d="M114 184 h32 M94 202 h52" fill="none" stroke-width="4"/>
    <ellipse cx="76" cy="190" rx="12" ry="18" fill="#8d7155"/>
    <ellipse cx="164" cy="190" rx="12" ry="18" fill="#8d7155"/>`,

  // 거북이: 등껍질, 펼친 책, 편안히 감은 눈
  PSN: `
    <ellipse cx="120" cy="206" rx="92" ry="58" fill="#5fae7f"/>
    <path d="M60 196 l26 -20 h28 l12 20 l-12 22 h-28z M126 196 l12 -20 h28 l18 20 l-18 22 h-28z" fill="none" stroke-width="4" opacity=".5"/>
    <circle cx="120" cy="116" r="56" fill="#a8d98a"/>
    ${calmEyes(114)}
    ${CHEEK}
    <path d="M110 136 q10 8 20 0" fill="none"/>
    <path d="M120 176 L72 166 L72 212 L120 222 Z" fill="#fffdf8"/>
    <path d="M120 176 L168 166 L168 212 L120 222 Z" fill="#fffdf8"/>
    <path d="M84 182 l24 4 M84 196 l24 4 M132 186 l24 -4 M132 200 l24 -4" fill="none" stroke-width="3.5" opacity=".6"/>
    <circle cx="70" cy="190" r="10" fill="#a8d98a"/>
    <circle cx="170" cy="190" r="10" fill="#a8d98a"/>`,

  // 여우: 확성기, 체크리스트, 의욕 넘치는 입
  PFA: `
    <ellipse cx="120" cy="214" rx="72" ry="48" fill="#f08a3c"/>
    <polygon points="66,92 74,40 110,70" fill="#f08a3c"/>
    <polygon points="174,92 166,40 130,70" fill="#f08a3c"/>
    <polygon points="78,80 80,56 98,70" fill="#fff2e6" stroke="none"/>
    <polygon points="162,80 160,56 142,70" fill="#fff2e6" stroke="none"/>
    <circle cx="120" cy="120" r="60" fill="#f08a3c"/>
    <ellipse cx="120" cy="142" rx="36" ry="26" fill="#fff6ec"/>
    ${dotEyes(112)}
    <path d="M90 98 l18 4 M150 98 l-18 4" fill="none" stroke-width="4"/>
    <ellipse cx="120" cy="130" rx="6" ry="4" fill="${INK}"/>
    <path d="M110 144 q10 12 20 0 z" fill="#ff7a7a" stroke-width="4"/>
    <rect x="46" y="166" width="50" height="60" rx="6" fill="#fffdf8"/>
    <path d="M56 182 l4 4 7 -8 M56 200 l4 4 7 -8 M74 182 h14 M74 200 h14 M56 216 h32" fill="none" stroke-width="3.5"/>
    <polygon points="156,182 204,156 204,212 156,196" fill="#ffc21a"/>
    <rect x="144" y="180" width="14" height="18" rx="3" fill="#ffc21a"/>
    <path d="M212 168 l10 -6 M214 184 h12 M212 200 l10 6" fill="none" stroke-width="4"/>`,

  // 강아지: 늘어진 귀, 별 스티커, 노트
  PFN: `
    <ellipse cx="120" cy="214" rx="72" ry="48" fill="#f2c27b"/>
    <circle cx="120" cy="118" r="60" fill="#f2c27b"/>
    <ellipse cx="66" cy="114" rx="16" ry="32" fill="#b9814a" transform="rotate(14 66 114)"/>
    <ellipse cx="174" cy="114" rx="16" ry="32" fill="#b9814a" transform="rotate(-14 174 114)"/>
    ${smileEyes(114)}
    ${CHEEK}
    <ellipse cx="120" cy="128" rx="7" ry="5" fill="${INK}"/>
    <path d="M108 138 q12 8 24 0" fill="none" stroke-width="4"/>
    <path d="M114 140 q6 16 12 0" fill="#ff7a8a" stroke-width="3.5"/>
    <rect x="80" y="168" width="80" height="56" rx="6" fill="#fffdf8"/>
    <path d="M80 168 v56" stroke-width="8" stroke="#ff8fa3"/>
    ${star(130, 194, 14, '#ffc21a')}
    ${star(196, 70, 14, '#ffc21a')}
    ${star(44, 82, 10, '#ff8fa3')}
    <circle cx="76" cy="196" r="11" fill="#f2c27b"/>
    <circle cx="164" cy="196" r="11" fill="#f2c27b"/>`,

  // 햄스터: 알람시계, 책 더미, 동그랗게 뜬 눈
  LSA: `
    <ellipse cx="120" cy="214" rx="72" ry="48" fill="#f6c79a"/>
    <circle cx="78" cy="70" r="16" fill="#f6c79a"/>
    <circle cx="162" cy="70" r="16" fill="#f6c79a"/>
    <circle cx="78" cy="70" r="7" fill="#ffb3c1" stroke="none"/>
    <circle cx="162" cy="70" r="7" fill="#ffb3c1" stroke="none"/>
    <circle cx="120" cy="122" r="60" fill="#f6c79a"/>
    <ellipse cx="120" cy="146" rx="40" ry="26" fill="#fff6ec" stroke="none"/>
    <circle cx="102" cy="114" r="9" fill="#fff"/>
    <circle cx="138" cy="114" r="9" fill="#fff"/>
    <circle cx="102" cy="115" r="4.5" fill="${INK}" stroke="none"/>
    <circle cx="138" cy="115" r="4.5" fill="${INK}" stroke="none"/>
    <ellipse cx="80" cy="138" rx="13" ry="9" fill="#ff8fa3" opacity=".5" stroke="none"/>
    <ellipse cx="160" cy="138" rx="13" ry="9" fill="#ff8fa3" opacity=".5" stroke="none"/>
    <path d="M114 136 q6 -5 12 0" fill="none" stroke-width="4"/>
    ${sweat(170, 92)}
    <circle cx="58" cy="190" r="26" fill="#fffdf8"/>
    <circle cx="40" cy="166" r="7" fill="#ff5f5f"/>
    <circle cx="76" cy="166" r="7" fill="#ff5f5f"/>
    <path d="M58 190 v-14 M58 190 l10 6" fill="none" stroke-width="4"/>
    <rect x="150" y="196" width="62" height="16" rx="3" fill="#2f6bff"/>
    <rect x="156" y="180" width="54" height="16" rx="3" fill="#1faf8c"/>
    <rect x="148" y="164" width="58" height="16" rx="3" fill="#ffc21a"/>`,

  // 고양이: 헤드폰, 만족스럽게 감은 눈, 음표
  LSN: `
    <ellipse cx="120" cy="214" rx="72" ry="48" fill="#b8bcc8"/>
    <polygon points="66,96 70,46 106,72" fill="#b8bcc8"/>
    <polygon points="174,96 170,46 134,72" fill="#b8bcc8"/>
    <polygon points="78,84 80,62 96,74" fill="#ffc2cf" stroke="none"/>
    <polygon points="162,84 160,62 144,74" fill="#ffc2cf" stroke="none"/>
    <circle cx="120" cy="122" r="58" fill="#b8bcc8"/>
    ${smileEyes(118)}
    ${CHEEK}
    <path d="M116 130 l4 4 4 -4 z" fill="#ff8fa3" stroke-width="3"/>
    <path d="M108 140 q6 6 12 0 q6 6 12 0" fill="none" stroke-width="4"/>
    <path d="M70 128 h-20 M72 138 l-18 6 M170 128 h20 M168 138 l18 6" fill="none" stroke-width="3.5"/>
    <path d="M62 118 A60 60 0 0 1 178 118" fill="none" stroke="#2f6bff" stroke-width="10"/>
    <rect x="50" y="104" width="20" height="38" rx="9" fill="#2f6bff"/>
    <rect x="170" y="104" width="20" height="38" rx="9" fill="#2f6bff"/>
    <path d="M196 64 v-24 l14 -4 v24" fill="none" stroke-width="4"/>
    <ellipse cx="192" cy="66" rx="6" ry="5" fill="${INK}"/>
    <ellipse cx="206" cy="62" rx="6" ry="5" fill="${INK}"/>
    <rect x="96" y="178" width="66" height="44" rx="6" fill="#fffdf8"/>
    <path d="M106 192 h44 M106 206 h30" fill="none" stroke-width="3.5" opacity=".6"/>`,

  // 너구리: 눈 주변 무늬, 커피, 밤하늘 달
  LFA: `
    <ellipse cx="120" cy="214" rx="72" ry="48" fill="#9a9aa3"/>
    <circle cx="78" cy="68" r="18" fill="#9a9aa3"/>
    <circle cx="162" cy="68" r="18" fill="#9a9aa3"/>
    <circle cx="78" cy="68" r="8" fill="#4a4744" stroke="none"/>
    <circle cx="162" cy="68" r="8" fill="#4a4744" stroke="none"/>
    <circle cx="120" cy="120" r="60" fill="#9a9aa3"/>
    <path d="M70 112 q32 -22 50 4 q18 -26 50 -4 q-4 22 -26 22 q-16 0 -24 -10 q-8 10 -24 10 q-22 0 -26 -22z" fill="#4a4744"/>
    <circle cx="100" cy="116" r="8" fill="#fff" stroke="none"/>
    <circle cx="140" cy="116" r="8" fill="#fff" stroke="none"/>
    <circle cx="100" cy="117" r="4" fill="${INK}" stroke="none"/>
    <circle cx="140" cy="117" r="4" fill="${INK}" stroke="none"/>
    <ellipse cx="120" cy="150" rx="26" ry="18" fill="#f1efe9"/>
    <ellipse cx="120" cy="142" rx="6" ry="4" fill="${INK}"/>
    <path d="M112 154 q8 6 16 0" fill="none" stroke-width="4"/>
    <path d="M40 64 a20 20 0 1 0 22 -26 a16 16 0 1 1 -22 26z" fill="#ffc21a" stroke-width="4"/>
    <path d="M160 178 h40 l-5 44 h-30 z" fill="#fffdf8"/>
    <rect x="156" y="170" width="48" height="10" rx="4" fill="#b9814a"/>
    <path d="M200 192 q14 2 10 14 q-2 8 -12 6" fill="none" stroke-width="4"/>
    <path d="M172 160 q-6 -8 0 -16 M186 160 q-6 -8 0 -16" fill="none" stroke-width="3.5" opacity=".6"/>
    <rect x="52" y="180" width="64" height="40" rx="5" fill="#ff5fa2"/>
    <path d="M60 192 h48" fill="none" stroke="#fff" stroke-width="4"/>`,

  // 펭귄: 아이스커피, 노트, 여유로운 얼굴
  LFN: `
    <ellipse cx="120" cy="214" rx="74" ry="50" fill="#33415c"/>
    <circle cx="120" cy="120" r="62" fill="#33415c"/>
    <path d="M120 96 q-14 -14 -30 -4 q-20 14 -12 42 q10 32 42 32 q32 0 42 -32 q8 -28 -12 -42 q-16 -10 -30 4z" fill="#fffdf8"/>
    ${dotEyes(118)}
    ${CHEEK}
    <path d="M110 134 l10 10 l10 -10 z" fill="#ffb52e" stroke-width="4"/>
    <path d="M150 168 h40 l-6 54 h-28 z" fill="#c69a6b" opacity=".9"/>
    <path d="M150 168 h40 l-2 16 h-36 z" fill="#fffdf8" opacity=".8"/>
    <rect x="160" y="190" width="10" height="10" rx="2" fill="#fff" stroke-width="3" opacity=".9"/>
    <rect x="172" y="200" width="10" height="10" rx="2" fill="#fff" stroke-width="3" opacity=".9"/>
    <path d="M176 168 l10 -30" fill="none" stroke="#ff5fa2" stroke-width="6"/>
    <rect x="52" y="180" width="62" height="42" rx="5" fill="#ffc21a"/>
    <path d="M62 194 h42 M62 208 h28" fill="none" stroke-width="3.5" opacity=".6"/>
    <ellipse cx="60" cy="168" rx="12" ry="24" fill="#33415c" transform="rotate(24 60 168)"/>`,
}

export function characterSvgMarkup(typeCode: StudyTypeCode) {
  const background = STUDY_TYPE_RESULTS[typeCode].characterAsset.background
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">` +
    `<defs><clipPath id="c"><circle cx="120" cy="120" r="116"/></clipPath></defs>` +
    `<circle cx="120" cy="120" r="116" fill="${background}"/>` +
    `<g clip-path="url(#c)" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">` +
    DRAWINGS[typeCode] +
    `</g></svg>`
  )
}

/** Image URL for a type's character: the real asset when set, else the placeholder drawing. */
export function getCharacterSrc(typeCode: StudyTypeCode) {
  const asset = STUDY_TYPE_RESULTS[typeCode].characterAsset
  return (
    asset.imageSrc ??
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(characterSvgMarkup(typeCode))}`
  )
}
