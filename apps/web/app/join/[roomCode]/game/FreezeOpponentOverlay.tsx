'use client'

import { useEffect, useRef } from 'react'

interface FreezeOpponentOverlayProps {
  players: Array<{ id: string; name: string; emoji: string }>
  onSelect: (playerId: string) => void
  onCancel: () => void
}

export function FreezeOpponentOverlay({ players, onSelect, onCancel }: FreezeOpponentOverlayProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap: focus first player on mount, Escape to cancel
  useEffect(() => {
    firstButtonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm"
      onClick={(e) => {
        // Dismiss on backdrop tap (not on panel content)
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="freeze-overlay-heading"
        className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full"
        style={{ animation: 'fadeSlideUp 200ms ease-out' }}
      >
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <h2
          id="freeze-overlay-heading"
          className="text-xl font-bold text-gray-900 text-center mb-4"
        >
          اختر منافسًا للتجميد
        </h2>

        <div className="flex flex-col gap-2" role="list" aria-label="اختر لاعبًا لتجميده لهذا السؤال">
          {players.map((player, index) => (
            <button
              key={player.id}
              ref={index === 0 ? firstButtonRef : undefined}
              type="button"
              onClick={() => onSelect(player.id)}
              className="min-h-[48px] rounded-xl flex items-center gap-3 px-4 bg-gray-100 active:bg-indigo-50 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              role="listitem"
            >
              <span className="text-2xl">{player.emoji}</span>
              <span className="text-base font-bold text-gray-900">{player.name}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-400 underline mt-4 text-center w-full"
        >
          إلغاء التجميد
        </button>
      </div>
    </div>
  )
}
