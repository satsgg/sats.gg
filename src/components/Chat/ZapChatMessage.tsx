import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'
import LightningBolt from '~/svgs/lightning-bolt.svg'
import { parseZapRequest } from '~/utils/nostr'

const ZapChatMessage = ({ note }: { note: NostrEvent }) => {
  const zapRequest = parseZapRequest(note)

  if (!zapRequest) return null

  return (
    <div className="break-words px-2 py-1">
      <div className="flex rounded bg-primary bg-opacity-10 px-1 py-1">
        <div className="text-sm text-white">
          <LightningBolt className="inline-flex" height={15} width={15} strokeWidth={1.5} />
        </div>
        <p className="min-w-0 pl-1 leading-none">
          <ChatUser pubkey={zapRequest.pubkey} />
          <span className="text-sm text-white">
            {' '}
            zapped {zapRequest.tags[1][1] / 1000} sats! <br />
            <Message content={zapRequest.content} />
          </span>
        </p>
      </div>
    </div>
  )
}

export default ZapChatMessage
