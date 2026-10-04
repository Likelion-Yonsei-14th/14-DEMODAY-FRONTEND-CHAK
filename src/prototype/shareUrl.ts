export function buildPrototypeShareUrl(path: string) {
  const url = new URL(path, window.location.origin)
  const shareToken = new URLSearchParams(
    window.location.search,
  ).get('_vercel_share')

  if (shareToken) {
    url.searchParams.set('_vercel_share', shareToken)
  }

  return url.toString()
}
