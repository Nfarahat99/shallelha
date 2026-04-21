// Avatar config type — mirrors apps/web/components/avatar/avatar-parts.ts AvatarConfig
// Kept separate so the server does not depend on the web app module
export interface AvatarConfig {
  faceShape: 1 | 2 | 3
  headwear: 'ghutra' | 'hijab' | 'cap' | 'none'
  colorPalette: 1 | 2 | 3 | 4 | 5
}

// T-12-03-01: Validate avatarConfig shape before storing in Redis
// Returns sanitized config or null if invalid
export function validateAvatarConfig(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const faceShape = r.faceShape
  const headwear = r.headwear
  const colorPalette = r.colorPalette
  if (![1, 2, 3].includes(faceShape as number)) return null
  if (!['ghutra', 'hijab', 'cap', 'none'].includes(headwear as string)) return null
  if (![1, 2, 3, 4, 5].includes(colorPalette as number)) return null
  return { faceShape, headwear, colorPalette } as AvatarConfig
}
