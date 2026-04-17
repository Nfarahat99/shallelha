'use client'

import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// AnimatedCounter — counts up from 0 to `target` when the element enters
// the viewport. Falls back to the static value immediately for reduced-motion
// and for users without JS.
// ---------------------------------------------------------------------------
interface AnimatedCounterProps {
  target: number
  suffix?: string
  className?: string
}

export function AnimatedCounter({ target, suffix = '', className = '' }: AnimatedCounterProps) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1200 // ms
          const steps = 40
          const stepValue = target / steps
          const stepTime = duration / steps
          let current = 0
          const timer = setInterval(() => {
            current += stepValue
            if (current >= target) {
              setValue(target)
              clearInterval(timer)
            } else {
              setValue(Math.round(current))
            }
          }, stepTime)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  )
}
