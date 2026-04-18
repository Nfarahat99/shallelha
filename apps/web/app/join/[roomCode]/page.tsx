import type { Metadata } from 'next'
import { PlayerJoin } from './PlayerJoin'

interface Props {
  params: { roomCode: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const roomCode = params.roomCode.toUpperCase()
  return {
    title: 'انضم لجلسة شعللها 🎮',
    description: 'لديك دعوة للعب — اضغط للانضمام',
    openGraph: {
      title: 'انضم لجلسة شعللها 🎮',
      description: 'لديك دعوة للعب — اضغط للانضمام',
      type: 'website',
      images: [`/api/og/result?roomCode=${roomCode}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'انضم لجلسة شعللها 🎮',
      description: 'لديك دعوة للعب — اضغط للانضمام',
    },
  }
}

export default function JoinRoomPage({ params }: Props) {
  return <PlayerJoin roomCode={params.roomCode.toUpperCase()} />
}
