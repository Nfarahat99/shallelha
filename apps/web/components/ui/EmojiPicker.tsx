'use client'

// Emoji set: no faces — animals, nature, objects. Min 44px touch targets (INFRA-03).
const EMOJIS = [
  '🦁', '🐯', '🐻', '🦊', '🐺', '🐗',
  '🦅', '🦜', '🐬', '🐙', '🦋', '🌸',
  '⚡', '🔥', '🌊', '🌟',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2" role="group" aria-label="اختر رمزاً">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-label={emoji}
          aria-pressed={value === emoji}
          className={`
            h-11 w-11 text-2xl rounded-xl flex items-center justify-center
            transition-all duration-150 border-2 cursor-pointer
            ${value === emoji
              ? 'border-brand-500 bg-brand-600/20 scale-110'
              : 'border-transparent bg-white/10 hover:bg-white/20'
            }
          `}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
