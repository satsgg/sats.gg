import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'
import LightningBolt from '~/svgs/lightning-bolt.svg'
import { getZapAmountFromReceipt, parseZapRequest } from '~/utils/nostr'
import { fmtNumber } from '~/utils/util'

const ZapChatMessage = ({ note }: { note: NostrEvent<9735> }) => {
  const zapRequestTag = note.tags.find((t) => t[0] == 'description')
  if (!zapRequestTag || !zapRequestTag[1]) return

  const zapRequest: NostrEvent<9734> = JSON.parse(zapRequestTag[1])
  const zap = parseZapRequest(zapRequest)
  if (!zap) return

  const amount = getZapAmountFromReceipt(note)
  if (!amount) return

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
            zapped {fmtNumber(amount, true)} sats!
            <br />
            <Message content={zapRequest.content} />
          </span>
        </p>
      </div>
    </div>
  )
}

export default ZapChatMessage
