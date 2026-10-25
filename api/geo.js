// 방문자의 국가와 시·도 코드를 알려 주는 Vercel 함수.
// Vercel은 요청이 들어온 위치를 헤더로 알려 주지만, 외부 주소(CloudFront)로 넘기는 rewrite에는 그 헤더를 붙이지 않는다.
// 그래서 프론트가 이 함수에서 한 번 받아 방문 기록에 실어 보낸다. IP 주소는 읽지도 저장하지도 않는다.
export default function handler(req, res) {
  const header = (name) => {
    const value = req.headers[name]
    return (Array.isArray(value) ? value[0] : value) || null
  }
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).json({
    country: header('x-vercel-ip-country'),
    region: header('x-vercel-ip-country-region'),
  })
}
