export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      return Response.json(
        { error: 'خدمة توليد الأسئلة غير متاحة حالياً' },
        { status: 503 },
      )
    }

    const upstream = await fetch(`${backendUrl}/ai/pack-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return Response.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[/api/ai/pack-generate] proxy error:', err)
    return Response.json(
      { error: 'فشل توليد الأسئلة — حاول مرة أخرى' },
      { status: 503 },
    )
  }
}
