import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'
import { useRef } from 'react'
import LightningBolt from '~/svgs/lightning-bolt.svg'

const parseZapRequest = (note: NostrEvent) => {
  const zapRequest = note.tags.find((t) => t[0] == 'description')
  if (zapRequest && zapRequest[1]) {
    const requestJson = JSON.parse(zapRequest[1])
    return requestJson
  }
  return null
}

const ZapChatMessage = ({ note }: { note: NostrEvent }) => {
  const zapRequest = useRef(parseZapRequest(note))

  if (!zapRequest.current) return null

  return (
    <div className="break-words px-2 py-1">
      <div className="flex rounded bg-primary bg-opacity-10 px-1 py-1">
        <div className="text-sm text-white">
          <LightningBolt className="inline-flex" height={15} width={15} strokeWidth={1.5} />
        </div>
        <p className="pl-1 leading-none">
          <ChatUser pubkey={zapRequest.current.pubkey} />
          <span className="text-sm text-white">
            {' '}
            zapped {zapRequest.current.tags[1][1] / 1000} sats! <br />
            <Message content={zapRequest.current.content} />
          </span>
        </p>
      </div>
    </div>
  )
}

export default ZapChatMessage
