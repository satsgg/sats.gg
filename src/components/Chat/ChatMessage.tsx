import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'

const ChatMessage = ({ note }: { note: NostrEvent }) => {
  return (
    <div className="break-words px-3">
      <ChatUser pubkey={note.pubkey} />
      <span className="text-sm text-white">: </span>
      <Message content={note.content} />
    </div>
  )
}

export default ChatMessage
