import { apiFetch } from '@/api/client'
import { isApiEnabled } from '@/api/config'

/**
 * Friends' desks the signed-in user starred. Kept per account on the server:
 *
 * - GET    /api/users/me/favorite-desks                  -> ApiFavoriteDesk[] (newest first)
 * - PUT    /api/users/me/favorite-desks/{supporterToken} -> ApiFavoriteDesk (adding twice is fine)
 * - DELETE /api/users/me/favorite-desks/{supporterToken} -> removing a missing one is fine
 *
 * Without a backend (prototype mode) the same calls run on localStorage.
 */
export type ApiFavoriteDesk = {
  supporterToken: string
  displayName: string
  createdAt: string
}

const PATH = '/api/users/me/favorite-desks'

// ---------- mock (localStorage) ----------

const MOCK_KEY = 'chak:mock-favorite-desks'

function readMock(): ApiFavoriteDesk[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY)
    return raw ? (JSON.parse(raw) as ApiFavoriteDesk[]) : []
  } catch {
    return []
  }
}

function writeMock(desks: ApiFavoriteDesk[]) {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(desks))
  } catch {
    // Prototype only: losing the list is fine.
  }
}

// ---------- calls ----------

export async function fetchFavoriteDesks(): Promise<ApiFavoriteDesk[]> {
  if (isApiEnabled) return apiFetch<ApiFavoriteDesk[]>(PATH)
  return readMock()
}

/** The display name is only used by the mock; the server knows the desk's own name. */
export async function addFavoriteDesk(supporterToken: string, displayName: string): Promise<ApiFavoriteDesk> {
  if (isApiEnabled) {
    return apiFetch<ApiFavoriteDesk>(`${PATH}/${supporterToken}`, { method: 'PUT' })
  }
  const desk = { supporterToken, displayName, createdAt: new Date().toISOString() }
  writeMock([desk, ...readMock().filter((item) => item.supporterToken !== supporterToken)])
  return desk
}

export async function removeFavoriteDesk(supporterToken: string): Promise<void> {
  if (isApiEnabled) {
    await apiFetch(`${PATH}/${supporterToken}`, { method: 'DELETE' })
    return
  }
  writeMock(readMock().filter((item) => item.supporterToken !== supporterToken))
}
