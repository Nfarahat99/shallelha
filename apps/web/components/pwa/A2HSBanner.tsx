'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const COOLDOWN_KEY = 'shallelha_a2hs_dismissed'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
}

export function A2HSBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show on iOS (handled by IOSInstallGuide)
    if (isIOSSafari()) return

    const last = localStorage.getItem(COOLDOWN_KEY)
    if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    }
    setVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-900/60 backdrop-blur-sm px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">أضف شعللها لشاشتك</p>
        <p className="text-xs text-white/60">العب بدون متصفح، أسرع وأسهل</p>
      </div>
      <button
        onClick={handleInstall}
        className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform"
      >
        تثبيت
      </button>
      <button
        onClick={handleDismiss}
        className="text-white/40 hover:text-white/60 text-lg leading-none"
        aria-label="إغلاق"
      >
        ×
      </button>
    </div>
  )
}
