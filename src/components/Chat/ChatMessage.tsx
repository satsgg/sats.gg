import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'

const ChatMessage = ({ channelPubkey, note }: { channelPubkey: string; note: NostrEvent }) => {
  return (
    <div className="break-words px-3">
      <ChatUser channelPubkey={channelPubkey} pubkey={note.pubkey} />
      <span className="text-sm text-white">: </span>
      <Message content={note.content} />
    </div>
  )
}

export default ChatMessage
