const DESK_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * 공유하다가 링크 끝에 역슬래시·괄호·마침표 같은 글자가 붙은 책상 주소를 바로잡는다. 응원 링크의 토큰은 UUID라서
 * 맨 앞 36자만 쓰면 되고, 그렇게 못 읽으면 null. (역슬래시는 브라우저가 요청 주소에서 슬래시로 바꿔 API가 엉뚱한 응답을 준다)
 */
export function cleanDeskToken(raw: string): string | null {
  return DESK_TOKEN.exec(raw)?.[0] ?? null
}
