import { Stream } from './Stream'
import { StreamBio } from './StreamBio'

export const StreamContainer = ({ pubkey }: { pubkey: string }) => {
  return (
    <div className="flex w-full grow flex-col">
      <div className="no-scrollbar flex grow flex-col overflow-y-auto">
        <div className="max-h-[calc(100vh-9rem)]">
          <Stream channelPubkey={pubkey} />
        </div>

        <StreamBio channelPubkey={pubkey} />
      </div>
    </div>
  )
}
