export interface AvatarConfig {
  faceShape: 1 | 2 | 3
  headwear: 'ghutra' | 'hijab' | 'cap' | 'none'
  colorPalette: 1 | 2 | 3 | 4 | 5
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  faceShape: 1,
  headwear: 'none',
  colorPalette: 1,
}

export const PALETTES: Record<number, { skin: string; accent: string }> = {
  1: { skin: '#F5CBA7', accent: '#7c3aed' },
  2: { skin: '#D4A076', accent: '#2563eb' },
  3: { skin: '#A0522D', accent: '#16a34a' },
  4: { skin: '#8B6914', accent: '#dc2626' },
  5: { skin: '#4A3728', accent: '#F59E0B' },
}

// Face shapes as ellipse parameters — shape 1 is the default circle (no overlay)
export const FACE_SHAPES: Record<number, { cx: number; cy: number; rx: number; ry: number } | null> = {
  1: null, // pure circle
  2: { cx: 32, cy: 34, rx: 22, ry: 20 },
  3: { cx: 32, cy: 35, rx: 18, ry: 24 },
}

export const HEADWEAR_PATHS: Record<Exclude<AvatarConfig['headwear'], 'none'>, string> = {
  ghutra: 'M 12 22 Q 16 2 32 4 Q 48 2 52 22 Q 44 14 32 16 Q 20 14 12 22 Z',
  hijab:
    'M 10 18 Q 8 4 32 3 Q 56 4 54 18 Q 50 8 32 9 Q 14 8 10 18 Z M 8 20 Q 6 38 10 50 Q 16 58 32 60 Q 48 58 54 50 Q 58 38 56 20 Q 52 30 32 30 Q 12 30 8 20 Z',
  cap: 'M 14 22 Q 16 6 32 5 Q 48 6 50 22 Z M 10 24 Q 8 26 14 28 Q 12 26 14 24 Z',
}

export const AVATAR_STORAGE_KEY = 'shallelha_avatar'
