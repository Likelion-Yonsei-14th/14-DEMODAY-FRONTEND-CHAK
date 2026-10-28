/**
 * What a search engine (and the browser tab) should show for the pages that are
 * meant to be found. Google runs the app before indexing, so each of these gets
 * its own title, description and address once its route renders. Every other
 * path keeps what index.html carries (see index.html and src/lib/ogCards.ts).
 */
const ORIGIN = 'https://www.chak.live'

export type PageMeta = { title: string; description: string }

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: '착! | 수험생 응원 책상 · 수능 응원 메시지 모으기',
    description:
      '수능을 앞둔 친구에게 응원 메시지를 모아 주는 책상, 착! 링크 하나로 친구들의 응원을 받고 답장해요. 수능 D-day 수험생 응원 메시지와 미니게임까지.',
  },
  '/minigame/study-type': {
    title: '나의 수험생 유형은? 공부 성향 테스트 | 착!',
    description: '몇 가지 질문으로 나와 닮은 공부 캐릭터를 찾아보세요. 수험생 공부 유형 테스트.',
  },
  '/minigame/exam-career': {
    title: '수험생 커리어 시뮬레이터 | 착!',
    description: '나의 수험생활은 어떻게 끝날까? 수험생 커리어 시뮬레이터에 도전해 보세요.',
  },
  '/minigame/d1-course': {
    title: '수능 끝 D+1 코스 짜기 | 착!',
    description: '수능 다음 날, 어디서 뭐 하고 놀까? 1분 만에 수능 끝 D+1 코스를 짜 보세요.',
  },
  '/minigame/guess-god': {
    title: '오늘의 찍신은 나야! 찍기 운 시험 | 착!',
    description: '10문제 찍기 운 시험, 나는 몇 개나 맞힐 수 있을까? 오늘의 찍신에 도전해 보세요.',
  },
  '/privacy': {
    title: '개인정보처리방침 | 착!',
    description: '착!이 수집하는 개인정보와 이용 목적, 보관 기간을 안내합니다.',
  },
  '/terms': {
    title: '이용약관 | 착!',
    description: '착! 서비스 이용약관을 안내합니다.',
  },
}

const normalize = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

function setMeta(name: string, content: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.setAttribute('content', content)
}

function setCanonical(href: string) {
  const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (link) link.href = href
}

let defaults: { title: string; description: string; canonical: string } | null = null
let applied = false

/** Applies the entry for `pathname`; any other path gets the page's original head back. */
export function applyPageMeta(pathname: string) {
  defaults ??= {
    title: document.title,
    description:
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? '',
    canonical: document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? `${ORIGIN}/`,
  }
  const path = normalize(pathname)
  const meta = PAGE_META[path]
  if (!meta) {
    // Only undo what this function set, so screens that set their own title (the proposal pages) keep it.
    if (applied) {
      document.title = defaults.title
      setMeta('description', defaults.description)
      setCanonical(defaults.canonical)
      applied = false
    }
    return
  }
  applied = true
  document.title = meta.title
  setMeta('description', meta.description)
  setCanonical(`${ORIGIN}${path === '/' ? '/' : path}`)
}
