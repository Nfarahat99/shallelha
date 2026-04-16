import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

// Self-hosted via next/font/google — no external CDN request at runtime.
// Arabic subset required for the game content.
// Latin subset required for fallback and any English strings.
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'شعللها',
  description: 'منصة الألعاب الجماعية العربية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // lang="ar" and dir="rtl" are set here — all pages inherit RTL automatically.
    // cairo.variable injects --font-cairo CSS variable used by Tailwind font-sans.
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
