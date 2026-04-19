import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const roomCode = searchParams.get('roomCode') ?? ''
    const variant = searchParams.get('variant') ?? 'whatsapp'

    // Validate roomCode — alphanumeric, max 10 chars
    const safeRoomCode = roomCode.replace(/[^A-Z0-9]/gi, '').slice(0, 10).toUpperCase()

    const width = variant === 'snapchat' ? 1080 : 1200
    const height = variant === 'snapchat' ? 1920 : 1200

    // Load Cairo font from Google Fonts CDN
    const cairoFont = await fetch(
      'https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpcWmhzfH5lWWgcQyyS4J0.ttf'
    ).then((r) => r.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0d0a1e 100%)',
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
          }}
        >
          <div
            style={{
              fontSize: width === 1080 ? 96 : 80,
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: 24,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            شعللها 🎮
          </div>
          {safeRoomCode ? (
            <div
              style={{
                fontSize: 40,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 32,
                textAlign: 'center',
                display: 'flex',
              }}
            >
              {`كود الغرفة: ${safeRoomCode}`}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#a78bfa',
              textAlign: 'center',
              padding: '16px 48px',
              background: 'rgba(167,139,250,0.15)',
              borderRadius: 24,
              border: '2px solid rgba(167,139,250,0.3)',
              display: 'flex',
            }}
          >
            اضغط للانضمام
          </div>
        </div>
      ),
      {
        width,
        height,
        fonts: [
          {
            name: 'Cairo',
            data: cairoFont,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    )
  } catch (e) {
    // Fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            color: '#ffffff',
            fontSize: 80,
            fontWeight: 900,
          }}
        >
          شعللها
        </div>
      ),
      { width: 1200, height: 1200 }
    )
  }
}
