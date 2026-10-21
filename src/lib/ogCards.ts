/**
 * Link cards (Open Graph tags) that messengers such as KakaoTalk show for a
 * shared link. Scrapers do not run JavaScript, so the build writes a copy of
 * index.html per card (dist/og/<page>.html, see vite.config.ts) and
 * vercel.json rewrites each shared path to its copy. index.html itself
 * carries DEFAULT_OG_CARD for every other path.
 */

export type OgCard = { title: string; description: string }

export const DEFAULT_OG_CARD: OgCard = {
  title: '착!',
  description: '수능 전까지, 친구들의 마음을 모아두세요.',
}

/**
 * `source` is the vercel.json rewrite source whose destination is
 * `/og/<page>.html`. Cards are text only (no og:image).
 */
export const OG_PAGES: readonly { page: string; source: string; card: OgCard }[] = [
  {
    page: 'exam-career',
    source: '/minigame/exam-career/result/:path*',
    card: {
      title: '수험생 커리어 시뮬레이터',
      description: '나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!',
    },
  },
  {
    page: 'study-type',
    source: '/minigame/study-type/result/:path*',
    card: {
      title: '나의 수험생 유형은?',
      description: '나와 닮은 공부 캐릭터를 찾아보세요. 지금 테스트해 보세요!',
    },
  },
  {
    page: 'guess-god',
    source: '/minigame/guess-god/result/:path*',
    card: {
      title: '오늘의 찍신은 나야!',
      description: '10문제 찍기 운 시험, 너는 몇 개나 맞힐 수 있을까?',
    },
  },
  {
    page: 'desk',
    source: '/desk/:path*',
    card: {
      title: '응원 하나 놓고 가 줄래?',
      description: '수능을 앞둔 친구의 책상에 응원 메시지를 남겨 주세요.',
    },
  },
  {
    page: 'claim',
    source: '/prototype/claim',
    card: {
      title: '친구들이 응원 책상을 만들어 두었어요',
      description: '지금 열어서 내 책상을 받아 보세요.',
    },
  },
  {
    page: 'classroom-join',
    source: '/prototype/classroom/:classroomId/join',
    card: {
      title: '우리 반 응원 공간에 들어와!',
      description: '이름만 적으면 내 사물함이 생겨요. 칠판과 사물함에 서로 응원을 남겨요.',
    },
  },
]

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * Puts a card's title and description into index.html. og:url is dropped: one
 * copy serves many links, so scrapers should keep the address that was shared.
 */
export function withOgCard(html: string, card: OgCard): string {
  const values: Record<string, string> = {
    'og:title': card.title,
    'og:description': card.description,
  }
  return html
    .replace(/[ \t]*<meta property="og:url" content="[^"]*"\s*\/?>\r?\n?/, '')
    .replace(
      /<meta property="(og:title|og:description)" content="[^"]*"\s*\/?>/g,
      (_, property: string) => `<meta property="${property}" content="${escapeAttribute(values[property]!)}" />`,
    )
}
