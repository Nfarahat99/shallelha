'use client'
import { useRef, useState } from 'react'
import { getSocket } from '@/lib/socket'

interface DrawingCanvasProps {
  roomCode: string
  disabled?: boolean
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#ffffff']

export function DrawingCanvas({ roomCode, disabled = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const historyRef = useRef<ImageData[]>([])
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(6)
  const [isEraser, setIsEraser] = useState(false)

  const socket = getSocket()

  function normalize(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
  }

  function getCtx() {
    const canvas = canvasRef.current
    return canvas ? canvas.getContext('2d') : null
  }

  function drawStroke(x: number, y: number, strokeColor: string, strokeSize: number, type: 'start' | 'move' | 'end') {
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const px = x * canvas.width
    const py = y * canvas.height
    if (type === 'start') {
      historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
      ctx.beginPath()
      ctx.moveTo(px, py)
    } else if (type === 'move') {
      ctx.lineTo(px, py)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    } else {
      ctx.closePath()
    }
  }

  function emitStroke(x: number, y: number, type: 'start' | 'move' | 'end') {
    if (disabled) return
    const strokeColor = isEraser ? '#1a0a3e' : color
    socket.emit('draw:stroke', { x, y, color: strokeColor, size, type })
    drawStroke(x, y, strokeColor, size, type)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    isDrawingRef.current = true
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    const { x, y } = normalize(e.currentTarget, e.clientX, e.clientY)
    emitStroke(x, y, 'start')
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || disabled) return
    const { x, y } = normalize(e.currentTarget, e.clientX, e.clientY)
    emitStroke(x, y, 'move')
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const { x, y } = normalize(e.currentTarget, e.clientX, e.clientY)
    emitStroke(x, y, 'end')
  }

  function handleUndo() {
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (!ctx || !canvas || historyRef.current.length === 0) return
    const prev = historyRef.current.pop()!
    ctx.putImageData(prev, 0, 0)
    socket.emit('draw:clear')
  }

  function handleClear() {
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    historyRef.current = []
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    socket.emit('draw:clear')
  }

  return (
    <div dir="rtl" className="flex flex-col gap-3 p-4">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full rounded-xl bg-brand-950/80 border border-white/20 touch-none cursor-crosshair"
        style={{ maxHeight: '55vw' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        {/* Color swatches */}
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={`\u0644\u0648\u0646 ${c}`}
              onClick={() => { setColor(c); setIsEraser(false) }}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                color === c && !isEraser ? 'border-white scale-125' : 'border-white/30'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {/* Eraser + Undo + Clear */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsEraser((e) => !e)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isEraser ? 'bg-white text-brand-950' : 'bg-white/10 text-white'
            }`}
          >{'\u0645\u0645\u062D\u0627\u0629'}</button>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium"
          >{'\u062A\u0631\u0627\u062C\u0639'}</button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium"
          >{'\u0645\u0633\u062D \u0627\u0644\u0643\u0644'}</button>
        </div>
      </div>
      {/* Size slider */}
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-xs">{'\u062D\u062C\u0645'}</span>
        <input
          type="range" min={2} max={30} value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="flex-1 accent-brand-400"
        />
        <span className="text-white/60 text-xs w-6">{size}</span>
      </div>
    </div>
  )
}
