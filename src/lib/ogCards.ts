/**
 * Link cards (Open Graph tags) that messengers such as KakaoTalk show for a
 * shared link. Scrapers do not run JavaScript, so middleware.ts writes the
 * card for a shared path into index.html before it is served. index.html
 * itself carries DEFAULT_OG_CARD for every other path.
 */
export const SITE_ORIGIN = 'https://www.chak.live'
export const OG_IMAGE_URL = `${SITE_ORIGIN}/og-image.png`

export type OgCard = { title: string; description: string }

export const DEFAULT_OG_CARD: OgCard = {
  title: '착!',
  description: '수능 전까지, 친구들의 마음을 모아두세요.',
}

/** First match wins. Every card uses the same thumbnail (OG_IMAGE_URL). */
const OG_CARDS: readonly { pattern: RegExp; card: OgCard }[] = [
  {
    pattern: /^\/minigame\/exam-career\/result\//,
    card: {
      title: '수험생 커리어 시뮬레이터',
      description: '나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!',
    },
  },
  {
    pattern: /^\/minigame\/study-type\/result\//,
    card: {
      title: '나의 수험생 유형은?',
      description: '나와 닮은 공부 캐릭터를 찾아보세요. 지금 테스트해 보세요!',
    },
  },
  {
    pattern: /^\/minigame\/guess-god\/result\//,
    card: {
      title: '오늘의 찍신은 나야!',
      description: '10문제 찍기 운 시험, 너는 몇 개나 맞힐 수 있을까?',
    },
  },
  {
    pattern: /^\/desk\//,
    card: {
      title: '응원 하나 놓고 가 줄래?',
      description: '수능을 앞둔 친구의 책상에 응원 메시지를 남겨 주세요.',
    },
  },
  {
    pattern: /^\/prototype\/claim\/?$/,
    card: {
      title: '친구들이 응원 책상을 만들어 두었어요',
      description: '지금 열어서 내 책상을 받아 보세요.',
    },
  },
  {
    pattern: /^\/prototype\/classroom\/[^/]+\/join\/?$/,
    card: {
      title: '우리 반 응원 공간에 들어와!',
      description: '이름만 적으면 내 사물함이 생겨요. 칠판과 사물함에 서로 응원을 남겨요.',
    },
  },
]

export function ogCardFor(pathname: string): OgCard {
  return OG_CARDS.find(({ pattern }) => pattern.test(pathname))?.card ?? DEFAULT_OG_CARD
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Rewrites the og:title, og:description and og:url tags of index.html for one path. */
export function withOgCard(html: string, pathname: string): string {
  const card = ogCardFor(pathname)
  const values: Record<string, string> = {
    'og:title': card.title,
    'og:description': card.description,
    'og:url': new URL(pathname, SITE_ORIGIN).toString(),
  }
  return html.replace(
    /<meta property="(og:title|og:description|og:url)" content="[^"]*"\s*\/?>/g,
    (_, property: string) => `<meta property="${property}" content="${escapeAttribute(values[property]!)}" />`,
  )
}
