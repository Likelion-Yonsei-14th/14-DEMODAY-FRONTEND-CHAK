import { ApiError, apiFetch } from '@/api/client'
import { API_URL } from '@/api/config'
import type { ApiUser } from '@/api/types'

export const PROFILE_NAME_MAX_LENGTH = 20
/** 서버 규칙과 같다: 한글·영문·숫자·공백·. _ - ( ) */
const PROFILE_NAME_PATTERN = /^[0-9A-Za-z가-힣._()\- ]+$/

export const changeDisplayName = (displayName: string) =>
  apiFetch<ApiUser>('/api/users/me', { method: 'PATCH', body: { displayName: displayName.trim() } })

/** `data:image/jpeg;base64,…` 형태의 작은 사진(서버는 150KB까지 받는다). */
export const uploadAvatar = (image: string) =>
  apiFetch<ApiUser>('/api/users/me/avatar', { method: 'PUT', body: { image } })

export const deleteAvatar = () => apiFetch<ApiUser>('/api/users/me/avatar', { method: 'DELETE' })

/** 서버가 준 사진 주소(같은 서버의 상대 경로)를 화면에서 쓸 수 있는 주소로 바꾼다. 없으면 undefined. */
export function avatarSrc(avatarUrl: string | null | undefined): string | undefined {
  if (!avatarUrl) return undefined
  return avatarUrl.startsWith('/') ? `${API_URL}${avatarUrl}` : avatarUrl
}

/** 서버에 보내기 전에 걸러 낼 수 있는 이름 오류. 괜찮으면 null. */
export function profileNameFormatError(raw: string): string | null {
  const name = raw.trim()
  if (!name) return '이름을 적어 주세요.'
  if (name.length > PROFILE_NAME_MAX_LENGTH) return `이름은 ${PROFILE_NAME_MAX_LENGTH}자까지 쓸 수 있어요.`
  if (!PROFILE_NAME_PATTERN.test(name)) return '한글, 영문, 숫자, 공백, . _ - ( )만 쓸 수 있어요.'
  return null
}

export type ProfileFailure = { field: 'name' | 'photo' | 'other'; message: string }

/** 저장이 실패했을 때 어느 칸에 어떤 문구를 보일지. */
export function profileFailure(error: unknown): ProfileFailure {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NICKNAME_NOT_ALLOWED':
        return { field: 'name', message: '쓸 수 없는 표현이 들어 있어요. 다른 이름을 입력해 주세요.' }
      case 'INVALID_DISPLAY_NAME':
        return { field: 'name', message: '한글, 영문, 숫자, 공백, . _ - ( )만 써서 20자까지 입력해 주세요.' }
      case 'INVALID_AVATAR':
        return { field: 'photo', message: '사진을 올리지 못했어요. 다른 사진으로 다시 시도해 주세요.' }
      case 'UNAUTHORIZED':
        return { field: 'other', message: '로그인이 만료됐어요. 다시 로그인한 뒤 시도해 주세요.' }
    }
    if (error.status === 429) return { field: 'other', message: '너무 자주 바꿨어요. 잠시 뒤에 다시 시도해 주세요.' }
  }
  return { field: 'other', message: '지금은 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.' }
}
