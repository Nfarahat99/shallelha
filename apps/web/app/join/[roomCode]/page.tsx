import { PlayerJoin } from './PlayerJoin'

interface Props {
  params: { roomCode: string }
}

export default function JoinRoomPage({ params }: Props) {
  return <PlayerJoin roomCode={params.roomCode.toUpperCase()} />
}
