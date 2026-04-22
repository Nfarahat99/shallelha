'use client'
import { useRef, useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

interface HostDrawingViewProps {
  promptText: string
  roomCode: string
  onReveal: () => void
}

export function HostDrawingView({ promptText, roomCode, onReveal }: HostDrawingViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const socket = getSocket()

  function drawReceivedStroke(stroke: { x: number; y: number; color: string; size: number; type: 'start' | 'move' | 'end' }) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const px = stroke.x * canvas.width
    const py = stroke.y * canvas.height
    if (stroke.type === 'start') { ctx.beginPath(); ctx.moveTo(px, py) }
    else if (stroke.type === 'move') {
      ctx.lineTo(px, py)
      ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
    } else { ctx.closePath() }
  }

  useEffect(() => {
    socket.on('draw:stroke', drawReceivedStroke)
    socket.on('draw:clear', () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
    socket.on('draw:correct_guess', () => setCorrectCount((c) => c + 1))
    socket.on('draw:revealed', () => setRevealed(true))
    return () => {
      socket.off('draw:stroke', drawReceivedStroke)
      socket.off('draw:clear')
      socket.off('draw:correct_guess')
      socket.off('draw:revealed')
    }
  }, [])

  function handleReveal() {
    socket.emit('draw:reveal')
    setRevealed(true)
    onReveal()
  }

  return (
    <div dir="rtl" className="flex flex-col gap-4 p-6">
      {/* Host-only prompt label */}
      <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-center">
        <p className="text-white/50 text-xs mb-1">{'\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u062A\u064A \u064A\u0631\u0633\u0645\u0647\u0627 \u0627\u0644\u0644\u0627\u0639\u0628'}</p>
        <p className="text-white text-2xl font-bold tracking-wide">{promptText}</p>
      </div>

      {/* Live canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full rounded-xl bg-brand-950/80 border border-white/20"
        style={{ maxHeight: '40vh' }}
      />

      {/* Stats + Reveal */}
      <div className="flex items-center justify-between">
        <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-2">
          <span className="text-green-300 text-sm font-bold">{correctCount} {'\u062E\u0645\u0651\u0646 \u0627\u0644\u0625\u062C\u0627\u0628\u0629'}</span>
        </div>
        {!revealed && (
          <button
            onClick={handleReveal}
            className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-400 transition-colors"
          >
            {'\u0643\u0634\u0641 \u0627\u0644\u0625\u062C\u0627\u0628\u0629'}
          </button>
        )}
      </div>
    </div>
  )
}
