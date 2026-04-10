'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useReducedMotion } from 'motion/react'

interface MediaQuestionProps {
  mediaUrl: string
  revealed: boolean
  timerDuration: number // seconds
}

function isAudioUrl(url: string): boolean {
  const stripped = url.split('?')[0].toLowerCase()
  return (
    stripped.endsWith('.mp3') ||
    stripped.endsWith('.wav') ||
    stripped.endsWith('.ogg') ||
    stripped.endsWith('.m4a')
  )
}

export function MediaQuestion({ mediaUrl, revealed, timerDuration }: MediaQuestionProps) {
  const reducedMotion = useReducedMotion() ?? false
  const audioRef = useRef<HTMLAudioElement>(null)
  const [autoplayFailed, setAutoplayFailed] = useState(false)
  const isAudio = isAudioUrl(mediaUrl)

  // Detect autoplay failure: if onPlay hasn't fired within 300ms, show fallback button
  useEffect(() => {
    if (!isAudio) return
    setAutoplayFailed(false)
    const timer = setTimeout(() => {
      if (audioRef.current && !audioRef.current.currentTime && audioRef.current.paused) {
        setAutoplayFailed(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [mediaUrl, isAudio])

  // Pause audio when revealed
  useEffect(() => {
    if (revealed && audioRef.current) {
      audioRef.current.pause()
    }
  }, [revealed])

  if (isAudio) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <audio
          ref={audioRef}
          autoPlay
          loop
          src={mediaUrl}
          aria-label="مقطع صوتي للسؤال"
          className="hidden"
          onPlay={() => setAutoplayFailed(false)}
        />
        <div
          className={`text-[80px] leading-none${reducedMotion ? '' : ' animate-pulse'}`}
          aria-hidden="true"
        >
          🎵
        </div>
        <p className="text-[32px] font-bold text-white font-[family-name:var(--font-cairo)]">
          استمع وخمّن
        </p>
        {autoplayFailed && (
          <button
            onClick={() => audioRef.current?.play()}
            className="mt-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 text-xl transition-colors font-[family-name:var(--font-cairo)]"
          >
            ▶ استمع
          </button>
        )}
      </div>
    )
  }

  // Image path
  return (
    <div
      style={{
        filter: revealed ? 'blur(0px)' : 'blur(20px)',
        transition: revealed
          ? 'filter 300ms ease-out'
          : `filter ${timerDuration * 1000}ms linear`,
      }}
      className="relative w-full h-full overflow-hidden rounded-2xl"
    >
      <Image
        src={mediaUrl}
        alt="صورة السؤال"
        fill
        sizes="100vw"
        style={{ objectFit: 'cover' }}
        priority
      />
    </div>
  )
}
