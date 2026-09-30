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
  aspectRatio: number
  hasTransparency: boolean
}

const MAX_SOURCE_BYTES = 20 * 1024 * 1024
const TARGET_DATA_URL_LENGTH = 260_000

const attempts = [
  { maxSide: 1200, quality: .78 },
  { maxSide: 1000, quality: .7 },
  { maxSide: 820, quality: .62 },
  { maxSide: 720, quality: .56 },
  { maxSide: 600, quality: .5 },
]

export async function processPhotoFile(
  file: File,
): Promise<ProcessedPhoto> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 추가할 수 있어요.')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('20MB보다 작은 사진을 선택해 주세요.')
  }

  const source = await loadImage(file)

  try {
    const hasTransparency = detectTransparency(
      source.image,
      source.width,
      source.height,
    )
    let lastResult: ProcessedPhoto | null = null

    for (const attempt of attempts) {
      const result = renderCompressedPhoto(
        source.image,
        source.width,
        source.height,
        attempt.maxSide,
        attempt.quality,
        hasTransparency,
      )

      lastResult = result

      if (result.src.length <= TARGET_DATA_URL_LENGTH) {
        return result
      }
    }

    if (!lastResult) {
      throw new Error('사진을 처리하지 못했어요.')
    }

    if (lastResult.src.length > TARGET_DATA_URL_LENGTH * 1.35) {
      throw new Error('사진 용량이 커서 저장하기 어려워요. 다른 사진을 선택해 주세요.')
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
      reject(
        new Error('이 사진 형식은 브라우저에서 열 수 없어요.'),
      )
    }

    image.src = url
  })
}

function detectTransparency(
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const sampleMax = 72
  const ratio = Math.min(1, sampleMax / Math.max(width, height))
  const sampleWidth = Math.max(1, Math.round(width * ratio))
  const sampleHeight = Math.max(1, Math.round(height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = sampleWidth
  canvas.height = sampleHeight

  const context = canvas.getContext('2d', {
    alpha: true,
    willReadFrequently: true,
  })

  if (!context) return false

  context.clearRect(0, 0, sampleWidth, sampleHeight)
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight)

  const pixels = context.getImageData(
    0,
    0,
    sampleWidth,
    sampleHeight,
  ).data

  for (let index = 3; index < pixels.length; index += 4) {
    if ((pixels[index] ?? 255) < 250) {
      return true
    }
  }

  return false
}

function renderCompressedPhoto(
  image: HTMLImageElement,
  width: number,
  height: number,
  maxSide: number,
  quality: number,
  hasTransparency: boolean,
): ProcessedPhoto {
  const ratio = Math.min(
    1,
    maxSide / Math.max(width, height),
  )
  const outputWidth = Math.max(
    1,
    Math.round(width * ratio),
  )
  const outputHeight = Math.max(
    1,
    Math.round(height * ratio),
  )
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d', { alpha: true })

  if (!context) {
    throw new Error('사진을 처리하지 못했어요.')
  }

  context.clearRect(0, 0, outputWidth, outputHeight)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  let src = canvas.toDataURL('image/webp', quality)

  if (!src.startsWith('data:image/webp')) {
    src = hasTransparency
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', quality)
  }

  return {
    src,
    width: outputWidth,
    height: outputHeight,
    aspectRatio: outputWidth / outputHeight,
    hasTransparency,
  }
}
