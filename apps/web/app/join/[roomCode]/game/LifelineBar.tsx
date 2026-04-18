'use client'

interface LifelineBarProps {
  doublePointsUsed: boolean
  removeTwoUsed: boolean
  freezeOpponentUsed: boolean
  onDoublePoints: () => void
  onRemoveTwo: () => void
  onFreezeOpponent: () => void
  disabled: boolean  // true when playerPhase !== 'answering'
}

export function LifelineBar({
  doublePointsUsed,
  removeTwoUsed,
  freezeOpponentUsed,
  onDoublePoints,
  onRemoveTwo,
  onFreezeOpponent,
  disabled,
}: LifelineBarProps) {
  const activeClasses =
    'rounded-xl px-3 py-2 min-h-[44px] min-w-[44px] text-sm font-bold ' +
    'bg-brand-600 text-white active:scale-95 active:brightness-90 ' +
    'transition-all duration-150 cursor-pointer ' +
    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

  const spentClasses =
    'rounded-xl px-3 py-2 min-h-[44px] min-w-[44px] text-sm font-bold ' +
    'bg-white/10 text-white/30 opacity-50 pointer-events-none cursor-not-allowed'

  const disabledActiveClasses =
    'rounded-xl px-3 py-2 min-h-[44px] min-w-[44px] text-sm font-bold ' +
    'bg-brand-600 text-white opacity-40 pointer-events-none'

  function getClasses(used: boolean): string {
    if (used) return spentClasses
    if (disabled) return disabledActiveClasses
    return activeClasses
  }

  function getAriaLabel(label: string, used: boolean): string {
    return used ? `${label} (مستخدم)` : label
  }

  return (
    <div
      className="flex flex-row gap-2 px-4 py-2 w-full"
      role="group"
      aria-label="مساعدات اللعبة"
    >
      <button
        type="button"
        onClick={onDoublePoints}
        disabled={doublePointsUsed || disabled}
        aria-label={getAriaLabel('نقاط مضاعفة', doublePointsUsed)}
        aria-disabled={doublePointsUsed || disabled}
        className={`flex-1 ${getClasses(doublePointsUsed)}`}
      >
        نقاط مضاعفة
      </button>
      <button
        type="button"
        onClick={onRemoveTwo}
        disabled={removeTwoUsed || disabled}
        aria-label={getAriaLabel('أزل خيارين', removeTwoUsed)}
        aria-disabled={removeTwoUsed || disabled}
        className={`flex-1 ${getClasses(removeTwoUsed)}`}
      >
        أزل خيارين
      </button>
      <button
        type="button"
        onClick={onFreezeOpponent}
        disabled={freezeOpponentUsed || disabled}
        aria-label={getAriaLabel('جمّد منافس', freezeOpponentUsed)}
        aria-disabled={freezeOpponentUsed || disabled}
        className={`flex-1 ${getClasses(freezeOpponentUsed)}`}
      >
        جمّد منافس
      </button>
    </div>
  )
}
