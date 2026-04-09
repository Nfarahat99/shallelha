import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Server Component — reads session and renders host dashboard entry point.
// Middleware already blocks unauthenticated users, but we double-check here.
export default async function HostPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">شعللها</h1>
        <p className="text-gray-500 text-sm">
          مرحباً، {session.user.name ?? session.user.email}
        </p>
      </div>

      {/* HostDashboard is a Client Component that creates the room */}
      <CreateRoomButton />
    </main>
  )
}

// Inline client component to avoid a separate file for this small piece
function CreateRoomButton() {
  // This is intentionally a server component redirect to /host/[roomCode]
  // The actual room creation happens in HostDashboard after socket connect
  return (
    <a
      href="/host/new"
      className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white hover:bg-indigo-700 transition-colors"
    >
      أنشئ غرفة جديدة
    </a>
  )
}
