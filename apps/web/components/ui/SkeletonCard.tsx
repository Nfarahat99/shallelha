'use client'

interface SkeletonCardProps {
  count?: number
}

export default function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  const opacities = [1, 0.7, 0.4]

  return (
    <div className="space-y-2 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full h-[56px] bg-gray-200 rounded-xl animate-pulse"
          style={{ opacity: opacities[i] ?? 0.4 }}
        />
      ))}
    </div>
  )
}
