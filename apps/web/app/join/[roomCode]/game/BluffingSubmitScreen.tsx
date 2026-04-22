'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

interface BluffingSubmitScreenProps {
  question: { text: string }
}

export function BluffingSubmitScreen({ question }: BluffingSubmitScreenProps) {
  const [role, setRole] = useState<'truth' | 'bluffer' | null>(null)
  const [realAnswer, setRealAnswer] = useState<string>('')
  const [inputText, setInputText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [progress, setProgress] = useState<{ submitted: number; total: number } | null>(null)

  useEffect(() => {
    const socket = getSocket()

    socket.on('bluffing:role', ({ role: r, realAnswer: ra }: { role: 'truth' | 'bluffer'; realAnswer?: string }) => {
      setRole(r)
      if (r === 'truth' && ra) setRealAnswer(ra)
    })

    socket.on('bluffing:submitted', () => {
      setSubmitted(true)
    })

    socket.on('bluffing:progress', ({ submitted: s, total: t }: { submitted: number; total: number }) => {
      setProgress({ submitted: s, total: t })
    })

    return () => {
      socket.off('bluffing:role')
      socket.off('bluffing:submitted')
      socket.off('bluffing:progress')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || submitted) return
    const socket = getSocket()
    socket.emit('bluffing:submit', { text: inputText.trim() })
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6" dir="rtl">
      {/* Question text */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4">
        <p className="text-xs text-white/50 mb-1">السؤال</p>
        <h2 className="text-lg font-bold text-white leading-relaxed">{question.text}</h2>
      </div>

      {/* Role badge */}
      {role === 'truth' && (
        <div className="bg-green-500/15 border border-green-400/30 backdrop-blur-xl rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-green-400 uppercase tracking-wide">أنت تعرف الحقيقة</span>
          <p className="text-base font-semibold text-white">الإجابة الصحيحة: <span className="text-green-300">{realAnswer}</span></p>
          <p className="text-sm text-white/60">ادافع عن إجابتك الصحيحة بشكل مقنع — لا تجعل الآخرين يعرفون أنك تعرفها</p>
        </div>
      )}

      {role === 'bluffer' && (
        <div className="bg-yellow-500/15 border border-yellow-400/30 backdrop-blur-xl rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">أنت تخمّن</span>
          <p className="text-sm text-white/60">اخترع إجابة مقنعة تجعل الآخرين يصوتون لك — كن واثقاً</p>
        </div>
      )}

      {/* Input form */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={200}
            placeholder="اكتب إجابتك هنا…"
            rows={3}
            className="w-full rounded-xl border border-white/20 bg-white/5 backdrop-blur-xl text-white placeholder:text-white/30 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">{inputText.length}/200</span>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-bold text-white transition-colors shadow-[0_0_16px_rgba(79,70,229,0.4)]"
            >
              أرسل الإجابة
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 text-center space-y-3">
          <p className="text-base font-bold text-green-400">تم إرسال إجابتك ✓</p>
          {progress && (
            <div className="space-y-2">
              <p className="text-xs text-white/50">
                {progress.submitted} من {progress.total} أجابوا
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.submitted / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {!progress && (
            <p className="text-xs text-white/40 animate-pulse">في انتظار بقية اللاعبين…</p>
          )}
        </div>
      )}
    </div>
  )
}
