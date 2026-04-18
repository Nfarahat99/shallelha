'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  joinUrl: string
}

export default function QRCodeDisplay({ joinUrl }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    if (!joinUrl) return
    QRCode.toDataURL(joinUrl, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(console.error)
  }, [joinUrl])

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 rounded-xl mx-auto w-fit">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code للانضمام" width={200} height={200} className="rounded-lg" />
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-white/50 text-center mt-2">امسح للانضمام</p>
    </div>
  )
}
