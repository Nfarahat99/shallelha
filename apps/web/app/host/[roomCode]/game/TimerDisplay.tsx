'use client'

import { useState, useEffect, useRef } from 'react'

interface TimerDisplayProps {
  timerStyle: 'bar' | 'circle' | 'number'
  duration: number
  startedAt: number
  active: boolean
}

export function TimerDisplay({ timerStyle, duration, startedAt, active }: TimerDisplayProps) {
  const [remaining, setRemaining] = useState(duration)
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) return

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      setRemaining(Math.max(0, duration - elapsed))
    }

    tick()
    rafRef.current = setInterval(tick, 100)

    return () => {
      if (rafRef.current !== null) clearInterval(rafRef.current)
    }
  }, [active, duration, startedAt])

  const progress = duration > 0 ? remaining / duration : 0
  const secondsDisplay = Math.ceil(remaining)

  // Circle SVG constants
  const RADIUS = 40
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  if (timerStyle === 'bar') {
    return (
      <div
        role="progressbar"
        aria-valuenow={secondsDisplay}
        aria-valuemax={duration}
        aria-label="الوقت المتبقي"
        className="w-full h-3 bg-gray-800 shrink-0 overflow-hidden"
      >
        <div
          className="h-full bg-brand-500 transition-transform duration-100 ease-linear"
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: 'right',
          }}
        />
      </div>
    )
  }

  if (timerStyle === 'circle') {
    return (
      <div
        role="progressbar"
        aria-valuenow={secondsDisplay}
        aria-valuemax={duration}
        aria-label="الوقت المتبقي"
        className="flex justify-center py-3 shrink-0"
      >
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
          {/* Seconds label — rotate back to correct orientation */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            className="rotate-90"
            style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
            fill="white"
            fontSize="24"
            fontWeight="bold"
          >
            {secondsDisplay}
          </text>
        </svg>
      </div>
    )
  }

  // number variant
  return (
    <div
      role="progressbar"
      aria-valuenow={secondsDisplay}
      aria-valuemax={duration}
      aria-label="الوقت المتبقي"
      className="absolute top-4 start-4"
    >
      <span className="text-4xl font-bold text-white">{secondsDisplay}</span>
    </div>
  )
}
