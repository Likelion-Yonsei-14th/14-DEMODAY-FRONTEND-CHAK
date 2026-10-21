import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MANUAL_COPY_PROMPT, shareOrCopyLink } from '@/lib/shareLink'

const url = 'https://chak.live/desk/abc'

function setNavigator(share: unknown, writeText: unknown) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true })
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  })
}

describe('shareOrCopyLink', () => {
  const showToast = vi.fn()
  const prompt = vi.fn()
  const execCommand = vi.fn()

  beforeEach(() => {
    showToast.mockReset()
    prompt.mockReset()
    execCommand.mockReset()
    vi.stubGlobal('prompt', prompt)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares only the link through the share sheet when the browser has one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    setNavigator(share, writeText)

    await shareOrCopyLink(url, showToast, '복사했어요')

    expect(share).toHaveBeenCalledWith({ url })
    expect(writeText).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('does nothing more when the share sheet is dismissed', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'))
    const writeText = vi.fn()
    setNavigator(share, writeText)

    await shareOrCopyLink(url, showToast, '복사했어요')

    expect(writeText).not.toHaveBeenCalled()
    expect(prompt).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('copies when the share sheet fails for another reason', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigator(share, writeText)

    await shareOrCopyLink(url, showToast, '복사했어요')

    expect(writeText).toHaveBeenCalledWith(url)
    expect(showToast).toHaveBeenCalledWith('복사했어요')
  })

  it('copies with the Clipboard API when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigator(undefined, writeText)

    await shareOrCopyLink(url, showToast, '복사했어요')

    expect(writeText).toHaveBeenCalledWith(url)
    expect(showToast).toHaveBeenCalledWith('복사했어요')
  })

  it('falls back to selection copy when the Clipboard API is denied', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    setNavigator(undefined, writeText)
    execCommand.mockReturnValue(true)

    await shareOrCopyLink(url, showToast, '복사했어요')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(showToast).toHaveBeenCalledWith('복사했어요')
    expect(prompt).not.toHaveBeenCalled()
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('shows the link for manual copy when nothing is allowed', async () => {
    setNavigator(undefined, undefined)
    execCommand.mockReturnValue(false)

    await shareOrCopyLink(url, showToast, '복사했어요')

    expect(showToast).not.toHaveBeenCalled()
    expect(prompt).toHaveBeenCalledWith(MANUAL_COPY_PROMPT, url)
  })
})
