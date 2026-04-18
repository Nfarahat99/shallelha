'use client'

import { useState } from 'react'

export interface HostSettings {
  layout: '2x2' | '4-column' | 'vertical'
  timerStyle: 'bar' | 'circle' | 'number'
  revealMode: 'auto' | 'manual'
}

interface HostPreGameProps {
  onStart: (settings: HostSettings) => void
  playerCount: number
}

const LAYOUT_OPTIONS: { value: HostSettings['layout']; label: string }[] = [
  { value: '2x2', label: 'شبكة ٢×٢' },
  { value: '4-column', label: 'شريط أفقي' },
  { value: 'vertical', label: 'عمودي' },
]

const TIMER_OPTIONS: { value: HostSettings['timerStyle']; label: string }[] = [
  { value: 'bar', label: 'شريط' },
  { value: 'circle', label: 'دائرة' },
  { value: 'number', label: 'رقم' },
]

export function HostPreGame({ onStart, playerCount }: HostPreGameProps) {
  const [layout, setLayout] = useState<HostSettings['layout']>('2x2')
  const [timerStyle, setTimerStyle] = useState<HostSettings['timerStyle']>('bar')
  const [revealMode, setRevealMode] = useState<HostSettings['revealMode']>('manual')

  const handleStart = () => {
    onStart({ layout, timerStyle, revealMode })
  }

  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-3xl p-8 max-w-2xl w-full space-y-8">

        {/* Section 1: Layout picker */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">اختر شكل العرض</h2>
          <div className="grid grid-cols-3 gap-4">
            {LAYOUT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setLayout(option.value)}
                className={`cursor-pointer rounded-2xl p-6 text-center border-2 transition-colors ${
                  layout === option.value
                    ? 'border-brand-500 bg-brand-950 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="font-semibold">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Timer style picker */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">اختر عداد الوقت</h2>
          <div className="grid grid-cols-3 gap-4">
            {TIMER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimerStyle(option.value)}
                className={`cursor-pointer rounded-2xl p-6 text-center border-2 transition-colors ${
                  timerStyle === option.value
                    ? 'border-brand-500 bg-brand-950 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="font-semibold">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Reveal mode toggle */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">كشف الإجابة</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRevealMode('auto')}
              className={`cursor-pointer rounded-2xl p-5 text-center border-2 transition-colors ${
                revealMode === 'auto'
                  ? 'border-brand-500 bg-brand-950 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <span className="font-semibold text-sm">تلقائي عند انتهاء الوقت</span>
            </button>
            <button
              onClick={() => setRevealMode('manual')}
              className={`cursor-pointer rounded-2xl p-5 text-center border-2 transition-colors ${
                revealMode === 'manual'
                  ? 'border-brand-500 bg-brand-950 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <span className="font-semibold text-sm">يدوي (أنت تتحكم)</span>
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={playerCount === 0}
          className="w-full rounded-xl bg-brand-600 px-6 py-4 text-xl font-bold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ابدأ اللعبة {playerCount > 0 && `(${playerCount} لاعب)`}
        </button>
      </div>
    </div>
  )
}
