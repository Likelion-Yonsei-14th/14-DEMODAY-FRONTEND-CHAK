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
 * Only the URL is shared: messengers such as KakaoTalk then show a single link
 * card built from the page's Open Graph tags (see src/lib/ogCards.ts)
 * instead of the link plus a separate text message.
 */
export async function shareOrCopyLink(
  url: string,
  showToast: (message: string) => void,
  copiedMessage: string,
) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url })
      return
    } catch (error) {
      if (isDismissed(error)) return
      // The share sheet failed for another reason; fall back to copying.
    }
  }

  if (await copyToClipboard(url)) {
    showToast(copiedMessage)
    return
  }

  window.prompt(MANUAL_COPY_PROMPT, url)
}
