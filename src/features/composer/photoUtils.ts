type ImageSource = {
  image: HTMLImageElement
  width: number
  height: number
  revoke: () => void
}

export type ProcessedPhoto = {
  src: string
  width: number
  height: number
}

const MAX_SOURCE_BYTES = 20 * 1024 * 1024
const TARGET_DATA_URL_LENGTH = 900_000

const attempts = [
  { maxSide: 1400, quality: .82 },
  { maxSide: 1200, quality: .76 },
  { maxSide: 1000, quality: .7 },
  { maxSide: 820, quality: .66 },
]

export async function processPhotoFile(file: File): Promise<ProcessedPhoto> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 추가할 수 있어요.')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('20MB보다 작은 사진을 선택해 주세요.')
  }

  const source = await loadImage(file)

  try {
    let lastResult: ProcessedPhoto | null = null

    for (const attempt of attempts) {
      const result = renderCompressedPhoto(
        source.image,
        source.width,
        source.height,
        attempt.maxSide,
        attempt.quality,
      )

      lastResult = result

      if (result.src.length <= TARGET_DATA_URL_LENGTH) {
        return result
      }
    }

    if (!lastResult) {
      throw new Error('사진을 처리하지 못했어요.')
    }

    return lastResult
  } finally {
    source.revoke()
  }
}

function loadImage(file: File): Promise<ImageSource> {
  const url = URL.createObjectURL(file)

  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        revoke: () => URL.revokeObjectURL(url),
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이 사진 형식은 브라우저에서 열 수 없어요.'))
    }

    image.src = url
  })
}

function renderCompressedPhoto(
  image: HTMLImageElement,
  width: number,
  height: number,
  maxSide: number,
  quality: number,
): ProcessedPhoto {
  const ratio = Math.min(1, maxSide / Math.max(width, height))
  const outputWidth = Math.max(1, Math.round(width * ratio))
  const outputHeight = Math.max(1, Math.round(height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d', { alpha: false })

  if (!context) {
    throw new Error('사진을 처리하지 못했어요.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, outputWidth, outputHeight)

  let src = canvas.toDataURL('image/webp', quality)

  if (!src.startsWith('data:image/webp')) {
    src = canvas.toDataURL('image/jpeg', quality)
  }

  return {
    src,
    width: outputWidth,
    height: outputHeight,
  }
}
