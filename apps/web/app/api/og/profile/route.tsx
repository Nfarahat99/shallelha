import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId') ?? ''

    // Validate userId — cuid/uuid format: alphanumeric + hyphen/underscore only
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
    if (!safeUserId) {
      return new Response('Missing userId', { status: 400 })
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: safeUserId },
      select: {
        displayName: true,
        totalGamesPlayed: true,
        winCount: true,
        bestStreak: true,
      },
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const displayName = user.displayName ?? 'لاعب'
    const winRate =
      user.totalGamesPlayed > 0
        ? Math.round((user.winCount / user.totalGamesPlayed) * 100)
        : 0

    // Load Cairo font
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
            gap: 24,
          }}
        >
          {/* App name */}
          <div style={{ fontSize: 48, fontWeight: 900, color: '#a78bfa', display: 'flex' }}>
            شعللها
          </div>

          {/* Player name */}
          <div style={{ fontSize: 72, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
            {displayName}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 40, marginTop: 8 }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 48, fontWeight: 900, color: '#fbbf24', display: 'flex' }}>
                {user.winCount}
              </span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
                فوز
              </span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 48, fontWeight: 900, color: '#60a5fa', display: 'flex' }}>
                {user.totalGamesPlayed}
              </span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
                مباراة
              </span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 48, fontWeight: 900, color: '#34d399', display: 'flex' }}>
                {winRate}%
              </span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
                معدل الفوز
              </span>
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.4)',
              marginTop: 16,
              display: 'flex',
            }}
          >
            العب مع أصحابك على شعللها
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Cairo', data: cairoFont, weight: 900 }],
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
      }
    )
  } catch (err) {
    console.error('[og/profile] failed:', err)
    return new Response('OG image generation failed', { status: 500 })
  }
}
