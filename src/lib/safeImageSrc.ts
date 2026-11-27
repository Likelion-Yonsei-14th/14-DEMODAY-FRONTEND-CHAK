const INLINE_IMAGE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/

/**
 * Card photos are made in the composer as inline data: images (canvas.toDataURL).
 * They are stored as sent and shown to the desk owner and public visitors, so a
 * remote URL here would let a sender make every viewer's browser call their
 * server (a tracking pixel). Only inline raster images are allowed.
 */
export function isSafeCardPhotoSrc(src: unknown): src is string {
  return typeof src === 'string' && INLINE_IMAGE.test(src)
}
