import { DEFAULT_SUPPORTER_TOKEN } from '@/prototype/supporterRoute'
import { usePrototypeStore } from '@/store/prototypeStore'

/**
 * The share-link token of the desk the signed-in owner is looking at. Call it
 * at click time (inside a handler); it falls back to the prototype token when
 * no backend desk is loaded.
 */
export function getOwnSupporterToken() {
  return usePrototypeStore.getState().currentDesk.supporterToken ?? DEFAULT_SUPPORTER_TOKEN
}
