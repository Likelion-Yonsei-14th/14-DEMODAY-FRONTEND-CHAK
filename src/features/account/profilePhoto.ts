const PROFILE_PHOTO_SIZE = 256
const MAX_SOURCE_BYTES = 20 * 1024 * 1024

/**
 * Turns a picked image into a small square JPEG data URL for the profile:
 * centre-cropped and 256px, so it stays a few tens of KB in storage.
 */
export async function makeProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 고를 수 있어요.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('20MB보다 작은 사진을 골라 주세요.')
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('사진을 열지 못했어요. 다른 사진을 골라 주세요.'))
      element.src = url
    })

    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = PROFILE_PHOTO_SIZE
    canvas.height = PROFILE_PHOTO_SIZE
    const context = canvas.getContext('2d')
    if (!context || side === 0) throw new Error('사진을 처리하지 못했어요.')

    context.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      PROFILE_PHOTO_SIZE,
      PROFILE_PHOTO_SIZE,
    )
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
