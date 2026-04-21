import { AvatarConfig, DEFAULT_AVATAR_CONFIG, PALETTES, FACE_SHAPES, HEADWEAR_PATHS } from './avatar-parts'

interface PlayerAvatarProps {
  config?: AvatarConfig | null
  size?: number
  className?: string
}

export function PlayerAvatar({ config, size = 64, className }: PlayerAvatarProps) {
  const cfg = config ?? DEFAULT_AVATAR_CONFIG
  const palette = PALETTES[cfg.colorPalette] ?? PALETTES[1]
  const faceOverlay = FACE_SHAPES[cfg.faceShape]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="avatar"
      className={className}
    >
      <circle cx="32" cy="36" r="22" fill={palette.skin} />
      {faceOverlay && (
        <ellipse
          cx={faceOverlay.cx}
          cy={faceOverlay.cy}
          rx={faceOverlay.rx}
          ry={faceOverlay.ry}
          fill={palette.skin}
        />
      )}
      <circle cx="26" cy="34" r="2.5" fill="rgba(0,0,0,0.4)" />
      <circle cx="38" cy="34" r="2.5" fill="rgba(0,0,0,0.4)" />
      {cfg.headwear !== 'none' && (
        <g fill={palette.accent}>
          <path d={HEADWEAR_PATHS[cfg.headwear]} />
        </g>
      )}
    </svg>
  )
}
