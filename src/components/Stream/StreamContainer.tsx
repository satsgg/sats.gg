import { Stream } from './Stream'
import { StreamBio } from './StreamBio'

export const StreamContainer = ({ channelPubkey }: { channelPubkey: string }) => {
  return (
    <div className="flex w-full grow flex-col">
      <div className="no-scrollbar flex grow flex-col overflow-y-auto">
        <div className="max-h-[calc(100vh-9rem)]">
          <Stream channelPubkey={channelPubkey} />
        </div>

        <StreamBio channelPubkey={channelPubkey} />
      </div>
    </div>
  )
}
