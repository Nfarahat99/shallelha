'use client'
import { useState, useEffect } from 'react'
import { AvatarConfig, DEFAULT_AVATAR_CONFIG, PALETTES, AVATAR_STORAGE_KEY } from './avatar-parts'
import { PlayerAvatar } from './PlayerAvatar'

interface AvatarBuilderProps {
  onConfirm: (config: AvatarConfig) => void
  className?: string
}

const FACE_OPTIONS: Array<{ value: AvatarConfig['faceShape']; label: string }> = [
  { value: 1, label: 'مستدير' },
  { value: 2, label: 'عريض' },
  { value: 3, label: 'بيضاوي' },
]

const HEADWEAR_OPTIONS: Array<{ value: AvatarConfig['headwear']; label: string }> = [
  { value: 'none', label: 'بدون' },
  { value: 'ghutra', label: 'غترة' },
  { value: 'hijab', label: 'حجاب' },
  { value: 'cap', label: 'كاب' },
]

export function AvatarBuilder({ onConfirm, className }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG)

  // Load from localStorage on mount (AC-008-2)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AVATAR_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AvatarConfig
        // Validate shape before applying
        if (
          typeof parsed.faceShape === 'number' &&
          typeof parsed.headwear === 'string' &&
          typeof parsed.colorPalette === 'number'
        ) {
          setConfig(parsed)
        }
      }
    } catch {
      // Corrupted storage — silently use default
    }
  }, [])

  function handleConfirm() {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(config))
    onConfirm(config)
  }

  return (
    <div dir="rtl" className={`flex flex-col gap-5 ${className ?? ''}`}>
      {/* Live preview */}
      <div className="flex justify-center">
        <PlayerAvatar config={config} size={96} />
      </div>

      {/* Face shape selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white/70 font-medium">شكل الوجه</span>
        <div className="flex gap-2">
          {FACE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setConfig((c) => ({ ...c, faceShape: opt.value }))}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                config.faceShape === opt.value
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headwear selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white/70 font-medium">الغطاء</span>
        <div className="grid grid-cols-4 gap-2">
          {HEADWEAR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setConfig((c) => ({ ...c, headwear: opt.value }))}
              className={`py-2 rounded-xl text-sm font-medium transition-colors border ${
                config.headwear === opt.value
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color palette selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white/70 font-medium">اللون</span>
        <div className="flex gap-3 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setConfig((c) => ({ ...c, colorPalette: n as AvatarConfig['colorPalette'] }))}
              className={`w-10 h-10 rounded-full border-2 transition-transform ${
                config.colorPalette === n ? 'border-white scale-110' : 'border-transparent scale-100'
              }`}
              style={{ backgroundColor: PALETTES[n].skin }}
              aria-label={`لون ${n}`}
            />
          ))}
        </div>
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-base transition-colors"
      >
        تأكيد الشخصية
      </button>
    </div>
  )
}
