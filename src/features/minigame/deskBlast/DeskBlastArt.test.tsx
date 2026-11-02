import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PieceArt } from './DeskBlastArt'
import { ITEMS, SHAPE_DEFS, itemOf } from './deskBlastShapes'

describe('the drawings', () => {
  it('draws every block in every orientation without trouble', () => {
    for (const def of SHAPE_DEFS) {
      const { container, unmount } = render(<PieceArt kind={def.kind} cells={def.shape} />)
      const svg = container.querySelector('svg')!

      expect(svg, `${itemOf(def.kind).id} ${def.rows.join('/')}`).not.toBeNull()
      expect(svg.getAttribute('viewBox')).toBe(`0 0 ${def.width} ${def.height}`)
      expect(svg.getAttribute('data-kind')).toBe(itemOf(def.kind).id)
      expect(svg.querySelectorAll('path, rect, circle, ellipse, text').length).toBeGreaterThan(2)
      unmount()
    }
  })

  it('is hidden from screen readers; the block has its own name', () => {
    const { container } = render(<PieceArt kind={4} cells={[[0, 0], [0, 1], [0, 2], [0, 3]]} />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('stretches over the whole box it is given', () => {
    const { container } = render(<PieceArt kind={5} cells={[[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]} />)

    expect(container.querySelector('svg')).toHaveAttribute('preserveAspectRatio', 'none')
  })

  it('gives an upright pencil and a lying one the same picture, turned', () => {
    const lying = render(<PieceArt kind={4} cells={[[0, 0], [0, 1], [0, 2], [0, 3]]} />)
    const standing = render(<PieceArt kind={4} cells={[[0, 0], [1, 0], [2, 0], [3, 0]]} />)

    expect(lying.container.querySelector('g[transform]')?.getAttribute('transform')).toBe('matrix(1 0 0 1 0 0)')
    expect(standing.container.querySelector('g[transform]')?.getAttribute('transform')).toMatch(/^matrix\(/)
    expect(standing.container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 1 4')
  })

  it('draws the exam ticket standing up as its own portrait picture, not a turned one', () => {
    const wide = render(<PieceArt kind={7} cells={[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]} />)
    const tall = render(<PieceArt kind={7} cells={[[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]]} />)

    expect(wide.container.querySelector('g[transform]')?.getAttribute('transform')).toBe('matrix(1 0 0 1 0 0)')
    expect(tall.container.querySelector('g[transform]')).toBeNull()
    expect(wide.container.textContent).toContain('수험표')
    expect(tall.container.textContent).toContain('수험표')
    expect(tall.container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 2 3')
  })

  it('shows only the cells that are left, with a clip path, and joins neighbors without a crack', () => {
    const cells = [[2, 2], [2, 3], [2, 4]] as const
    const { container } = render(<PieceArt kind={3} cells={cells} visible={new Set(['2,2', '2,3'])} />)

    const clip = container.querySelector('clipPath')!
    const rects = [...clip.querySelectorAll('rect')]
    expect(rects).toHaveLength(2)
    // Two neighbors reach into each other, so no seam shows between them.
    expect(Number(rects[0]!.getAttribute('width'))).toBeGreaterThan(1)
    expect(container.querySelector('g[clip-path]')).not.toBeNull()
  })

  it('has no clip path when nothing was cleared', () => {
    const { container } = render(<PieceArt kind={3} cells={[[0, 0], [0, 1], [0, 2]]} />)

    expect(container.querySelector('clipPath')).toBeNull()
    expect(container.querySelector('g[clip-path]')).toBeNull()
  })

  it('keeps the ids of two drawings apart, so one never paints with the other’s colors', () => {
    const { container } = render(
      <>
        <PieceArt kind={4} cells={[[0, 0], [0, 1], [0, 2], [0, 3]]} />
        <PieceArt kind={4} cells={[[0, 0], [0, 1], [0, 2], [0, 3]]} />
      </>,
    )
    const ids = [...container.querySelectorAll('[id]')].map((node) => node.id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a name for every item the game can deal', () => {
    for (const item of ITEMS) expect(item.name.length).toBeGreaterThan(0)
  })
})
