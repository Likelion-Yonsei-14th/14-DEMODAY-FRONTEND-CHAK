import type { CSSProperties } from 'react'
import { getPaperDesign } from './rollingPaper'
import '@/features/composer/cardRenderShared.css'

/** Class name and inline style that paint a paper (or a thumbnail) with a letter background. */
export function paperDesignSurface(designId?: string): {
  className: string
  style: CSSProperties
} {
  const design = getPaperDesign(designId)
  if (design.kind === 'image' && design.source) {
    return {
      className: '',
      style: {
        backgroundColor: design.tone,
        backgroundImage: `url(${design.source})`,
        backgroundSize: design.fit ?? 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      },
    }
  }
  return { className: design.className ?? '', style: {} }
}
