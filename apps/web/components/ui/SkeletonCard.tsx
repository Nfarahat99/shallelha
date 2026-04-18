'use client'

interface SkeletonCardProps {
  count?: number
}

export default function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  const opacities = [0.6, 0.4, 0.25]

  return (
    <div className="space-y-2 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full h-[56px] bg-white/10 rounded-xl animate-pulse"
          style={{ opacity: opacities[i] ?? 0.2 }}
        />
      ))}
    </div>
  )
}
