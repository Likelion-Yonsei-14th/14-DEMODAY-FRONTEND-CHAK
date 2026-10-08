/**
 * The supporter desk route is keyed by a supporter token (the backend looks
 * a desk up by this UUID). This prototype only has one mock desk, so
 * DEFAULT_SUPPORTER_TOKEN stands in everywhere a real token would otherwise
 * flow from the store or the current route's `:supporterToken` param.
 */
export const DEFAULT_SUPPORTER_TOKEN = 'jisu'

export function supporterPath(supporterToken: string, suffix = '') {
  return `/desk/${supporterToken}${suffix}`
}
