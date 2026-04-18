import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { redis } from '../redis/client'
import type { Room } from '../room/room'
import type { GameState } from '../game/game.types'

// ---------------------------------------------------------------------------
// Rate limiter — 30 req/min to prevent abuse during CPU-intensive PNG render
// Mirrors adminLimiter from admin.ts
// ---------------------------------------------------------------------------
const cardsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
})

// ---------------------------------------------------------------------------
// Font loading — fetch Cairo TTF from Google Fonts CDN at first use; cache buffer
// Satori supports TTF/OTF/WOFF. We use the TTF URL discovered via the CSS API
// (without a browser UA, Google Fonts returns TTF which satori handles fine).
// ---------------------------------------------------------------------------
let _cairoFontData: ArrayBuffer | null = null

// Pinned Cairo v31 TTF URL — discovered via Google Fonts CSS API 2026-04-18
// Fallback: re-discover via CSS API if this URL ever becomes stale
const CAIRO_TTF_URL =
  'https://fonts.gstatic.com/s/cairo/v31/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1Q.ttf'

async function getCairoFont(): Promise<ArrayBuffer> {
  if (_cairoFontData) return _cairoFontData

  // Try the pinned URL first
  try {
    const res = await fetch(CAIRO_TTF_URL)
    if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
    _cairoFontData = await res.arrayBuffer()
    return _cairoFontData
  } catch {
    // Fallback: ask Google Fonts CSS API for the current URL (no browser UA → gets TTF)
    const cssRes = await fetch('https://fonts.googleapis.com/css2?family=Cairo:wght@400')
    if (!cssRes.ok) throw new Error('Unable to load Cairo font from Google Fonts')
    const css = await cssRes.text()
    // Match both TTF and WOFF2 URLs
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    if (!match?.[1]) throw new Error('Cairo font URL not found in Google Fonts CSS')
    const fontRes = await fetch(match[1])
    if (!fontRes.ok) throw new Error(`Font fetch (fallback) failed: ${fontRes.status}`)
    _cairoFontData = await fontRes.arrayBuffer()
    return _cairoFontData
  }
}

// ---------------------------------------------------------------------------
// In-memory result cache — key: `${gameId}:${variant}`, TTL: 1 hour
// Mitigates T-10-06-03 (DoS via CPU-intensive card generation)
// ---------------------------------------------------------------------------
interface CacheEntry {
  buffer: Buffer
  expiresAt: number
}
const cardCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCached(key: string): Buffer | null {
  const entry = cardCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cardCache.delete(key)
    return null
  }
  return entry.buffer
}

function setCache(key: string, buffer: Buffer): void {
  cardCache.set(key, { buffer, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ---------------------------------------------------------------------------
// Card data types
// ---------------------------------------------------------------------------
export interface CardData {
  gameName: string
  leaderboard: Array<{
    rank: number
    name: string
    emoji: string
    score: number
  }>
  variant: 'snapchat' | 'whatsapp'
}

// ---------------------------------------------------------------------------
// renderCard — satori object format (no JSX transpiler needed in Express)
// ---------------------------------------------------------------------------
export async function renderCard(data: CardData): Promise<Buffer> {
  const isSnapchat = data.variant === 'snapchat'
  const width = 1080
  const height = isSnapchat ? 1920 : 1080

  const fontData = await getCairoFont()

  // Dimensions and sizing scale
  const logoSize = isSnapchat ? 72 : 56
  const titleSize = isSnapchat ? 48 : 40
  const nameSize = isSnapchat ? 40 : 34
  const scoreSize = isSnapchat ? 32 : 28
  const emojiSize = isSnapchat ? 72 : 60
  const footerSize = isSnapchat ? 30 : 24
  const rankCircleSize = isSnapchat ? 56 : 48

  const BRAND_PURPLE = '#7C3AED'
  const BRAND_LIGHT = '#A78BFA'
  const MEDAL_COLORS: Record<number, string> = {
    1: '#F59E0B',
    2: '#9CA3AF',
    3: '#CD7C2F',
  }

  const top3 = data.leaderboard.slice(0, 3)

  // Build leaderboard entries as satori element objects
  const leaderboardEntries = top3.map((entry) =>
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '20px',
        padding: isSnapchat ? '28px 40px' : '20px 32px',
        marginBottom: isSnapchat ? '16px' : '12px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
      },
    },
      // Rank circle
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${rankCircleSize}px`,
          height: `${rankCircleSize}px`,
          borderRadius: '50%',
          background: MEDAL_COLORS[entry.rank] ?? 'rgba(255,255,255,0.15)',
          flexShrink: 0,
        },
      },
        h('span', {
          style: {
            fontSize: `${Math.floor(rankCircleSize * 0.45)}px`,
            fontWeight: 700,
            color: '#000000',
            fontFamily: 'Cairo',
          },
        }, String(entry.rank)),
      ),
      // Emoji avatar
      h('span', {
        style: {
          fontSize: `${emojiSize}px`,
          lineHeight: 1,
          flexShrink: 0,
        },
      }, entry.emoji),
      // Name + score
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          alignItems: 'flex-end',
          gap: '4px',
          direction: 'rtl',
        },
      },
        h('span', {
          style: {
            fontSize: `${nameSize}px`,
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: 'Cairo',
            direction: 'rtl',
            textAlign: 'right',
          },
        }, entry.name),
        h('span', {
          style: {
            fontSize: `${scoreSize}px`,
            fontWeight: 600,
            color: BRAND_LIGHT,
            fontFamily: 'Cairo',
            direction: 'rtl',
          },
        }, `${entry.score} نقطة`),
      ),
    ),
  )

  // Snapchat-only bottom CTA
  const snapchatCTA = isSnapchat
    ? h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginTop: '40px',
          padding: '32px 48px',
          background: `linear-gradient(135deg, ${BRAND_PURPLE}, #4F46E5)`,
          borderRadius: '24px',
          width: '100%',
        },
      },
        h('span', {
          style: {
            fontSize: '44px',
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: 'Cairo',
            direction: 'rtl',
          },
        }, 'أنشئ غرفتك الآن!'),
        h('span', {
          style: {
            fontSize: '32px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'Cairo',
          },
        }, 'shlalha.com'),
      )
    : null

  const rootElement = h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${width}px`,
      height: `${height}px`,
      background: 'linear-gradient(160deg, #030712 0%, #1a0533 60%, #030712 100%)',
      padding: isSnapchat ? '80px 60px' : '60px 60px',
      fontFamily: 'Cairo',
      direction: 'rtl',
    },
  },
    // Logo / brand name
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: isSnapchat ? '48px' : '32px',
      },
    },
      h('span', {
        style: {
          fontSize: `${logoSize}px`,
          fontWeight: 900,
          color: BRAND_PURPLE,
          fontFamily: 'Cairo',
          direction: 'rtl',
          letterSpacing: '-1px',
        },
      }, 'شعللها'),
      h('span', {
        style: {
          fontSize: `${titleSize}px`,
          fontWeight: 700,
          color: '#FFFFFF',
          fontFamily: 'Cairo',
          direction: 'rtl',
          marginTop: '8px',
          textAlign: 'center',
        },
      }, data.gameName),
    ),
    // Leaderboard section
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        flex: 1,
      },
    },
      h('span', {
        style: {
          fontSize: isSnapchat ? '44px' : '36px',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'Cairo',
          direction: 'rtl',
          textAlign: 'right',
          marginBottom: isSnapchat ? '24px' : '16px',
        },
      }, 'المتصدرون 🏆'),
      ...leaderboardEntries,
    ),
    // Snapchat CTA or footer
    snapchatCTA ?? h('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '32px',
        padding: '20px 40px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        direction: 'rtl',
      },
    },
      h('span', {
        style: {
          fontSize: `${footerSize}px`,
          fontWeight: 600,
          color: BRAND_LIGHT,
          fontFamily: 'Cairo',
          direction: 'rtl',
        },
      }, 'العب الآن: shlalha.com'),
      h('span', {
        style: {
          fontSize: `${footerSize}px`,
          fontWeight: 900,
          color: BRAND_PURPLE,
          fontFamily: 'Cairo',
          direction: 'rtl',
        },
      }, 'شعللها'),
    ),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(rootElement as any, {
    width,
    height,
    fonts: [
      {
        name: 'Cairo',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ],
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  const pngData = resvg.render()
  return Buffer.from(pngData.asPng())
}

// ---------------------------------------------------------------------------
// h() — minimal satori element builder (avoids JSX in Express app)
// ---------------------------------------------------------------------------
type SatoriChild = SatoriElement | string | null | undefined
interface SatoriElement {
  type: string
  props: {
    style?: Record<string, unknown>
    children?: SatoriChild | SatoriChild[]
    [key: string]: unknown
  }
}

function h(
  type: string,
  props: Record<string, unknown>,
  ...children: SatoriChild[]
): SatoriElement {
  const flatChildren = children.flat().filter(Boolean)
  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 1 ? flatChildren[0] : flatChildren.length > 1 ? flatChildren : undefined,
    },
  }
}

// ---------------------------------------------------------------------------
// Express router
// ---------------------------------------------------------------------------
export const cardsRouter = Router()

cardsRouter.use(cardsLimiter)

// GET /cards/result?gameId=&variant=snapchat|whatsapp
cardsRouter.get('/result', async (req, res) => {
  try {
    const gameId = typeof req.query.gameId === 'string' ? req.query.gameId.trim() : ''
    const variantParam = req.query.variant

    if (!gameId) {
      res.status(400).json({ error: 'gameId is required' })
      return
    }

    // Validate variant
    const variant: 'snapchat' | 'whatsapp' =
      variantParam === 'snapchat' ? 'snapchat' : 'whatsapp'

    // Check in-memory cache first (T-10-06-03 mitigation)
    const cacheKey = `${gameId}:${variant}`
    const cached = getCached(cacheKey)
    if (cached) {
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.setHeader('X-Cache', 'HIT')
      res.send(cached)
      return
    }

    // Read room from Redis using gameId as roomCode
    const raw = await redis.hgetall(`room:${gameId}`)
    if (!raw || !raw.hostId) {
      res.status(404).json({ error: 'Game not found' })
      return
    }

    // Parse room + game state
    const room: Room = {
      code: gameId,
      hostId: raw.hostId,
      hostSocketId: raw.hostSocketId ?? '',
      players: raw.players ? JSON.parse(raw.players) : [],
      status: raw.status as Room['status'],
      createdAt: parseInt(raw.createdAt ?? '0'),
      ...(raw.packId ? { packId: raw.packId } : {}),
    }

    const gameState: GameState | null = raw.gameState ? JSON.parse(raw.gameState) : null

    // Build leaderboard from player states + player list
    const leaderboard = room.players
      .map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        score: gameState?.playerStates?.[p.id]?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    const cardData: CardData = {
      gameName: 'شعللها',
      leaderboard,
      variant,
    }

    // Render PNG
    const pngBuffer = await renderCard(cardData)

    // Store in cache
    setCache(cacheKey, pngBuffer)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('X-Cache', 'MISS')
    res.send(pngBuffer)
  } catch (err) {
    console.error('[cards] Error generating card:', err)
    res.status(500).json({ error: 'Failed to generate card' })
  }
})
