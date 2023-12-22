import { Event as NostrEvent } from 'nostr-tools'
import ChatUser from './ChatUser'
import Message from './Message'
import LightningBolt from '~/svgs/lightning-bolt.svg'
import { getZapAmountFromReceipt, parseZapRequest } from '~/utils/nostr'
import { fmtNumber } from '~/utils/util'

const ZapChatMessage = ({ pubkey, amount, content }: { pubkey: string; amount: number; content: string }) => {
  return (
    <div className="break-words px-2 py-1">
      <div className="flex rounded bg-primary bg-opacity-10 px-1 py-1">
        <div className="text-sm text-white">
          <LightningBolt className="inline-flex" height={15} width={15} strokeWidth={1.5} />
        </div>
        <p className="min-w-0 pl-1 leading-none">
          <ChatUser pubkey={pubkey} />
          <span className="text-sm text-white">
            {' '}
            zapped {fmtNumber(amount, true)} sats!
            <br />
            <Message content={content} />
          </span>
        </p>
      </div>
    </div>
  )
}

export default ZapChatMessage
