/** 리캡은 수능 4교시가 끝나는 2026-11-19 17:45(한국 시각)에 열린다. */
export const RECAP_OPENS_AT = new Date('2026-11-19T17:45:00+09:00')

export const RECAP_OPENS_LABEL = '오늘 오후 5시 45분'

export const isRecapOpen = (now = new Date()) => now.getTime() >= RECAP_OPENS_AT.getTime()
