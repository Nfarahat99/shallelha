'use client'

import { ButtonHTMLAttributes } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean
  children: React.ReactNode
  className?: string
}

export default function LoadingButton({
  loading,
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`min-h-[44px] ${loading ? 'opacity-70 pointer-events-none cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"
          />
          جارٍ الانضمام...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
