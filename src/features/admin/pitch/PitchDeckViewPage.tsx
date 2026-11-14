import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PitchSlideView } from './PitchSlideView'
import { buildSlides, decodeDeck } from './pitchSlides'
import './pitchDeckView.css'

/**
 * 장표를 웹에서 한 장씩 넘겨 보는 화면. 내용은 주소(?d=)에 들어 있어 링크만 보내면 같은 장표가 열린다.
 * 방향키·스페이스로 넘기고, 인쇄하면 한 장이 한 쪽으로 나온다.
 */
export function PitchDeckViewPage() {
  const [params] = useSearchParams()
  const input = useMemo(() => decodeDeck(params.get('d')), [params])
  const slides = useMemo(() => buildSlides(input), [input])

  useEffect(() => {
    const previous = document.title
    document.title = `${input.storeName.trim() || '매장'} × 착 제휴 제안`
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.append(robots)
    return () => {
      document.title = previous
      robots.remove()
    }
  }, [input.storeName])

  useEffect(() => {
    const move = (event: KeyboardEvent) => {
      const forward = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)
      const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)
      if (!forward && !back) return
      const pages = [...document.querySelectorAll<HTMLElement>('.pdeck__page')]
      const middle = window.innerHeight / 2
      const current = pages.findIndex((page) => page.getBoundingClientRect().bottom > middle)
      const next = pages[Math.min(Math.max(current + (forward ? 1 : -1), 0), pages.length - 1)]
      if (!next) return
      event.preventDefault()
      next.scrollIntoView({ block: 'center' })
    }
    window.addEventListener('keydown', move)
    return () => window.removeEventListener('keydown', move)
  }, [])

  return (
    <main className="pdeck">
      <h1 className="pdeck__title">{input.storeName.trim() || '매장'} × 착 제휴 제안</h1>
      <ol className="pdeck__pages">
        {slides.map((slide, index) => (
          <li key={slide.kicker} className="pdeck__page">
            <PitchSlideView slide={slide} page={index + 1} total={slides.length} />
          </li>
        ))}
      </ol>
      <p className="pdeck__hint">방향키나 스크롤로 넘겨요 · 인쇄하면 PDF로 저장할 수 있어요</p>
    </main>
  )
}
