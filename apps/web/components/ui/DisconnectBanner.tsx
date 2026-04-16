'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

type BannerState = 'hidden' | 'disconnected' | 'reconnected'

export default function DisconnectBanner() {
  const [state, setState] = useState<BannerState>('hidden')
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const socket = getSocket()

    function onDisconnect() {
      setFading(false)
      setState('disconnected')
      setVisible(true)
    }

    function onConnect() {
      setState('reconnected')
      setFading(false)
      // After 1500ms start fading, remove from DOM after 1800ms total
      setTimeout(() => {
        setFading(true)
        setTimeout(() => {
          setVisible(false)
          setState('hidden')
          setFading(false)
        }, 300)
      }, 1500)
    }

    socket.on('disconnect', onDisconnect)
    socket.on('connect', onConnect)

    return () => {
      socket.off('disconnect', onDisconnect)
      socket.off('connect', onConnect)
    }
  }, [])

  if (!visible) return null

  const isReconnected = state === 'reconnected'

  return (
    <div
      role="alert"
      className={`fixed top-[6px] inset-x-0 z-40 flex items-center gap-3 px-4 py-2 text-white transition-opacity duration-300 ${
        isReconnected ? 'bg-green-600' : 'bg-red-600'
      } ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      {isReconnected ? (
        /* Check circle icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 shrink-0 text-white"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        /* Wifi-off icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 shrink-0 text-white"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-3.819.758L3.28 2.22zm7.32 7.32l-3.004-3.004a7.452 7.452 0 013.404-.816c2.399 0 4.512 1.131 5.862 2.887a.25.25 0 010 .292 7.463 7.463 0 01-1.785 1.844L10.6 9.54zM8.49 10.61l-5.384-5.384a7.5 7.5 0 00-.854 1.12.25.25 0 000 .292A7.5 7.5 0 0010 9.752c.193 0 .383-.008.57-.023l-.922-.922a5.957 5.957 0 01-.158.803zm1.384 1.384l-.921-.921c-.033.19-.05.385-.05.584a5.002 5.002 0 005 5 5.028 5.028 0 001.785-.328l-.921-.921A3.502 3.502 0 0110 17.5a3.5 3.5 0 01-3.5-3.5c0-.7.203-1.352.554-1.9l-.922-.922A5.002 5.002 0 005 14a5 5 0 005 5 4.999 4.999 0 004.446-2.724l-.92-.921A3.5 3.5 0 0110 17.5z"
            clipRule="evenodd"
          />
        </svg>
      )}

      <span className="text-sm font-semibold" dir="rtl">
        {isReconnected ? 'تم الاتصال' : 'انقطع الاتصال — جارٍ إعادة الاتصال…'}
      </span>

      {!isReconnected && (
        <span
          aria-hidden="true"
          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin ms-auto shrink-0"
        />
      )}
    </div>
  )
}
