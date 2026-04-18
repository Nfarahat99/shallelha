'use client'

import React from 'react'

interface PlayerGameScreenProps {
  children: React.ReactNode
}

/**
 * Mobile portrait game wrapper for the player controller.
 * - min-h-screen flex column layout (white bg per UI-SPEC 60/30/10)
 * - pb-[env(safe-area-inset-bottom)] for iOS home bar (RTL-03)
 * - pt-[6px] clearance for the fixed timer bar at top
 * - dir="rtl" explicitly set — inherits from html but explicit for clarity
 */
export function PlayerGameScreen({ children }: PlayerGameScreenProps) {
  return (
    <div
      dir="rtl"
      className="min-h-dvh flex flex-col bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 pt-[6px] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
