export default function HostLoading() {
  return (
    <div
      dir="rtl"
      className="max-w-2xl mx-auto p-6 space-y-4 animate-pulse pointer-events-none"
    >
      <div className="w-full h-12 bg-gray-200 rounded-xl" />
      <div className="w-3/4 h-8 bg-gray-200 rounded-xl" />
      <div className="w-1/2 h-8 bg-gray-200 rounded-xl" />
    </div>
  )
}
