import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'
import { useProfile } from '~/hooks/useProfile'

const ChatMessage = ({ channelPubkey, note }: { channelPubkey: string; note: NostrEvent }) => {
  const { profile, isLoading } = useProfile(note.pubkey)

  return (
    <div className={`break-words px-3 ${isLoading ? 'opacity-0' : ''}`}>
      <ChatUser channelPubkey={channelPubkey} pubkey={note.pubkey} profile={profile} />
      <span className="text-sm text-white">: </span>
      <Message content={note.content} />
    </div>
  )
}

export default ChatMessage
