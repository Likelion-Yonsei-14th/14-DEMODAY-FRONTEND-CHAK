export type ShareLinkData = { title: string; text?: string; url: string }

/** Shown when no copy method works, so the user can still copy the link by hand. */
export const MANUAL_COPY_PROMPT = '아래 링크를 복사해서 친구에게 보내 주세요.'

function isDismissed(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Old-style copy for browsers (in-app webviews, iframes) that deny the Clipboard API. */
function copyWithSelection(text: string) {
  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(field)
    return copied === true
  } catch {
    return false
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Denied or unavailable; try the older way next.
  }
  return copyWithSelection(text)
}

/**
 * Shares a link with the best method the browser allows and always tells the
 * user what happened: share sheet, copy to clipboard, or - when nothing is
 * allowed - the link itself so it can be copied by hand. Dismissing the share
 * sheet is not an error.
 *
 * The link goes inside the text instead of as a separate `url`: share sheets
 * that get both send them as two messages and leave a blank line after the
 * text (KakaoTalk on mobile).
 */
export async function shareOrCopyLink(
  data: ShareLinkData,
  showToast: (message: string) => void,
  copiedMessage: string,
) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: data.title,
        text: data.text ? `${data.text} ${data.url}` : data.url,
      })
      return
    } catch (error) {
      if (isDismissed(error)) return
      // The share sheet failed for another reason; fall back to copying.
    }
  }

  if (await copyToClipboard(data.url)) {
    showToast(copiedMessage)
    return
  }

  window.prompt(MANUAL_COPY_PROMPT, data.url)
}
