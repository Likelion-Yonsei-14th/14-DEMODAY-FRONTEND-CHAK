/**
 * A stable id for one logical traffic event. Mint it once right before the
 * request that reports the event, and reuse the SAME value if that request
 * is retried - the backend needs this to dedupe retried deliveries.
 */
export function createEventId() {
  return crypto.randomUUID()
}

/**
 * A fresh id for one ad impression. Mint a new one every time an ad starts
 * playing - unlike an event id, this is never reused across retries or
 * replays of the same ad.
 */
export function createSessionId() {
  return crypto.randomUUID()
}
