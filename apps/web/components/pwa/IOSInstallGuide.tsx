'use client'

import { useEffect, useState } from 'react'

const COOLDOWN_KEY = 'shallelha_a2hs_dismissed'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

function isIOSSafariWithoutPWA(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  return isIOS && !isStandalone
}

export function IOSInstallGuide() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIOSSafariWithoutPWA()) return
    const last = localStorage.getItem(COOLDOWN_KEY)
    if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) return
    setVisible(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white">ثبّت شعللها على شاشتك</p>
        <button onClick={handleDismiss} className="text-white/40 text-lg leading-none">×</button>
      </div>
      <ol className="space-y-1 text-xs text-white/70 list-decimal list-inside">
        <li>اضغط على أيقونة المشاركة ↑ في الأسفل</li>
        <li>مرّر للأسفل واضغط "إضافة إلى الشاشة الرئيسية"</li>
        <li>اضغط "إضافة" لتأكيد التثبيت</li>
      </ol>
    </div>
  )
}
