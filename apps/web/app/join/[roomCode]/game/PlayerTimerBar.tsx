'use client'

import { useState, useEffect } from 'react'

interface PlayerTimerBarProps {
  /** Total question duration in seconds */
  duration: number
  /** Unix timestamp (ms) when the question started — from Date.now() on question:start */
  startedAt: number
  /** Whether the timer is actively counting down */
  active: boolean
}

/**
 * Thin 6px timer bar fixed at the very top of the player screen.
 * - Depletes right-to-left (RTL) using scaleX with transform-origin: 'right'
 *   matching inline-end in Arabic RTL context (D-05, RTL-05).
 * - Uses CSS transition for smooth 100ms tick updates.
 * - Freezes at current progress when active === false.
 */
export function PlayerTimerBar({ duration, startedAt, active }: PlayerTimerBarProps) {
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remaining = Math.max(0, 1 - elapsed / duration)
      setProgress(remaining)
    }, 100)

    return () => clearInterval(interval)
  }, [duration, startedAt, active])

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.ceil(progress * duration)}
      aria-valuemax={duration}
      aria-label="الوقت المتبقي"
      className="fixed top-0 inset-x-0 h-[6px] bg-gray-200 z-50"
    >
      <div
        className="h-full bg-indigo-500"
        style={{
          transform: `scaleX(${progress})`,
          transformOrigin: 'right',
          transition: 'transform 100ms linear',
        }}
      />
    </div>
  )
}
