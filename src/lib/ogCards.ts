/**
 * Link cards (Open Graph tags) that messengers such as KakaoTalk show for a
 * shared link. Scrapers do not run JavaScript, so the build writes a copy of
 * index.html per card (dist/og/<page>.html, see vite.config.ts) and
 * vercel.json rewrites each shared path to its copy. index.html itself
 * carries DEFAULT_OG_CARD for every other path. A desk link is the one card
 * that names a person; api/og-desk.ts fills that in for link scrapers.
 */

import { STUDY_TYPE_CODES, STUDY_TYPE_RESULTS } from '../features/minigame/studyType/studyTypeResults'

export type OgCard = {
  title: string
  description: string
  /** Thumbnail, a path under /assets/og (1200x630). Left out, the card keeps the brand image. */
  image?: string
  /**
   * The page's own address, for pages meant to be found in search (the mini game
   * start pages). Those keep their robots tag and get this as canonical; every
   * other card (results, invitations, personal desks) asks not to be indexed.
   */
  indexPath?: string
}

export const SITE_ORIGIN = 'https://www.chak.live'
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const

export const DEFAULT_OG_CARD: OgCard = {
  title: '착!',
  description: '수능 전까지, 친구들의 마음을 모아두세요.',
}

type OgPage = { page: string; source: string; card: OgCard }

/**
 * `source` is the vercel.json rewrite source whose destination is
 * `/og/<page>.html`. Thumbnails live in public/assets/og and are drawn by
 * scripts/make-og-images.mjs.
 */
const BASE_PAGES: readonly OgPage[] = [
  // Mini game start pages: shared a lot, and meant to be found in search.
  {
    page: 'desk-blast',
    source: '/minigame/desk-blast',
    card: {
      title: '수능 블라스트 · 책상 정리 퍼즐',
      description: '공부하려고 앉았는데 책상 정리만 하고 있다면? 블록을 놓아 한 줄씩 정리하고 내 수험생 유형을 확인해 보세요!',
      image: '/assets/og/desk-blast.png',
      indexPath: '/minigame/desk-blast',
    },
  },
  {
    page: 'sneaky-phone',
    source: '/minigame/sneaky-phone',
    card: {
      title: '선생님 몰래 폰 하기',
      description: '선생님이 칠판을 볼 때만 폰을 하세요. 30초 동안 들키지 않고 버틸 수 있을까?',
      image: '/assets/og/sneaky-phone.png',
      indexPath: '/minigame/sneaky-phone',
    },
  },
  {
    page: 'study-type-intro',
    source: '/minigame/study-type',
    card: {
      title: '나의 수험생 유형은?',
      description: '나와 닮은 공부 캐릭터를 찾아보세요. 지금 테스트해 보세요!',
      image: '/assets/og/study-type.png',
      indexPath: '/minigame/study-type',
    },
  },
  {
    page: 'exam-career-intro',
    source: '/minigame/exam-career',
    card: {
      title: '수험생 커리어 시뮬레이터',
      description: '모의고사부터 수능, 합격 발표까지. 나의 수험생활은 어떻게 끝날까?',
      image: '/assets/og/exam-career.png',
      indexPath: '/minigame/exam-career',
    },
  },
  {
    page: 'd1-course-intro',
    source: '/minigame/d1-course',
    card: {
      title: '수능 끝 D+1 코스 짜기',
      description: '수능 다음 날, 어디서 뭐 하고 놀까? 1분 만에 코스를 짜 보세요!',
      image: '/assets/og/d1-course.png',
      indexPath: '/minigame/d1-course',
    },
  },
  {
    page: 'guess-god-intro',
    source: '/minigame/guess-god',
    card: {
      title: '오늘의 찍신은 나야!',
      description: '10문제 찍기 운 시험, 너는 몇 개나 맞힐 수 있을까?',
      image: '/assets/og/guess-god.png',
      indexPath: '/minigame/guess-god',
    },
  },
  // Result pages: the link is a person's result, so it should not be indexed.
  {
    page: 'exam-career',
    source: '/minigame/exam-career/result/:path*',
    card: {
      title: '수험생 커리어 시뮬레이터',
      description: '나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!',
      image: '/assets/og/exam-career.png',
    },
  },
  {
    page: 'd1-course',
    source: '/minigame/d1-course/result/:path*',
    card: {
      title: '수능 끝 D+1 코스 짜기',
      description: '수능 다음 날, 어디서 뭐 하고 놀까? 1분 만에 코스를 짜 보세요!',
      image: '/assets/og/d1-course.png',
    },
  },
  {
    page: 'study-type',
    source: '/minigame/study-type/result/:path*',
    card: {
      title: '나의 수험생 유형은?',
      description: '나와 닮은 공부 캐릭터를 찾아보세요. 지금 테스트해 보세요!',
      image: '/assets/og/study-type.png',
    },
  },
  {
    page: 'guess-god',
    source: '/minigame/guess-god/result/:path*',
    card: {
      title: '오늘의 찍신은 나야!',
      description: '10문제 찍기 운 시험, 너는 몇 개나 맞힐 수 있을까?',
      image: '/assets/og/guess-god.png',
    },
  },
  {
    page: 'promotion',
    source: '/promotion',
    card: {
      title: '착 · 수능 시즌 광고 제휴 제안',
      description: '수험생이 매일 여는 응원 앱 착에 브랜드 광고를 싣는 제안이에요.',
      image: '/assets/og/promotion.png',
    },
  },
  {
    page: 'desk',
    source: '/desk/:path*',
    card: {
      title: '응원 하나 놓고 가 줄래?',
      description: '수능을 앞둔 친구의 책상에 응원 메시지를 남겨 주세요.',
      image: '/assets/og/desk.png',
    },
  },
  {
    page: 'claim',
    source: '/claim',
    card: {
      title: '친구들이 응원 책상을 만들어 두었어요',
      description: '지금 열어서 내 책상을 받아 보세요.',
      image: '/assets/og/claim.png',
    },
  },
  {
    page: 'classroom-join',
    source: '/classroom/:classroomId/join',
    card: {
      title: '우리 반 응원 공간에 들어와!',
      description: '이름만 적으면 내 사물함이 생겨요. 칠판과 사물함에 서로 응원을 남겨요.',
      image: '/assets/og/classroom-join.png',
    },
  },
]

/** Each study type's result link names the type, with its own character as the thumbnail. */
const STUDY_TYPE_PAGES: readonly OgPage[] = STUDY_TYPE_CODES.map((code) => {
  const result = STUDY_TYPE_RESULTS[code]
  return {
    page: `study-type-${result.slug}`,
    source: `/minigame/study-type/result/${result.slug}`,
    card: {
      title: `나는 ${result.typeName}!`,
      description: `${result.tagline} 너의 수험생 유형도 확인해 봐!`,
      image: `/assets/og/study-type-${result.slug}.png`,
    },
  }
})

/** A guess-god result link carries only the score, so it can say it. */
export const GUESS_GOD_SCORES = Array.from({ length: 11 }, (_, score) => score)

const GUESS_GOD_PAGES: readonly OgPage[] = GUESS_GOD_SCORES.map((score) => ({
  page: `guess-god-${score}`,
  source: `/minigame/guess-god/result/${score}`,
  card: {
    title: `오늘의 찍신 ${score}/10`,
    description: score >= 5 ? `10문제 중 ${score}개를 찍어서 맞혔어요! 너는 몇 개나 맞힐 수 있을까?` : `10문제 중 ${score}개 맞혔어요. 너는 나보다 운이 좋을까?`,
    image: '/assets/og/guess-god.png',
  },
}))

/**
 * Specific result links come before the general ones, so each is served its own
 * card and every other result address falls back to the general card.
 */
export const OG_PAGES: readonly OgPage[] = [...STUDY_TYPE_PAGES, ...GUESS_GOD_PAGES, ...BASE_PAGES]

/** The card for a desk link: the owner's name, when the desk is known. */
export function deskCard(desk: { displayName: string; roomClosed?: boolean } | null): OgCard {
  const base = BASE_PAGES.find((item) => item.page === 'desk')!.card
  if (!desk || !desk.displayName.trim()) return base
  const name = desk.displayName.trim()
  return {
    title: `${name}님의 응원 책상`,
    description: desk.roomClosed
      ? `${name}님의 응원 책상이에요. 지금은 새 응원을 받지 않고 있어요.`
      : `수능을 앞둔 ${name}님에게 응원 한마디를 남겨 주세요.`,
    image: base.image,
  }
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * Puts a card's title and description into index.html. og:url is dropped: one
 * copy serves many links, so scrapers should keep the address that was shared.
 *
 * Search engines get the same copy: these pages are results, personal desks and
 * invitations, so they ask not to be indexed, and the home page's address,
 * structured data and crawler text are left out because they describe `/` only.
 */
export function withOgCard(html: string, card: OgCard): string {
  const values: Record<string, string> = {
    'og:title': card.title,
    'og:description': card.description,
  }
  const title = escapeAttribute(card.title)
  const description = escapeAttribute(card.description)
  let result = html
    .replace(/[ \t]*<meta property="og:url" content="[^"]*"\s*\/?>\r?\n?/, '')
    .replace(
      /<meta property="(og:title|og:description)" content="[^"]*"\s*\/?>/g,
      (_, property: string) => `<meta property="${property}" content="${escapeAttribute(values[property]!)}" />`,
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)

  if (card.image) {
    const url = `${SITE_ORIGIN}${card.image}`
    result = result.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${escapeAttribute(url)}$2`)
    result = /<meta name="twitter:image" /.test(result)
      ? result.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${escapeAttribute(url)}$2`)
      : result.replace(
          /(<meta name="twitter:card" content="summary_large_image" \/>)/,
          `$1\n    <meta name="twitter:image" content="${escapeAttribute(url)}" />`,
        )
  }

  if (card.indexPath) {
    // A page meant to be found keeps its robots tag, and its own address instead of the home page's.
    const address = escapeAttribute(`${SITE_ORIGIN}${card.indexPath}`)
    return result
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${address}$2`)
      .replace(/(<meta property="og:title" content="[^"]*" \/>)/, `$1\n    <meta property="og:url" content="${address}" />`)
      .replace(/[ \t]*<!-- seo:jsonld:start -->[\s\S]*?<!-- seo:jsonld:end -->\r?\n?/, '')
      .replace(/\s*<!-- seo:fallback:start -->[\s\S]*?<!-- seo:fallback:end -->\s*/, '')
  }

  return result
    .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex,nofollow" />')
    .replace(/[ \t]*<link rel="canonical" href="[^"]*"\s*\/?>\r?\n?/, '')
    .replace(/[ \t]*<!-- seo:jsonld:start -->[\s\S]*?<!-- seo:jsonld:end -->\r?\n?/, '')
    .replace(/\s*<!-- seo:fallback:start -->[\s\S]*?<!-- seo:fallback:end -->\s*/, '')
}
