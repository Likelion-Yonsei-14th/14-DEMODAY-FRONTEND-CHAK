import { ApiError, apiFetch } from '@/api/client'

export type MinigameNickname = {
  /** 직접 정한 닉네임. 아직 정하지 않았으면 null. */
  nickname: string | null
  /** 정하지 않았을 때 랭킹에 보이는 이름(이름 첫 글자 + **). */
  defaultNickname: string
}

/** 서버 규칙과 같다: 앞뒤 공백을 뺀 2~12자, 한글·영문·숫자·밑줄·공백. */
export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 12
const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣_ ]+$/

export const fetchMinigameNickname = () =>
  apiFetch<MinigameNickname>('/api/minigames/me/nickname', { quiet: true })

export const saveMinigameNickname = (nickname: string) =>
  apiFetch<MinigameNickname>('/api/minigames/me/nickname', { method: 'PUT', body: { nickname: nickname.trim() } })

/** 서버에 보내기 전에 걸러 낼 수 있는 형식 오류. 괜찮으면 null. */
export function nicknameFormatError(raw: string): string | null {
  const nickname = raw.trim()
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해 주세요.`
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    return '한글, 영문, 숫자, 밑줄(_)만 쓸 수 있어요.'
  }
  return null
}

/** 닉네임 저장이 실패했을 때 사용자에게 보여 줄 문구. */
export function nicknameErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NICKNAME_NOT_ALLOWED':
        return '쓸 수 없는 표현이 들어 있어요. 다른 닉네임을 입력해 주세요.'
      case 'INVALID_NICKNAME':
        return '한글, 영문, 숫자, 밑줄(_)만 써서 2~12자로 입력해 주세요.'
      case 'UNAUTHORIZED':
        return '로그인이 만료됐어요. 다시 로그인한 뒤 시도해 주세요.'
      case 'TOO_MANY_EVENTS':
        return '잠시 뒤에 다시 시도해 주세요.'
    }
    if (error.status === 429) return '잠시 뒤에 다시 시도해 주세요.'
  }
  return '지금은 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.'
}
