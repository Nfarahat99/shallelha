'use client'
import { useRef, useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

interface DrawingGuesserInputProps {
  roomCode: string
  onCorrect?: (points: number) => void
}

export function DrawingGuesserInput({ roomCode, onCorrect }: DrawingGuesserInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [guess, setGuess] = useState('')
  const [guessResult, setGuessResult] = useState<'correct' | 'wrong' | null>(null)
  const [guessedCorrectly, setGuessedCorrectly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const socket = getSocket()

  function drawReceivedStroke(stroke: { x: number; y: number; color: string; size: number; type: 'start' | 'move' | 'end' }) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const px = stroke.x * canvas.width
    const py = stroke.y * canvas.height
    if (stroke.type === 'start') {
      ctx.beginPath(); ctx.moveTo(px, py)
    } else if (stroke.type === 'move') {
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
    socket.on('draw:guess:result', ({ correct, points }: { correct: boolean; points?: number }) => {
      setGuessResult(correct ? 'correct' : 'wrong')
      if (correct) {
        setGuessedCorrectly(true)
        onCorrect?.(points ?? 0)
      }
      setTimeout(() => setGuessResult(null), 2000)
    })
    socket.on('draw:correct_guess', ({ playerName, playerEmoji }: { playerName: string; playerEmoji: string }) => {
      setToast(`${playerEmoji} ${playerName} \u062E\u0645\u0651\u0646 \u0627\u0644\u0625\u062C\u0627\u0628\u0629!`)
      setTimeout(() => setToast(null), 3000)
    })
    return () => {
      socket.off('draw:stroke', drawReceivedStroke)
      socket.off('draw:clear')
      socket.off('draw:guess:result')
      socket.off('draw:correct_guess')
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!guess.trim() || guessedCorrectly) return
    socket.emit('draw:guess', { text: guess.trim() })
    setGuess('')
  }

  return (
    <div dir="rtl" className="flex flex-col gap-3 p-4">
      {toast && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-2 text-green-300 text-sm text-center">
          {toast}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full rounded-xl bg-brand-950/80 border border-white/20"
        style={{ maxHeight: '55vw' }}
      />
      {guessedCorrectly ? (
        <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 text-center text-green-300 font-bold">
          {'\u0623\u062D\u0633\u0646\u062A! \u062E\u0645\u0651\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629'}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={'\u0627\u0643\u062A\u0628 \u062A\u062E\u0645\u064A\u0646\u0643...'}
            maxLength={100}
            className={`flex-1 bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/40 text-right outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
              guessResult === 'wrong' ? 'border-red-400' : 'border-white/20'
            }`}
          />
          <button
            type="submit"
            className="bg-brand-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-brand-400 active:scale-95 transition-all"
          >{'\u0625\u0631\u0633\u0627\u0644'}</button>
        </form>
      )}
    </div>
  )
}
