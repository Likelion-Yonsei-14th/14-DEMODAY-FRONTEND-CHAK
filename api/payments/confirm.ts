/**
 * Toss Payments 결제 승인 (Vercel serverless function).
 * The secret key never reaches the browser - set TOSS_SECRET_KEY in the
 * Vercel project env. `vite dev` serves this same handler (vite.config.ts).
 */
export async function POST(request: Request): Promise<Response> {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    return Response.json(
      { message: 'TOSS_SECRET_KEY가 설정되지 않았어요.' },
      { status: 500 },
    )
  }

  const { paymentKey, orderId, amount } = (await request.json()) as {
    paymentKey?: string
    orderId?: string
    amount?: number
  }
  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return Response.json({ message: '잘못된 결제 요청이에요.' }, { status: 400 })
  }

  const response = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    },
  )

  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
