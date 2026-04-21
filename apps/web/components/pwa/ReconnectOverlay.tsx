'use client'

interface ReconnectOverlayProps {
  isConnected: boolean
}

export function ReconnectOverlay({ isConnected }: ReconnectOverlayProps) {
  if (isConnected) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-400" />
        <p className="text-lg font-semibold text-white">جاري إعادة الاتصال...</p>
        <p className="text-sm text-white/50">تأكد من اتصالك بالإنترنت</p>
      </div>
    </div>
  )
}
