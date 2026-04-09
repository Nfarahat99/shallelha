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
          // min 44px touch target (INFRA-03 iOS Safari requirement)
          className={`
            h-11 w-11 text-2xl rounded-xl flex items-center justify-center
            transition-all border-2
            ${value === emoji
              ? 'border-indigo-500 bg-indigo-50 scale-110'
              : 'border-transparent bg-gray-100 hover:bg-gray-200'
            }
          `}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
