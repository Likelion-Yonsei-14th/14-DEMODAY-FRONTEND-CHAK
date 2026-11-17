/** 미리보기 화면 이미지를 내려받거나 여러 장을 한 장으로 합친다. */

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

/** 화면 이미지들을 휴대폰 틀에 넣어 가로로 한 장에 담는다. 위에 광고 이름, 아래에 화면 이름. */
export async function composeShots(shots: { label: string; dataUrl: string }[], title: string): Promise<string> {
  const images = await Promise.all(shots.map((shot) => loadImage(shot.dataUrl)))
  const scale = 2
  const phoneW = 390
  const phoneH = 780
  const bezel = 12
  const gap = 48
  const pad = 64
  const head = 96
  const foot = 72
  const width = pad * 2 + shots.length * (phoneW + bezel * 2) + (shots.length - 1) * gap
  const height = pad + head + phoneH + bezel * 2 + foot + pad / 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const context = canvas.getContext('2d')!
  context.scale(scale, scale)
  context.fillStyle = '#f3efe9'
  context.fillRect(0, 0, width, height)
  const font = getComputedStyle(document.body).fontFamily
  context.fillStyle = '#2b2622'
  context.font = `800 30px ${font}`
  context.fillText(`광고 시안 · ${title}`, pad, pad + 34)
  context.fillStyle = '#7a716a'
  context.font = `500 18px ${font}`
  context.fillText(`수능 착 · ${new Date().toLocaleDateString('ko-KR')}`, pad, pad + 66)
  images.forEach((image, index) => {
    const x = pad + index * (phoneW + bezel * 2 + gap)
    const y = pad + head
    context.fillStyle = '#2b2622'
    context.beginPath()
    context.roundRect(x, y, phoneW + bezel * 2, phoneH + bezel * 2, 40)
    context.fill()
    context.save()
    context.beginPath()
    context.roundRect(x + bezel, y + bezel, phoneW, phoneH, 30)
    context.clip()
    context.drawImage(image, x + bezel, y + bezel, phoneW, phoneH)
    context.restore()
    context.fillStyle = '#2b2622'
    context.font = `700 22px ${font}`
    context.textAlign = 'center'
    context.fillText(shots[index]!.label, x + bezel + phoneW / 2, y + phoneH + bezel * 2 + 44)
    context.textAlign = 'left'
  })
  return canvas.toDataURL('image/png')
}
