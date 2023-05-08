import { useProfile } from '~/hooks/useProfile'
import FollowButton from './FollowButton'
import LightningBolt from '~/svgs/lightning-bolt.svg'
import { nip19 } from 'nostr-tools'
import ProfileImg from '../ProfileImg'
import { displayName } from '~/utils/nostr'
import { UserMetadataStore } from '~/store/db'
import { StreamStatus } from '@prisma/client'

// zap related libs
import { nip57 } from 'nostr-tools'

const ZapButton = ({
  channelProfile,
  channelProfileIsLoading,
}: {
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
}) => {
  const handleZapClick = async () => {
    console.debug('handleZapClick')

    console.debug('channelProfile', channelProfile)
  }

  return (
    <button className={'inline-flex h-8 items-center space-x-1 rounded bg-primary px-3 py-1'} onClick={handleZapClick}>
      <LightningBolt height={20} width={20} strokeWidth={1.5} />
    </button>
  )
}

export const StreamBio = ({
  channelPubkey,
  channelProfile,
  channelProfileIsLoading,
  streamTitle,
  streamStatus,
}: {
  channelPubkey: string
  channelProfile: UserMetadataStore | undefined
  channelProfileIsLoading: boolean
  streamTitle: string | null | undefined
  streamStatus: string | undefined
}) => {
  const handleZapClick = async () => {}

  return (
    <div id="streamBioWrapper" className="flex grow flex-col gap-4 px-4 py-2 md:px-6 md:py-4">
      <div id="profile" className="flex gap-2">
        <div className="h-12 w-12 shrink-0 md:h-16 md:w-16">
          {channelProfileIsLoading ? (
            <div className="h-full w-full rounded-[50%] bg-gray-600" />
          ) : (
            <ProfileImg
              pubkey={channelPubkey}
              picture={channelProfile?.picture}
              liveBorder={streamStatus === StreamStatus.ACTIVE}
            />
          )}
        </div>

        <div className="flex w-full min-w-0 justify-between">
          <div className="flex min-w-0 flex-col">
            <span className="min-h-0 truncate text-lg font-bold text-white">
              {!channelProfileIsLoading && displayName(channelPubkey, channelProfile)}
            </span>
            {streamTitle && (
              <span className="min-h-0 truncate break-words text-lg text-white xl:whitespace-normal">
                {streamTitle}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <FollowButton pubkey={channelPubkey} />
            <ZapButton channelProfile={channelProfile} channelProfileIsLoading={channelProfileIsLoading} />
          </div>
        </div>
      </div>

      <div id="about" className="hidden rounded bg-stone-800 p-12 sm:block">
        <p className="font-semi text-xl text-white">About {channelProfile?.name}</p>
        <p className="font-semi text-lg text-white">{channelProfile?.about}</p>
      </div>

      <div className="hidden h-screen w-full border-4 border-cyan-500 sm:block" />
    </div>
  )
}
