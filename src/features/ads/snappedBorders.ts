/**
 * 화면 배율이 정수가 아닌 기기(Windows 150% 등)에서는 1px 테두리가 0.666667px처럼 계산된다.
 * html-to-image는 이 값과 상자 너비를 그대로 복사하는데, 이미지(SVG) 안에서는 1배율로 다시 배치되어
 * 1px 미만 테두리가 1px로 올림된다. 그만큼 안쪽 폭이 줄어 글자에 꼭 맞던 칩·태그가 "서/울"처럼 줄바꿈된다.
 *
 * 찍는 동안만 getComputedStyle을 감싸, 올림될 만큼 border-box 상자의 너비·높이를 미리 늘려 준다.
 */

/** 1배율에서 이 테두리가 올림되며 늘어나는 길이. */
export function snapGrowth(borderWidth: string): number {
  const value = parseFloat(borderWidth)
  return value > 0 && value < 1 ? 1 - value : 0
}

const HORIZONTAL = new Set(['width', 'inline-size'])
const VERTICAL = new Set(['height', 'block-size'])

function grow(value: string, by: number) {
  if (!by || !value.endsWith('px')) return value
  const px = parseFloat(value)
  return Number.isFinite(px) ? `${+(px + by).toFixed(4)}px` : value
}

/** `win.getComputedStyle`이 올림을 감안한 너비·높이를 돌려주게 한다. 되돌리는 함수를 돌려준다. */
export function compensateSnappedBorders(win: Window): () => void {
  const original = win.getComputedStyle
  const patched = function (element: Element, pseudo?: string | null) {
    const style = original.call(win, element, pseudo)
    if (pseudo || style.getPropertyValue('box-sizing') !== 'border-box') return style
    const dx = snapGrowth(style.getPropertyValue('border-left-width')) + snapGrowth(style.getPropertyValue('border-right-width'))
    const dy = snapGrowth(style.getPropertyValue('border-top-width')) + snapGrowth(style.getPropertyValue('border-bottom-width'))
    if (!dx && !dy) return style
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (name: string) => {
            const value = target.getPropertyValue(name)
            return HORIZONTAL.has(name) ? grow(value, dx) : VERTICAL.has(name) ? grow(value, dy) : value
          }
        }
        const value = Reflect.get(target, prop, target) as unknown
        return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value
      },
    })
  } as typeof win.getComputedStyle
  win.getComputedStyle = patched
  return () => {
    if (win.getComputedStyle === patched) win.getComputedStyle = original
  }
}
